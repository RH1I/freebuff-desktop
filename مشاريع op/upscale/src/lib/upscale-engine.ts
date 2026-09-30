// UpscaleEngine v2 — extracted & cleaned from production bundle
// Pipeline: gradient(edges) -> upscale(edge-guided) -> postProcess(sharpen)
// WebGL2 required. All original GLSL preserved.

const VERT_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = (a_position + 1.0) * 0.5;
}
`;

const GRADIENT_FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_texelSize;

in vec2 v_texCoord;
out vec4 fragColor;

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec3 tl = texture(u_image, v_texCoord + vec2(-u_texelSize.x, -u_texelSize.y)).rgb;
  vec3 tc = texture(u_image, v_texCoord + vec2( 0.0,              -u_texelSize.y)).rgb;
  vec3 tr = texture(u_image, v_texCoord + vec2( u_texelSize.x, -u_texelSize.y)).rgb;
  vec3 ml = texture(u_image, v_texCoord + vec2(-u_texelSize.x,  0.0)).rgb;
  vec3 mc = texture(u_image, v_texCoord).rgb;
  vec3 mr = texture(u_image, v_texCoord + vec2( u_texelSize.x,  0.0)).rgb;
  vec3 bl = texture(u_image, v_texCoord + vec2(-u_texelSize.x,  u_texelSize.y)).rgb;
  vec3 bc = texture(u_image, v_texCoord + vec2( 0.0,               u_texelSize.y)).rgb;
  vec3 br = texture(u_image, v_texCoord + vec2( u_texelSize.x,  u_texelSize.y)).rgb;

  float gx = luma(mr - ml) * 2.0 + luma(tr - tl) + luma(br - bl);
  float gy = luma(bc - tc) * 2.0 + luma(bl - tl) + luma(br - tr);
  float edge = length(vec2(gx, gy));

  vec3 mean = (tl + tc + tr + ml + mc + mr + bl + bc + br) / 9.0;
  float variance = 0.0;
  variance += dot(tl - mean, tl - mean);
  variance += dot(tc - mean, tc - mean);
  variance += dot(tr - mean, tr - mean);
  variance += dot(ml - mean, ml - mean);
  variance += dot(mc - mean, mc - mean);
  variance += dot(mr - mean, mr - mean);
  variance += dot(bl - mean, bl - mean);
  variance += dot(bc - mean, bc - mean);
  variance += dot(br - mean, br - mean);
  variance /= 9.0;

  fragColor = vec4(gx, gy, edge, variance);
}
`;

const UPSCALE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_gradient;
uniform vec2 u_texelSize;
uniform float u_scaleFactor;
uniform float u_sharpStrength;

in vec2 v_texCoord;
out vec4 fragColor;

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec4 grad = texture(u_gradient, v_texCoord);
  float gx = grad.r;
  float gy = grad.g;
  float edge = grad.b;
  float variance = grad.a;

  vec3 tl = texture(u_image, v_texCoord + vec2(-u_texelSize.x, -u_texelSize.y)).rgb;
  vec3 tc = texture(u_image, v_texCoord + vec2( 0.0,              -u_texelSize.y)).rgb;
  vec3 tr = texture(u_image, v_texCoord + vec2( u_texelSize.x, -u_texelSize.y)).rgb;
  vec3 ml = texture(u_image, v_texCoord + vec2(-u_texelSize.x,  0.0)).rgb;
  vec3 mc = texture(u_image, v_texCoord).rgb;
  vec3 mr = texture(u_image, v_texCoord + vec2( u_texelSize.x,  0.0)).rgb;
  vec3 bl = texture(u_image, v_texCoord + vec2(-u_texelSize.x,  u_texelSize.y)).rgb;
  vec3 bc = texture(u_image, v_texCoord + vec2( 0.0,               u_texelSize.y)).rgb;
  vec3 br = texture(u_image, v_texCoord + vec2( u_texelSize.x,  u_texelSize.y)).rgb;

  vec3 localMin = min(min(min(tl, tc), min(tr, ml)),
                      min(min(mc, mr), min(bl, min(bc, br))));
  vec3 localMax = max(max(max(tl, tc), max(tr, ml)),
                      max(max(mc, mr), max(bl, max(bc, br))));

  vec3 result = mc;
  float edgeT = smoothstep(0.005, 0.12, edge);

  if (edge > 0.005) {
    vec2 dir = vec2(gx, gy);
    float dirLen = length(dir);
    if (dirLen > 0.001) {
      dir = dir / dirLen;
      vec2 offset = dir * u_texelSize;
      vec3 s1 = texture(u_image, v_texCoord + offset).rgb;
      vec3 s2 = texture(u_image, v_texCoord - offset).rgb;
      vec3 dirAvg = (s1 + s2) * 0.5;

      vec2 perpDir = vec2(-dir.y, dir.x);
      vec2 perpOffset = perpDir * u_texelSize;
      vec3 p1 = texture(u_image, v_texCoord + perpOffset).rgb;
      vec3 p2 = texture(u_image, v_texCoord - perpOffset).rgb;
      vec3 perpAvg = (p1 + p2) * 0.5;

      float alongWeight = edgeT * u_sharpStrength;
      float perpWeight = edgeT * u_sharpStrength * 0.5;
      result = mc + (dirAvg - mc) * alongWeight + (perpAvg - mc) * perpWeight;
    }
  }

  vec3 blur3x3 = (tl + tc + tr + ml + mc + mr + bl + bc + br) / 9.0;
  vec3 sharp = mc + (mc - blur3x3) * u_sharpStrength * 1.5;
  result = mix(result, sharp, edgeT * 0.7);

  result = clamp(result, localMin, localMax);

  float flatT = smoothstep(0.0005, 0.003, variance);
  result = mix(blur3x3, result, flatT);

  fragColor = vec4(result, 1.0);
}
`;

const POST_FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_gradient;
uniform vec2 u_outputTexelSize;
uniform float u_sharpStrength;

in vec2 v_texCoord;
out vec4 fragColor;

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec4 grad = texture(u_gradient, v_texCoord);
  float edge = grad.b;

  vec3 mc = texture(u_image, v_texCoord).rgb;

  // 5-tap cross Gaussian — sampled at OUTPUT texel size
  vec3 s_up    = texture(u_image, v_texCoord + vec2( 0.0,                    -u_outputTexelSize.y)).rgb;
  vec3 s_down  = texture(u_image, v_texCoord + vec2( 0.0,                     u_outputTexelSize.y)).rgb;
  vec3 s_left  = texture(u_image, v_texCoord + vec2(-u_outputTexelSize.x,  0.0)).rgb;
  vec3 s_right = texture(u_image, v_texCoord + vec2( u_outputTexelSize.x,  0.0)).rgb;

  vec3 blur5 = mc * 0.38774
             + s_up    * 0.15306
             + s_down  * 0.15306
             + s_left  * 0.15306
             + s_right * 0.15306;

  // 9-tap 3x3 box — sampled at OUTPUT texel size
  vec3 tl = texture(u_image, v_texCoord + vec2(-u_outputTexelSize.x, -u_outputTexelSize.y)).rgb;
  vec3 tc = texture(u_image, v_texCoord + vec2( 0.0,                    -u_outputTexelSize.y)).rgb;
  vec3 tr = texture(u_image, v_texCoord + vec2( u_outputTexelSize.x, -u_outputTexelSize.y)).rgb;
  vec3 ml = texture(u_image, v_texCoord + vec2(-u_outputTexelSize.x,  0.0)).rgb;
  vec3 mr = texture(u_image, v_texCoord + vec2( u_outputTexelSize.x,  0.0)).rgb;
  vec3 bl = texture(u_image, v_texCoord + vec2(-u_outputTexelSize.x,  u_outputTexelSize.y)).rgb;
  vec3 bc = texture(u_image, v_texCoord + vec2( 0.0,                     u_outputTexelSize.y)).rgb;
  vec3 br = texture(u_image, v_texCoord + vec2( u_outputTexelSize.x,  u_outputTexelSize.y)).rgb;

  vec3 blur9 = (tl + tc + tr + ml + mc + mr + bl + bc + br) / 9.0;

  // DoG deblur
  vec3 dog = blur5 - blur9;
  vec3 deblurred = mc + dog * u_sharpStrength * 2.0;

  float edgeT = smoothstep(0.005, 0.12, edge);
  vec3 result = mix(mc, deblurred, edgeT * 0.6);

  vec3 localMin = min(min(min(tl, tc), min(tr, ml)),
                      min(min(mc, mr), min(bl, min(bc, br))));
  vec3 localMax = max(max(max(tl, tc), max(tr, ml)),
                      max(max(mc, mr), max(bl, max(bc, br))));
  result = clamp(result, localMin, localMax);

  fragColor = vec4(result, 1.0);
}
`;

const createProgram = function createProgram(e,t,r){let n=compileShader(e,e.VERTEX_SHADER,t),o=compileShader(e,e.FRAGMENT_SHADER,r),i=e.createProgram();if(e.bindAttribLocation(i,0,"a_position"),e.attachShader(i,n),e.attachShader(i,o),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS)){let t=e.getProgramInfoLog(i);throw e.deleteProgram(i),Error(`Program link error: ${t}`)}return e.deleteShader(n),e.deleteShader(o),i}

const createTex = function createTex(e,t,r){let n=e.createTexture();return e.bindTexture(e.TEXTURE_2D,n),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,t,r,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),n}

const createFBO = function createFBO(e,t,r){let n=createTex(e,t,r),o=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,o),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,n,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{fbo:o,texture:n}}

const compileShader = function compileShader(e,t,r){let n=e.createShader(t);if(e.shaderSource(n,r),e.compileShader(n),!e.getShaderParameter(n,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(n);throw e.deleteShader(n),Error(`Shader compile error: ${t}`)}return n}

const QUALITY: Record<string, { sharpness: number; usePostProcess: boolean }> = {
  fast: { sharpness: 0.4, usePostProcess: false },
  balanced: { sharpness: 0.6, usePostProcess: true },
  high: { sharpness: 0.8, usePostProcess: true },
};

// Canvas dimension guard — browsers cap canvas area/dimensions.
export const MAX_CANVAS_DIM = 16384;
export const MAX_CANVAS_PIXELS = 268_435_456; // 16384² (Chrome hard cap)

export function checkOutputSize(w: number, h: number, scale: number): { ok: boolean; outW: number; outH: number; reason?: string } {
  const outW = Math.round(w * scale);
  const outH = Math.round(h * scale);
  if (outW > MAX_CANVAS_DIM || outH > MAX_CANVAS_DIM)
    return { ok: false, outW, outH, reason: `الناتج ${outW}×${outH} يتجاوز الحد الأقصى ${MAX_CANVAS_DIM}px — صغّر المقياس أو استخدم صورة أصغر` };
  if (outW * outH > MAX_CANVAS_PIXELS)
    return { ok: false, outW, outH, reason: `الناتج ${(outW * outH / 1e6).toFixed(0)}MP يتجاوز حد الكانفس (${MAX_CANVAS_PIXELS / 1e6}MP) — جرّب مقياساً أصغر` };
  return { ok: true, outW, outH };
}

export class UpscaleEngine{canvas;gl;gradientProgram;upscaleProgram;postProcessProgram;quadVAO;inputTexture;gradientFBO;upscaleFBO;gradientUniforms;upscaleUniforms;postUniforms;imgWidth=0;imgHeight=0;_iw=0;_ih=0;_is=0;constructor(){this.canvas=document.createElement("canvas");const e=this.canvas.getContext("webgl2",{alpha:!1,antialias:!1,preserveDrawingBuffer:!0});if(!e)throw Error("WebGL2 not supported");this.gl=e}get displayCanvas(){return this.canvas}setupGL(e,t,r){let n=this.gl;const out=checkOutputSize(e,t,r);if(!out.ok)throw Error(out.reason||"Output too large");this.imgWidth=e,this.imgHeight=t;let o=out.outW,i=out.outH;this.canvas.width=o,this.canvas.height=i,n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!0);let a=e===this._iw&&t===this._ih&&r===this._is;if(a)return;this._releaseGLResources();this.gradientProgram=createProgram(n,VERT_SHADER,GRADIENT_FRAG),this.upscaleProgram=createProgram(n,VERT_SHADER,UPSCALE_FRAG),this.postProcessProgram=createProgram(n,VERT_SHADER,POST_FRAG),this.gradientUniforms={u_image:n.getUniformLocation(this.gradientProgram,"u_image"),u_texelSize:n.getUniformLocation(this.gradientProgram,"u_texelSize")},this.upscaleUniforms={u_image:n.getUniformLocation(this.upscaleProgram,"u_image"),u_gradient:n.getUniformLocation(this.upscaleProgram,"u_gradient"),u_texelSize:n.getUniformLocation(this.upscaleProgram,"u_texelSize"),u_scaleFactor:n.getUniformLocation(this.upscaleProgram,"u_scaleFactor"),u_sharpStrength:n.getUniformLocation(this.upscaleProgram,"u_sharpStrength")},this.postUniforms={u_image:n.getUniformLocation(this.postProcessProgram,"u_image"),u_gradient:n.getUniformLocation(this.postProcessProgram,"u_gradient"),u_outputTexelSize:n.getUniformLocation(this.postProcessProgram,"u_outputTexelSize"),u_sharpStrength:n.getUniformLocation(this.postProcessProgram,"u_sharpStrength")},this.quadVAO=n.createVertexArray(),n.bindVertexArray(this.quadVAO);let s=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,s),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),n.STATIC_DRAW),n.enableVertexAttribArray(0),n.vertexAttribPointer(0,2,n.FLOAT,!1,0,0),n.bindVertexArray(null),this.inputTexture=createTex(n,e,t),this.gradientFBO=createFBO(n,e,t),this.upscaleFBO=createFBO(n,o,i),n.viewport(0,0,o,i),this._iw=e,this._ih=t,this._is=r}_releaseGLResources(){let e=this.gl;try{this.gradientProgram&&e.deleteProgram(this.gradientProgram),this.upscaleProgram&&e.deleteProgram(this.upscaleProgram),this.postProcessProgram&&e.deleteProgram(this.postProcessProgram),this.inputTexture&&e.deleteTexture(this.inputTexture),this.gradientFBO&&(e.deleteFramebuffer(this.gradientFBO.fbo),e.deleteTexture(this.gradientFBO.texture)),this.upscaleFBO&&(e.deleteFramebuffer(this.upscaleFBO.fbo),e.deleteTexture(this.upscaleFBO.texture)),this.quadVAO&&e.deleteVertexArray(this.quadVAO)}catch{}this.gradientProgram=this.upscaleProgram=this.postProcessProgram=null,this.inputTexture=null,this.gradientFBO=null,this.upscaleFBO=null,this.quadVAO=null,this._iw=this._ih=this._is=0}processFrame(e,t,r,n){let o=this.gl;o.bindTexture(o.TEXTURE_2D,this.inputTexture),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,o.RGBA,o.UNSIGNED_BYTE,e),o.bindFramebuffer(o.FRAMEBUFFER,this.gradientFBO.fbo),o.viewport(0,0,this.imgWidth,this.imgHeight),o.useProgram(this.gradientProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.inputTexture),o.uniform1i(this.gradientUniforms.u_image,0),o.uniform2f(this.gradientUniforms.u_texelSize,1/this.imgWidth,1/this.imgHeight),o.bindVertexArray(this.quadVAO),o.drawArrays(o.TRIANGLE_STRIP,0,4);let i=this.imgWidth*t,a=this.imgHeight*t;o.bindFramebuffer(o.FRAMEBUFFER,n?this.upscaleFBO.fbo:null),o.viewport(0,0,i,a),o.useProgram(this.upscaleProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.inputTexture),o.uniform1i(this.upscaleUniforms.u_image,0),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,this.gradientFBO.texture),o.uniform1i(this.upscaleUniforms.u_gradient,1),o.uniform2f(this.upscaleUniforms.u_texelSize,1/this.imgWidth,1/this.imgHeight),o.uniform1f(this.upscaleUniforms.u_scaleFactor,t),o.uniform1f(this.upscaleUniforms.u_sharpStrength,r),o.drawArrays(o.TRIANGLE_STRIP,0,4),n&&(o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,i,a),o.useProgram(this.postProcessProgram),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.upscaleFBO.texture),o.uniform1i(this.postUniforms.u_image,0),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,this.gradientFBO.texture),o.uniform1i(this.postUniforms.u_gradient,1),o.uniform2f(this.postUniforms.u_outputTexelSize,1/i,1/a),o.uniform1f(this.postUniforms.u_sharpStrength,r),o.drawArrays(o.TRIANGLE_STRIP,0,4))}async process(e,t,r){let{scaleFactor:n,quality:o}=t,i=(QUALITY as any)[o],a=URL.createObjectURL(e),l=new Image;await new Promise<void>((e,t)=>{l.onload=()=>e(),l.onerror=()=>{URL.revokeObjectURL(a),t(Error("Failed to load image. Make sure the file is a valid image format."))},l.src=a});let s=l.naturalWidth,c=l.naturalHeight;if(!s||!c)throw URL.revokeObjectURL(a),Error("Could not read image dimensions. The file may be corrupted.");this.setupGL(s,c,n),r(.1),this.processFrame(l,n,i.sharpness,i.usePostProcess),r(.9),URL.revokeObjectURL(a);let u=s*n,d=c*n,f=await new Promise<Blob>((e,t)=>{try{this.canvas.toBlob((r:Blob|null)=>{r?e(r):t(Error("Failed to export image. The output may be too large."))},"image/png")}catch(e){t(Error("Failed to export image. The output may be too large for your browser."))}}),m=URL.createObjectURL(f);return r(1),{blob:f,url:m,width:u,height:d,originalWidth:s,originalHeight:c,fileSize:f.size}}destroy(){this._releaseGLResources()}}

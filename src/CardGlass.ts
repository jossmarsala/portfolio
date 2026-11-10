/**
 * CardGlass.ts
 *
 * Liquid-glass distortion & chromatic aberration shader strictly contained
 * within each carousel image card element.
 *
 * In the center of the carousel (edgeDistort ≈ 0), the image is 100% clean and crisp.
 * Towards the sides of the carousel (edgeDistort -> 1), the image undergoes
 * optical refraction, liquid wave bending, and RGB chromatic aberration.
 *
 * The shader canvas is mounted inside the card element itself, guaranteeing
 * that the effect is 100% contained to the images and never touches the background.
 */

import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";

const vertex = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform float     uTime;
uniform float     uEdgeDistort; // 0 in center, 1 at carousel sides
uniform float     uNormX;       // -1 (bottom-left) to +1 (top-right)
uniform float     uDistort;
uniform float     uChroma;
uniform vec2      uCover;       // emulates object-fit: cover

in  vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

vec4 sampleTex(vec2 uv) {
  return texture(uTexture, clamp(uv, 0.001, 0.999));
}

void main() {
  vec2 uv = vUv;
  // Match the <img> behind the canvas: crop to fill the card.
  vec2 coverUv = (uv - 0.5) * uCover + 0.5;

  // Center of carousel: 100% pristine, clean, crisp image (no RGB split, no distortion)
  if (uEdgeDistort <= 0.002) {
    fragColor = sampleTex(coverUv);
    return;
  }

  // Radial field from center of card
  vec2 st = uv * 2.0 - 1.0;
  float dist = length(st);

  // Which side of the card faces away from the viewport centre?
  // uNormX < 0 means the card sits on the left, so its outer edge is uv.x ≈ 0.
  float outward = uNormX < 0.0 ? (1.0 - uv.x) : uv.x;
  float edgeBias = smoothstep(0.12, 1.0, outward);

  // Ramp the lens toward the outward-facing edge so the bend reads as a hard
  // refractive kink at the carousel's left/right edge, not a uniform blur.
  float mask =
    smoothstep(0.05, 1.1, dist) * mix(0.25, 1.0, edgeBias) * uEdgeDistort * uDistort;

  // Animated liquid flow drift
  vec2 drift = vec2(uTime * 0.05 * sign(uNormX), -uTime * 0.04);
  float n1 = fbm(uv * 3.0 + drift);
  float n2 = fbm((uv + 15.3) * 3.4 - drift.yx);
  vec2 flow = (vec2(n1, n2) - 0.5) * mask * 0.15;

  // Lateral bending driven by the conveyor belt motion
  vec2 bend = vec2(-uNormX * abs(uNormX), 0.0) * mask * 0.12;

  // Lens squeeze: pinch the card horizontally where it passes through the glass
  float squeeze = smoothstep(0.45, 1.0, outward) * uEdgeDistort;
  vec2 warp = vec2(-uNormX * squeeze * (0.06 + abs(uNormX) * 0.05), 0.0);

  vec2 displaced = uv + flow + bend + warp;

  // Prismatic chromatic aberration (RGB channel splitting along displacement vector)
  vec2 splitVec = flow + bend + warp;
  float splitLen = length(splitVec);
  vec2 splitDir = splitLen > 0.0001 ? splitVec / splitLen : vec2(0.7071, 0.7071);
  float chromaAmt = uChroma * mask * 0.12;
  vec2 split = splitDir * chromaAmt;

  vec2 displacedTex = (displaced - 0.5) * uCover + 0.5;
  vec2 splitTex = split * uCover;

  float r = sampleTex(displacedTex + splitTex).r;
  float g = sampleTex(displacedTex).g;
  float b = sampleTex(displacedTex - splitTex).b;
  float a = sampleTex(displacedTex).a;

  // Liquid glass rim specular highlight
  float rim = smoothstep(0.65, 0.98, dist) * 0.12 * uEdgeDistort;
  vec3 color = vec3(r, g, b) + rim;

  // Liquid silhouette: ripple the outline of the image itself a touch while it
  // crosses the lens, so it isn't a perfectly rigid rectangle.
  vec2 p = uv * 2.0 - 1.0;
  float shapeRadius = 0.05;
  vec2 shapeD = abs(p) - (1.0 - shapeRadius);
  float sd = length(max(shapeD, 0.0)) + min(max(shapeD.x, shapeD.y), 0.0) - shapeRadius;
  float wobbleAmp = 0.004 + 0.06 * uEdgeDistort * mix(0.4, 1.0, edgeBias);
  float wobble = (fbm(uv * 2.6 + vec2(uTime * 0.11, uTime * 0.07)) - 0.5) * wobbleAmp;
  float shapeAlpha = 1.0 - smoothstep(-0.012, 0.012, sd + wobble);

  fragColor = vec4(color, a * shapeAlpha);
}
`;

interface CardGlassInstance {
  renderer: Renderer;
  program: Program;
  mesh: Mesh;
  canvas: HTMLCanvasElement;
  fallbackImg: HTMLImageElement | null;
  raf: number;
  startTime: number;
  disposed: boolean;
  edgeDistort: number;
  normX: number;
  render: () => void;
  _cleanup: () => void;
}

const instances = new WeakMap<HTMLElement, CardGlassInstance>();

export function mountCardGlass(
  card: HTMLElement,
  imageSrc: string,
  options?: { distort?: number; chroma?: number }
): void {
  if (instances.has(card)) return;

  let renderer: Renderer;
  try {
    renderer = new Renderer({
      webgl: 2,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
  } catch {
    return; // Fallback to plain img
  }

  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const canvas = gl.canvas as HTMLCanvasElement;
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    pointerEvents: "none",
    borderRadius: "inherit",
    overflow: "hidden",
    zIndex: "1",
  });
  canvas.setAttribute("aria-hidden", "true");
  card.appendChild(canvas);

  // If the GPU context dies, fall back to the plain <img>.
  canvas.addEventListener("webglcontextlost", () => {
    const inst = instances.get(card);
    if (inst?.fallbackImg) {
      inst.fallbackImg.style.removeProperty("visibility");
    }
  });

  const texture = new Texture(gl, {
    generateMipmaps: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTexture: { value: texture },
      uTime: { value: 0 },
      uEdgeDistort: { value: 0 },
      uNormX: { value: 0 },
      uDistort: { value: options?.distort ?? 0.85 },
      uChroma: { value: options?.chroma ?? 0.08 },
      uCover: { value: [1, 1] },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  const startTime = performance.now();
  const fallbackImg = card.querySelector<HTMLImageElement>("img");

  const instance: CardGlassInstance = {
    renderer,
    program,
    mesh,
    canvas,
    fallbackImg,
    raf: 0,
    startTime,
    disposed: false,
    edgeDistort: 0,
    normX: 0,
    render: () => renderFrame(),
    _cleanup: () => {
      resizeObserver.disconnect();
    },
  };

  const renderFrame = () => {
    if (instance.disposed) return;
    renderer.render({ scene: mesh });
  };

  const img = new Image();
  img.crossOrigin = "anonymous";

  // Reproduce object-fit: cover so the WebGL card matches the <img> fallback.
  const updateCover = () => {
    const w = card.clientWidth || card.offsetWidth;
    const h = card.clientHeight || card.offsetHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!w || !h || !iw || !ih) return;
    const cardAspect = w / h;
    const imgAspect = iw / ih;
    program.uniforms.uCover.value = [
      Math.min(1, cardAspect / imgAspect),
      Math.min(1, imgAspect / cardAspect),
    ];
  };

  img.onload = () => {
    if (instance.disposed) return;
    texture.image = img;
    texture.needsUpdate = true;
    updateCover();
    renderFrame();
    // Once the WebGL card is drawing, hide the plain <img> so the shader's
    // rippled silhouette defines the image shape instead of a rectangle.
    if (fallbackImg) fallbackImg.style.visibility = "hidden";
  };
  img.src = imageSrc;

  const syncSize = () => {
    if (instance.disposed) return;
    const w = card.clientWidth || card.offsetWidth;
    const h = card.clientHeight || card.offsetHeight;
    if (w > 0 && h > 0) {
      renderer.setSize(w, h);
      updateCover();
      renderFrame();
    }
  };
  syncSize();

  const resizeObserver = new ResizeObserver(syncSize);
  resizeObserver.observe(card);

  instances.set(card, instance);

  // Animation loop: renders only while a card is inside the edge lens (or for
  // the one frame that clears the lens), so centre cards cost no GPU time.
  let lastEdgeDistort = -1;
  const loop = (now: number) => {
    if (instance.disposed) return;
    if (instance.edgeDistort > 0.002 || lastEdgeDistort > 0.002) {
      const elapsed = (now - startTime) * 0.001;
      program.uniforms.uTime.value = elapsed;
      program.uniforms.uEdgeDistort.value = instance.edgeDistort;
      program.uniforms.uNormX.value = instance.normX;
      renderer.render({ scene: mesh });
      lastEdgeDistort = instance.edgeDistort;
    }
    instance.raf = requestAnimationFrame(loop);
  };
  instance.raf = requestAnimationFrame(loop);
}

export function updateCardGlass(
  card: HTMLElement,
  params: { edgeDistort: number; normX: number }
): void {
  const inst = instances.get(card);
  if (!inst) return;
  inst.edgeDistort = params.edgeDistort;
  inst.normX = params.normX;
}

export function unmountCardGlass(card: HTMLElement): void {
  const inst = instances.get(card);
  if (!inst) return;

  inst.disposed = true;
  if (inst.raf) cancelAnimationFrame(inst.raf);

  inst._cleanup();

  // Restore the plain <img> fallback in case the canvas is being torn down.
  if (inst.fallbackImg) {
    inst.fallbackImg.style.removeProperty("visibility");
  }

  try {
    const gl = inst.renderer.gl;
    inst.program.remove?.();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    // ignore
  }

  if (inst.canvas.parentNode === card) {
    card.removeChild(inst.canvas);
  }

  instances.delete(card);
}

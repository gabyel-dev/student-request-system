import {
  Camera,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

/**
 * The hero's WebGL backdrop.
 *
 * This is one full-screen quad running one fragment shader â€” a single draw
 * call, no geometry beyond the quad itself, no lights, no post-processing. That
 * is deliberate: a student's phone is the target device, and a 3D scene with
 * meshes and materials would cost far more than the page it sits behind while
 * looking no better.
 *
 * What it draws is the same emerald depth the CSS layer draws â€” a vertical
 * wash, a few soft pools of light, and fine filaments â€” but the light moves
 * with a domain-warped noise field instead of stepping between keyframes, and
 * GSAP can drive it continuously (see `hero-canvas.tsx`).
 *
 * The colours are read from the same CSS custom properties the fallback layer
 * uses, so the two can never drift apart: change `--color-mesh-mid` in
 * `globals.css` and this follows.
 *
 * Every resource is created here and released in `dispose()`. The render loop
 * is owned here too, with explicit pause/resume, so the component above never
 * has to reason about requestAnimationFrame.
 */

/** What the component above is allowed to ask of the scene. */
export type HeroField = {
  /** 0 at the top of the hero, 1 as it scrolls away. */
  setScroll: (progress: number) => void;
  /** Pointer position in 0..1 canvas space. Ignored on touch. */
  setPointer: (x: number, y: number) => void;
  /** Pauses the animation loop without discarding any GPU state. */
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

export type HeroFieldOptions = {
  /**
   * Draw one still frame and never animate. The frame is rendered at a fixed
   * time so the composition is the same one an animated user would see, just
   * held still.
   */
  reduced?: boolean;
  /** Frame rate ceiling. The default of 30 halves the GPU cost of a backdrop. */
  fps?: number;
};

/** The still frame used when motion is reduced: a fixed point in the drift. */
const REDUCED_TIME = 14.5;

/** Rendered when WebGL is missing or the context was lost. */
const FALLBACK_TIME = 9.25;

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    // The quad is authored in clip space, so the projection matrix is skipped:
    // there is no camera transform to apply to a full-screen surface.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;

  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;
  uniform vec2  uPointer;
  uniform vec3  uDeep;
  uniform vec3  uMid;
  uniform vec3  uBright;

  // Cheap value noise. A texture would be one less ALU op per pixel and one
  // more thing to load and keep in memory; at four octaves on a background
  // this is not where the frame budget goes.
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    // A rotation between octaves, so the lattice does not line up into visible
    // diagonal banding.
    mat2 rotate = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = rotate * p * 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Aspect-corrected, centred coordinates. The shader is written once and
    // stays correct from a 360px phone to an ultrawide monitor.
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float t = uTime * 0.05;

    // Two rounds of domain warping. The first displaces the sample point, the
    // second displaces it again by the first result, which is what turns
    // circular blobs into slow, irregular currents.
    vec2 q = vec2(
      fbm(p * 1.6 + t),
      fbm(p * 1.6 + vec2(3.2, 1.7) - t)
    );
    vec2 r = vec2(
      fbm(p * 2.1 + 2.4 * q + vec2(1.7, 9.2) + t * 1.4),
      fbm(p * 2.1 + 2.4 * q + vec2(8.3, 2.8) - t * 1.1)
    );
    float field = fbm(p * 1.9 + 1.8 * r);

    // Vertical wash: mid at the top falling to deep at the bottom.
    vec3 colour = mix(uMid, uDeep, smoothstep(0.0, 1.0, vUv.y));

    // Scrolling dims the light so the hero hands over to the page below it
    // rather than competing with it.
    float dim = 1.0 - 0.5 * uScroll;

    // Three pools, matching the positions of the CSS orbs this layer replaces.
    float poolA = smoothstep(0.9, 0.0, length(p - vec2(-0.6 + 0.07 * r.x, 0.46 - uScroll * 0.55 + 0.06 * r.y)));
    float poolB = smoothstep(0.8, 0.0, length(p - vec2(0.58 - 0.06 * r.y, 0.32 - uScroll * 0.4 + 0.05 * r.x)));
    float poolC = smoothstep(1.0, 0.0, length(p - vec2(0.05 + 0.05 * r.x, -0.6 - uScroll * 0.3)));

    colour += uBright * (poolA * 0.5 + poolB * 0.3 + poolC * 0.26) * dim;

    // Filaments: the bright end of the warped field, kept low so it reads as
    // texture in the light rather than as pattern.
    colour += uBright * pow(clamp(field, 0.0, 1.0), 3.0) * 0.15 * dim;

    // Pointer light. Only ever fed by a fine pointer, so a tap cannot leave a
    // highlight stranded where a finger was.
    vec2 pointer = (uPointer - 0.5) * vec2(uAspect, 1.0);
    colour += uBright * smoothstep(0.55, 0.0, length(p - pointer)) * 0.16;

    // Vignette. Holds the corners down so the mascot and the headline edges
    // stay calm and the panel above has something to sit against.
    float vignette = smoothstep(1.2, 0.25, length(p * vec2(0.62, 0.85)));
    colour *= mix(0.7, 1.0, vignette);

    gl_FragColor = vec4(colour, 1.0);
  }
`;

/** Reads a `#rgb` / `#rrggbb` custom property into linear-ish sRGB floats. */
function readToken(styles: CSSStyleDeclaration, name: string, fallback: string) {
  const raw = styles.getPropertyValue(name).trim() || fallback;
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  return new Vector3(
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  );
}

export function createHeroField(
  canvas: HTMLCanvasElement,
  { reduced = false, fps = 30 }: HeroFieldOptions = {},
): HeroField | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      // The backdrop is a slow gradient; asking for the high-performance
      // adapter avoids waking a discrete GPU to draw one quad.
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: false,
    });
  } catch {
    // No WebGL. The caller leaves the CSS mesh in place and carries on.
    return null;
  }

  const styles = getComputedStyle(document.documentElement);
  const deep = readToken(styles, "--color-mesh-deep", "#06281c");
  const mid = readToken(styles, "--color-mesh-mid", "#0b3a28");
  const bright = readToken(styles, "--color-mesh-bright", "#14a06f");

  const scene = new Scene();
  // A bare camera: the vertex shader writes clip-space positions directly, so
  // this exists only to satisfy the renderer's signature.
  const camera = new Camera();

  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: reduced ? REDUCED_TIME : FALLBACK_TIME },
      uScroll: { value: 0 },
      uAspect: { value: 1 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uDeep: { value: deep },
      uMid: { value: mid },
      uBright: { value: bright },
    },
  });
  const quad = new Mesh(geometry, material);
  scene.add(quad);

  let width = 1;
  let height = 1;
  // Capped: a 3x phone screen gains nothing visible from a soft gradient but
  // pays for three times the fragments.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    renderer.setPixelRatio(pixelRatio);
    // `false` on the style argument: the canvas is sized by CSS, and letting
    // three write inline width/height would fight the layout.
    renderer.setSize(width, height, false);
    material.uniforms.uAspect.value = width / height;
    if (reduced) drawOnce();
  }

  function drawOnce() {
    renderer.render(scene, camera);
  }

  let frameHandle = 0;
  let lastStamp = 0;
  let elapsed = reduced ? REDUCED_TIME : 0;
  let running = false;
  // 30fps by default: a slow gradient gains nothing from 60, and halving the
  // frames is the cheapest saving available on a phone.
  const frameInterval = 1000 / Math.max(1, fps);

  function loop(stamp: number) {
    frameHandle = requestAnimationFrame(loop);
    if (stamp - lastStamp < frameInterval) return;
    // Clamped so a backgrounded tab does not resume with a huge time jump.
    const delta = Math.min((stamp - lastStamp) / 1000, 0.1);
    lastStamp = stamp;
    elapsed += delta;
    material.uniforms.uTime.value = elapsed;
    drawOnce();
  }

  function start() {
    if (running || reduced) return;
    running = true;
    lastStamp = 0;
    frameHandle = requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frameHandle);
    lastStamp = 0;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  resize();
  drawOnce();
  if (!reduced) start();

  return {
    setScroll(progress) {
      material.uniforms.uScroll.value = progress;
      if (reduced) drawOnce();
    },
    setPointer(x, y) {
      material.uniforms.uPointer.value.set(x, y);
      if (reduced) drawOnce();
    },
    setPaused(paused) {
      // `start()` is a no-op under reduced motion, so pausing and resuming
      // cannot accidentally start the loop the reduced path deliberately never
      // runs.
      if (paused) stop();
      else start();
    },
    dispose() {
      stop();
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      // Drops the backing GPU buffers immediately rather than waiting for GC,
      // which matters when a student navigates between several pages.
      renderer.forceContextLoss();
    },
  };
}

// src/scripts/image-ripple.ts
//
// Cursor "ripple" distortion for a single picture, in plain three.js
// (the same technique as the ui-layouts "image ripple effect", minus
// React / react-three-fiber).
//
// How it works, per frame:
//   1. TRAIL PASS -- every pointer move drops a soft white "brush" blob
//      into an off-screen scene. Blobs grow a little and fade out, and
//      the scene is drawn (additively) into a small render target, so
//      the target is a black picture with a glowing trail behind the
//      cursor.
//   2. IMAGE PASS -- a full-screen quad draws the picture. For every
//      pixel it looks up the trail brightness at the same spot and
//      shifts where it samples the picture by that amount, in a
//      direction that depends on the brightness. That bends the picture
//      into rings that spread and settle as the trail fades.
//
// The canvas is only redrawn while a trail is visible and the picture
// is on screen; when everything has faded out it stops completely.
//
// The picture comes from an <img> that is already on the page (so the
// browser's optimised file is reused and no separate asset is needed).

import {
  AdditiveBlending,
  CanvasTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';

export interface ImageRippleOptions {
  /** Canvas the effect is drawn on; should cover the same box as `image`. */
  canvas: HTMLCanvasElement;
  /** The already-loaded picture to distort. */
  image: HTMLImageElement;
  /** Element whose pointer movement drives the ripples (default: canvas). */
  listenOn?: HTMLElement;
  /** How far the picture is pushed, as a fraction of its size. Default 0.035. */
  strength?: number;
  /** Brush size as a fraction of the canvas width. Default 0.075. */
  brushSize?: number;
  /** Per-frame opacity multiplier of a blob; closer to 1 = longer trail. Default 0.965. */
  fade?: number;
  /** Number of blobs kept in the pool. Default 80. */
  brushCount?: number;
  /** Minimum pointer travel (CSS px) before the next blob. Default 8. */
  spacing?: number;
  /** Caps the canvas resolution multiplier. Default 1.5. */
  maxPixelRatio?: number;
  /** Optional custom brush picture (white blob on transparent). Default: generated. */
  brushSrc?: string;
  /** Called with true once the canvas is showing the picture, false if it stops. */
  onActive?: (active: boolean) => void;
}

export interface ImageRipple {
  destroy(): void;
}

interface Brush {
  mesh: Mesh;
  material: MeshBasicMaterial;
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform sampler2D uTrail;
  uniform float uStrength;
  void main() {
    float a = texture2D(uTrail, vUv).r;
    float theta = a * 6.2831853;
    vec2 dir = vec2(sin(theta), cos(theta));
    vec2 uv = clamp(vUv + dir * a * uStrength, 0.001, 0.999);
    gl_FragColor = texture2D(uImage, uv);
  }
`;

/** A soft white round blob, drawn on a small 2D canvas. */
function makeBrushTexture(): CanvasTexture {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}

/**
 * Starts the effect. Returns `null` when WebGL isn't available (the
 * plain <img> then just stays visible). Call `destroy()` to stop it and
 * free the GPU resources.
 */
export function createImageRipple(options: ImageRippleOptions): ImageRipple | null {
  const {
    canvas,
    image,
    strength = 0.035,
    brushSize = 0.075,
    fade = 0.965,
    brushCount = 80,
    spacing = 8,
    maxPixelRatio = 1.5,
    brushSrc,
    onActive,
  } = options;
  const listenOn = options.listenOn ?? canvas;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }

  // ---- trail pass ------------------------------------------------------
  const trailScene = new Scene();
  const trailCamera = new OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  const trailTarget = new WebGLRenderTarget(2, 2, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBAFormat,
    depthBuffer: false,
  });

  const brushTexture: Texture = brushSrc ? new Texture() : makeBrushTexture();
  if (brushSrc) {
    const img = new Image();
    img.onload = () => {
      brushTexture.image = img;
      brushTexture.needsUpdate = true;
    };
    img.src = brushSrc;
  }

  const brushGeometry = new PlaneGeometry(1, 1);
  const brushes: Brush[] = [];
  for (let i = 0; i < brushCount; i++) {
    const material = new MeshBasicMaterial({
      map: brushTexture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(brushGeometry, material);
    mesh.visible = false;
    trailScene.add(mesh);
    brushes.push({ mesh, material });
  }
  let nextBrush = 0;

  // ---- image pass ------------------------------------------------------
  // The texture is filled from a private copy of the picture (see
  // loadSource) instead of from `image` itself: an <img> that uses
  // srcset/sizes reports a *density-corrected* naturalWidth (e.g. 649
  // for a 1440px file), and uploading the real 1440px bitmap into a
  // texture allocated at that smaller size fails.
  const texture = new Texture();
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  const imageMaterial = new ShaderMaterial({
    uniforms: {
      uImage: { value: texture },
      uTrail: { value: trailTarget.texture },
      uStrength: { value: strength },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
  const imageGeometry = new PlaneGeometry(2, 2);
  const imageQuad = new Mesh(imageGeometry, imageMaterial);
  imageQuad.frustumCulled = false;
  const imageScene = new Scene();
  imageScene.add(imageQuad);
  const imageCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ---- state -----------------------------------------------------------
  let width = 0;
  let height = 0;
  let brushPx = 100;
  let raf = 0;
  let visible = true;
  let ready = false;
  let destroyed = false;
  let active = false;
  let lastX = -1e6;
  let lastY = -1e6;

  function setActive(value: boolean) {
    if (active !== value) {
      active = value;
      onActive?.(value);
    }
  }

  function drawImage() {
    renderer.setRenderTarget(null);
    renderer.render(imageScene, imageCamera);
  }

  /** Advances every live blob one step; returns whether any are left. */
  function stepTrail(): boolean {
    let anyAlive = false;
    const target = brushPx * 1.1;
    for (const { mesh, material } of brushes) {
      if (!mesh.visible) continue;
      material.opacity *= fade;
      const s = mesh.scale.x + (target - mesh.scale.x) * 0.04;
      mesh.scale.set(s, s, 1);
      if (material.opacity < 0.01) {
        mesh.visible = false;
      } else {
        anyAlive = true;
      }
    }
    return anyAlive;
  }

  function drawTrail() {
    renderer.setRenderTarget(trailTarget);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(trailScene, trailCamera);
    renderer.setRenderTarget(null);
  }

  function frame() {
    raf = 0;
    if (destroyed || !ready || !visible) return;
    const alive = stepTrail();
    drawTrail();
    drawImage();
    // Keep going while blobs are alive; one more pass above already
    // rendered the final, fully faded frame when the last one died.
    if (alive) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!raf && ready && visible && !destroyed) raf = requestAnimationFrame(frame);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === width && h === height) return;
    width = w;
    height = h;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio, 4096 / Math.max(w, h));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false); // CSS decides the displayed size

    trailTarget.setSize(Math.max(2, Math.round(w / 2)), Math.max(2, Math.round(h / 2)));
    trailCamera.left = -w / 2;
    trailCamera.right = w / 2;
    trailCamera.top = h / 2;
    trailCamera.bottom = -h / 2;
    trailCamera.updateProjectionMatrix();

    brushPx = Math.max(90, w * brushSize);

    // Resizing clears the canvas, so repaint straight away.
    if (ready) {
      drawTrail();
      drawImage();
    }
  }

  function spawn(x: number, y: number) {
    const brush = brushes[nextBrush];
    nextBrush = (nextBrush + 1) % brushes.length;
    brush.mesh.visible = true;
    brush.mesh.position.set(x - width / 2, height / 2 - y, 0);
    brush.mesh.scale.set(brushPx * 0.35, brushPx * 0.35, 1);
    brush.mesh.rotation.z = Math.random() * Math.PI * 2;
    brush.material.opacity = 1;
  }

  function onPointerMove(event: PointerEvent) {
    if (!ready) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const dx = x - lastX;
    const dy = y - lastY;
    if (dx * dx + dy * dy < spacing * spacing) return;
    lastX = x;
    lastY = y;
    spawn(x, y);
    wake();
  }

  /** Gives up: leaves the plain <img> visible and frees the GPU. */
  function fail() {
    setActive(false);
    api.destroy();
  }

  function start() {
    if (destroyed) return;
    const gl = renderer.getContext();
    gl.getError(); // clear anything older, so only our own errors count
    ready = true;
    resize();
    drawTrail();
    drawImage();
    // If the texture upload (or anything else) failed, the canvas would be
    // blank -- never swap out the real picture for that.
    if (gl.getError() !== gl.NO_ERROR) {
      fail();
      return;
    }
    setActive(true);
  }

  let loadedUrl = '';

  /** Loads the <img>'s current file into a private Image and uploads it. */
  function loadSource() {
    if (destroyed) return;
    const url = image.currentSrc || image.src;
    if (!url || url === loadedUrl) return;
    loadedUrl = url;
    const copy = new Image();
    copy.onload = () => {
      if (destroyed || url !== loadedUrl) return; // superseded
      texture.image = copy;
      texture.needsUpdate = true;
      if (!ready) {
        start();
      } else {
        const gl = renderer.getContext();
        gl.getError();
        drawImage();
        if (gl.getError() !== gl.NO_ERROR) fail();
      }
    };
    copy.onerror = () => {
      if (!destroyed && url === loadedUrl) fail();
    };
    copy.src = url;
  }

  // The <img> can switch to a different file later (e.g. after the
  // window grows); pick that up whenever it happens.
  function onImageLoad() {
    loadSource();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    setActive(false);
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(canvas);

  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  });
  intersectionObserver.observe(canvas);

  listenOn.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('webglcontextlost', onContextLost);
  image.addEventListener('load', onImageLoad);

  if (image.complete && image.naturalWidth > 0) loadSource();

  const api: ImageRipple = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      listenOn.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      image.removeEventListener('load', onImageLoad);
      setActive(false);

      for (const { material } of brushes) material.dispose();
      brushGeometry.dispose();
      brushTexture.dispose();
      imageGeometry.dispose();
      imageMaterial.dispose();
      texture.dispose();
      trailTarget.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  return api;
}

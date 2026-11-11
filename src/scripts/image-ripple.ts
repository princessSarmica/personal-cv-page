
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
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  listenOn?: HTMLElement;
  strength?: number;
  brushSize?: number;
  fade?: number;
  brushCount?: number;
  spacing?: number;
  maxPixelRatio?: number;
  brushSrc?: string;
  onActive?: (active: boolean) => void;
}

export interface ImageRipple {
  destroy(): void;
}

interface Brush {
  mesh: Mesh;
  material: MeshBasicMaterial;
}

const VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = `
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
    renderer.setSize(w, h, false);

    trailTarget.setSize(Math.max(2, Math.round(w / 2)), Math.max(2, Math.round(h / 2)));
    trailCamera.left = -w / 2;
    trailCamera.right = w / 2;
    trailCamera.top = h / 2;
    trailCamera.bottom = -h / 2;
    trailCamera.updateProjectionMatrix();

    brushPx = Math.max(90, w * brushSize);

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

  function fail() {
    setActive(false);
    api.destroy();
  }

  function start() {
    if (destroyed) return;
    const gl = renderer.getContext();
    gl.getError();
    ready = true;
    resize();
    drawTrail();
    drawImage();
    if (gl.getError() !== gl.NO_ERROR) {
      fail();
      return;
    }
    setActive(true);
  }

  let loadedUrl = '';

  function loadSource() {
    if (destroyed) return;
    const url = image.currentSrc || image.src;
    if (!url || url === loadedUrl) return;
    loadedUrl = url;
    const copy = new Image();
    copy.onload = () => {
      if (destroyed || url !== loadedUrl) return;
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

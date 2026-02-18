import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { extrude, simplifyPath } from 'tess-extrude';
import type { Point2D } from 'tess-extrude';

// ─── State ───
let drawnPoints: Point2D[] = [];
let isDrawing = false;

// ─── DOM refs ───
const drawCanvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
const drawCtx = drawCanvas.getContext('2d')!;
const threeCanvas = document.getElementById('three-canvas') as HTMLCanvasElement;
const drawHint = document.getElementById('draw-hint') as HTMLElement;
const statsEl = document.getElementById('stats') as HTMLElement;

const sliderCapDensity = document.getElementById('cap-density') as HTMLInputElement;
const sliderEdgeSubdivs = document.getElementById('edge-subdivs') as HTMLInputElement;
const sliderDepthSegs = document.getElementById('depth-segs') as HTMLInputElement;
const sliderExtrudeDepth = document.getElementById('extrude-depth') as HTMLInputElement;
const chkWireframe = document.getElementById('chk-wireframe') as HTMLInputElement;
const chkSolid = document.getElementById('chk-solid') as HTMLInputElement;
const shapeSelect = document.getElementById('shape-select') as HTMLSelectElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const btnExtrude = document.getElementById('btn-extrude') as HTMLButtonElement;

// ─── Three.js setup ───
const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x1a1a2e);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(0, 0, 200);

const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 80, 100);
scene.add(dirLight);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(-50, -30, -50);
scene.add(dirLight2);

// Grid
const grid = new THREE.GridHelper(200, 20, 0x0f3460, 0x0f3460);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

let solidMesh: THREE.Mesh | null = null;
let wireMesh: THREE.Mesh | null = null;

// ─── Resize ───
function resize(): void {
  const leftRect = drawCanvas.parentElement!.getBoundingClientRect();
  drawCanvas.width = leftRect.width;
  drawCanvas.height = leftRect.height;
  redraw2D();

  const rightRect = threeCanvas.parentElement!.getBoundingClientRect();
  renderer.setSize(rightRect.width, rightRect.height);
  camera.aspect = rightRect.width / rightRect.height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// ─── 2D Drawing ───
function getCanvasPos(e: MouseEvent | Touch): Point2D {
  const rect = drawCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

drawCanvas.addEventListener('mousedown', (e) => {
  if (shapeSelect.value !== 'freehand') return;
  isDrawing = true;
  drawnPoints = [getCanvasPos(e)];
  drawHint.style.display = 'none';
});

drawCanvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const p = getCanvasPos(e);
  const last = drawnPoints[drawnPoints.length - 1]!;
  const dx = p.x - last.x;
  const dy = p.y - last.y;
  if (dx * dx + dy * dy > 16) {
    drawnPoints.push(p);
    redraw2D();
  }
});

drawCanvas.addEventListener('mouseup', () => {
  if (!isDrawing) return;
  isDrawing = false;
  if (drawnPoints.length > 4) {
    drawnPoints = simplifyPath(drawnPoints, 3);
    redraw2D();
  }
});

// Touch support
drawCanvas.addEventListener(
  'touchstart',
  (e) => {
    e.preventDefault();
    drawCanvas.dispatchEvent(new MouseEvent('mousedown', e.touches[0]));
  },
  { passive: false },
);
drawCanvas.addEventListener(
  'touchmove',
  (e) => {
    e.preventDefault();
    drawCanvas.dispatchEvent(new MouseEvent('mousemove', e.touches[0]));
  },
  { passive: false },
);
drawCanvas.addEventListener(
  'touchend',
  (e) => {
    e.preventDefault();
    drawCanvas.dispatchEvent(new MouseEvent('mouseup'));
  },
  { passive: false },
);

function redraw2D(): void {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  if (drawnPoints.length < 2) return;

  drawCtx.beginPath();
  drawCtx.moveTo(drawnPoints[0]!.x, drawnPoints[0]!.y);
  for (let i = 1; i < drawnPoints.length; i++) {
    drawCtx.lineTo(drawnPoints[i]!.x, drawnPoints[i]!.y);
  }
  drawCtx.closePath();
  drawCtx.fillStyle = 'rgba(233, 69, 96, 0.15)';
  drawCtx.fill();
  drawCtx.strokeStyle = '#e94560';
  drawCtx.lineWidth = 2;
  drawCtx.stroke();

  drawCtx.fillStyle = '#e94560';
  for (const p of drawnPoints) {
    drawCtx.beginPath();
    drawCtx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    drawCtx.fill();
  }
}

// ─── Preset shapes ───
function generatePresetShape(type: string): Point2D[] {
  const cx = drawCanvas.width / 2;
  const cy = drawCanvas.height / 2;
  const sz = Math.min(drawCanvas.width, drawCanvas.height) * 0.35;
  const pts: Point2D[] = [];

  switch (type) {
    case 'square':
      pts.push(
        { x: cx - sz, y: cy - sz },
        { x: cx + sz, y: cy - sz },
        { x: cx + sz, y: cy + sz },
        { x: cx - sz, y: cy + sz },
      );
      break;
    case 'circle':
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * sz, y: cy + Math.sin(a) * sz });
      }
      break;
    case 'star': {
      const outer = sz;
      const inner = sz * 0.4;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
      break;
    }
    case 'L': {
      const s = sz * 0.8;
      pts.push(
        { x: cx - s, y: cy - s },
        { x: cx, y: cy - s },
        { x: cx, y: cy },
        { x: cx + s, y: cy },
        { x: cx + s, y: cy + s },
        { x: cx - s, y: cy + s },
      );
      break;
    }
  }
  return pts;
}

shapeSelect.addEventListener('change', () => {
  const v = shapeSelect.value;
  if (v !== 'freehand') {
    drawnPoints = generatePresetShape(v);
    drawHint.style.display = 'none';
    redraw2D();
  }
});

btnClear.addEventListener('click', () => {
  drawnPoints = [];
  drawHint.style.display = 'block';
  redraw2D();
  clearMeshes();
  statsEl.textContent = '';
});

// ─── Mesh management ───
function clearMeshes(): void {
  if (solidMesh) {
    scene.remove(solidMesh);
    solidMesh.geometry.dispose();
    solidMesh = null;
  }
  if (wireMesh) {
    scene.remove(wireMesh);
    // geometry is shared with solidMesh — already disposed
    wireMesh = null;
  }
}

// ─── Extrude ───
function doExtrude(): void {
  if (drawnPoints.length < 3) return;

  const capDensity = parseInt(sliderCapDensity.value);
  const edgeSubdivisions = parseInt(sliderEdgeSubdivs.value);
  const depthSegments = parseInt(sliderDepthSegs.value);
  const depth = parseInt(sliderExtrudeDepth.value);

  const geometry = extrude(
    { type: 'points', points: drawnPoints },
    { depth, depthSegments, capDensity, edgeSubdivisions },
  );
  if (!geometry) return;

  clearMeshes();

  const solidMat = new THREE.MeshPhongMaterial({
    color: 0xe94560,
    specular: 0x333333,
    shininess: 40,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  solidMesh = new THREE.Mesh(geometry, solidMat);
  solidMesh.visible = chkSolid.checked;
  scene.add(solidMesh);

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
  });
  wireMesh = new THREE.Mesh(geometry, wireMat);
  wireMesh.visible = chkWireframe.checked;
  scene.add(wireMesh);

  geometry.computeBoundingSphere();
  const r = geometry.boundingSphere!.radius;
  camera.position.set(r * 0.8, r * 0.8, r * 2);
  controls.target.set(0, 0, 0);
  controls.update();

  const idx = geometry.index;
  const triCount = idx ? idx.count / 3 : 0;
  statsEl.textContent = `Triangles: ${triCount} | Vertices: ${geometry.getAttribute('position').count}`;
}

// ─── UI events ───
btnExtrude.addEventListener('click', doExtrude);

function onSliderChange(): void {
  document.getElementById('cap-density-val')!.textContent = sliderCapDensity.value;
  document.getElementById('edge-subdivs-val')!.textContent = sliderEdgeSubdivs.value;
  document.getElementById('depth-segs-val')!.textContent = sliderDepthSegs.value;
  document.getElementById('extrude-depth-val')!.textContent = (
    parseInt(sliderExtrudeDepth.value) / 10
  ).toFixed(1);
  if (drawnPoints.length >= 3 && solidMesh) doExtrude();
}

sliderCapDensity.addEventListener('input', onSliderChange);
sliderEdgeSubdivs.addEventListener('input', onSliderChange);
sliderDepthSegs.addEventListener('input', onSliderChange);
sliderExtrudeDepth.addEventListener('input', onSliderChange);

chkWireframe.addEventListener('change', () => {
  if (wireMesh) wireMesh.visible = chkWireframe.checked;
});
chkSolid.addEventListener('change', () => {
  if (solidMesh) solidMesh.visible = chkSolid.checked;
});

// ─── Animation loop ───
function animate(): void {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ─── Init ───
resize();
animate();

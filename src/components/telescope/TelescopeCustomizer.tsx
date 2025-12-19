import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { pickColorForFile } from './colorMatcher';

// DEBUG
console.log("⏳ TelescopeCustomizer.tsx loaded (Z = UP, ORBIT ENABLED)");

const STL_FILES: string[] = Object.keys(
  import.meta.glob('/public/models/*.stl', { eager: true })
).map(path => path.replace('/public', ''));

console.log("📂 STL file count:", STL_FILES.length);

const loader = new STLLoader();

const TelescopeCustomizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [tubeColor] = useState("#1a1a1a");
  const [mountColor] = useState("#8b6f47");
  const [isLoading, setIsLoading] = useState(true);

  /** LOAD STL */
  async function loadSTL(file: string): Promise<THREE.Mesh> {
    console.log("📥 loading:", file);
    const geometry = await loader.loadAsync(file);
    console.log("📦 loaded:", file);

    geometry.computeVertexNormals();

    return new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: pickColorForFile(file, tubeColor, mountColor),
      })
    );
  }

  /** REBUILD MODEL */
  async function rebuildModel() {
    const scene = sceneRef.current;
    if (!scene) {
      console.log("❌ missing scene");
      return;
    }

    if (modelRef.current) {
      scene.remove(modelRef.current);
    }

    const group = new THREE.Group();
    console.log("📦 building", STL_FILES.length, "meshes...");

    const meshes = await Promise.all(
      STL_FILES.map(async f => await loadSTL(f))
    );

    meshes.forEach(m => group.add(m));

    // SCALE FOR VISIBILITY
    group.scale.setScalar(0.05);

    scene.add(group);
    modelRef.current = group;

    console.log("🌟 model added");

    setIsLoading(false);
  }

  /** INIT SCENE + CAMERA + CONTROLS */
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x243a63); // blue
    sceneRef.current = scene;

    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);

    /** CAMERA START POSITION — Z-UP */
    camera.position.set(75, -47, 19);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(50, 50, 100);
    scene.add(sun);

    /** ORBIT CONTROLS — FULL ROTATION + PAN + ZOOM */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;

    // LIMITS
    controls.minDistance = 10;
    controls.maxDistance = 500;

    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    /** PREVENT CAMERA FROM ROLLING / TIPPING SIDEWAYS */
    function fixUpright() {
      if (!cameraRef.current) return;
      cameraRef.current.up.set(0, 0, 1);
    }

    /** DEBUG CAMERA OUTPUT */
    function logCamera() {
      console.log(
        "🎥 camera:",
        camera.position.x.toFixed(2),
        camera.position.y.toFixed(2),
        camera.position.z.toFixed(2),
        "| up:",
        camera.up.x,
        camera.up.y,
        camera.up.z
      );
    }

    canvasRef.current.addEventListener("wheel", logCamera);
    canvasRef.current.addEventListener("mousedown", logCamera);
    canvasRef.current.addEventListener("mousemove", logCamera);
    canvasRef.current.addEventListener("mouseup", logCamera);

    /** ANIMATION LOOP */
    function animate() {
      requestAnimationFrame(animate);

      // keep camera upright
      fixUpright();

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    rebuildModel();
  }, []);

  /** UI */
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div
        style={{
          position: 'sticky',
          top: '64px',
          height: '80vh',
          marginBottom: '-10vh',
          zIndex: 10,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'grab',
            touchAction: 'none'
          }}
        />

        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff'
          }}>
            Loading telescope...
          </div>
        )}
      </div>
    </div>
  );
};

export default TelescopeCustomizer;


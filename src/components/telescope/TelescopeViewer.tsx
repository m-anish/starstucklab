import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { stlFiles } from './telescopeStlFiles';
import { PASTEL_COLORS } from './telescopeColors';
import { pickColorForFile, positionModel } from './telescopeUtils';
import type { TelescopeViewerProps } from './telescopeTypes';

const TelescopeViewer: React.FC<TelescopeViewerProps> = ({ colors, onColorChange }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const modelsRef = React.useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = React.useRef<number>();
  const [selectedPart, setSelectedPart] = useState<'tubeA' | 'tubeB' | 'base' | null>(null);

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(80, -70, 0);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 40);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2);
    mainLight.position.set(50, 50, 100);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
    fillLight.position.set(-30, -30, 50);
    scene.add(fillLight);

    // Ground
    const groundGeometry = new THREE.CircleGeometry(500, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.z = -60;
    ground.receiveShadow = true;
    scene.add(ground);

    scene.background = new THREE.Color(0xd8e1e8);
    scene.fog = new THREE.Fog(0xd8e1e8, 1, 500);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Load STL files
    const loader = new STLLoader();

    // Load all STL files
    const loadPromises = stlFiles.map(fileName => {
      return new Promise<{ geometry: THREE.BufferGeometry; fileName: string }>((resolve, reject) => {
        loader.load(
          `/models/m42/${fileName}`,
          (geometry) => {
            resolve({ geometry, fileName });
          },
          undefined,
          (error) => {
            console.warn(`Failed to load ${fileName}:`, error);
            reject(error);
          }
        );
      });
    });

    // Process loaded models
    Promise.allSettled(loadPromises).then((results) => {
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { geometry, fileName } = result.value;

          // Create mesh with material
          const material = new THREE.MeshStandardMaterial({
            color: pickColorForFile(fileName, colors.tubeA, colors.tubeB, colors.base),
            metalness: fileName.includes('mirror') ? 0.9 : 0.1,
            roughness: fileName.includes('mirror') ? 0.1 : 0.8,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Position models (basic positioning - may need refinement)
          positionModel(mesh, fileName);

          scene.add(mesh);
          modelsRef.current.set(fileName, mesh);
        }
      });
    });

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update colors when props change
  useEffect(() => {
    if (!modelsRef.current.size) return;

    modelsRef.current.forEach((mesh, file) => {
      const newColor = pickColorForFile(file, colors.tubeA, colors.tubeB, colors.base);
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.setStyle(newColor);
      }
    });
  }, [colors]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          background: '#d8e1e8',
          display: 'block',
        }}
      />

      {/* Color Control Buttons */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '16px',
        zIndex: 10,
      }}>
        {[
          { key: 'tubeA', label: 'Tube A', color: colors.tubeA },
          { key: 'tubeB', label: 'Tube B', color: colors.tubeB },
          { key: 'base', label: 'Base', color: colors.base },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setSelectedPart(key as 'tubeA' | 'tubeB' | 'base')}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: color,
              border: selectedPart === key ? '3px solid #2a7a4f' : '3px solid rgba(255,255,255,0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: color === '#f7f7f7' ? '#333' : '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Color Selector Overlay */}
      {selectedPart && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          borderRadius: '12px',
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80%',
            overflow: 'auto',
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              textAlign: 'center',
              color: '#333',
              fontSize: '1.2rem',
              fontWeight: 600,
            }}>
              Choose {selectedPart === 'tubeA' ? 'Tube A' : selectedPart === 'tubeB' ? 'Tube B' : 'Base'} Color
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {PASTEL_COLORS.map(color => (
                <button
                  key={color.hex}
                  onClick={() => {
                    if (selectedPart) {
                      onColorChange(selectedPart, color.hex);
                      setSelectedPart(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '70px',
                    borderRadius: '8px',
                    background: color.hex,
                    border: '2px solid rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: color.hex === '#f7f7f7' ? '#333' : '#fff',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    padding: '4px',
                  }}
                >
                  {color.name.split(' ').join('\n')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedPart(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelescopeViewer;

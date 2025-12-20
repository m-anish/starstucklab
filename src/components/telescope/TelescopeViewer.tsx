import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { stlFiles } from './telescopeStlFiles';
import { PASTEL_COLORS } from './telescopeColors';
import { pickColorForFile, positionModel } from './telescopeUtils';
import type { TelescopeViewerProps } from './telescopeTypes';

const TelescopeViewer: React.FC<TelescopeViewerProps> = ({
  colors,
  onColorChange,
  focusTarget,
  showEngravingUI,
  engravingText,
  onEngravingChange
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const modelsRef = React.useRef<Map<string, THREE.Mesh>>(new Map());
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = React.useRef<any>(null);
  const animationFrameRef = React.useRef<number>();
  const [selectedPart, setSelectedPart] = useState<'tubeA' | 'tubeB' | 'base' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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
    cameraRef.current = camera;

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
    controlsRef.current = controls;

    // Debug logging for camera positioning
    controls.addEventListener('change', () => {
      console.log('🎥 Camera Position:', {
        x: camera.position.x.toFixed(2),
        y: camera.position.y.toFixed(2),
        z: camera.position.z.toFixed(2)
      });

      // Calculate look-at target (where camera is pointing)
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const distance = 50; // Distance to look-at point
      const target = new THREE.Vector3();
      target.copy(camera.position).add(direction.multiplyScalar(distance));

      console.log('🎯 Camera Target:', {
        x: target.x.toFixed(2),
        y: target.y.toFixed(2),
        z: target.z.toFixed(2)
      });
    });

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

  // Handle camera focus animation
  useEffect(() => {
    if (!focusTarget || !cameraRef.current || !modelsRef.current) return;

    setIsAnimating(true);

    // Use the exact coordinates from your manual camera positioning
    const cameraPosition = new THREE.Vector3(-29.88, -3.26, 51.77);
    const lookAtTarget = new THREE.Vector3(-4.92, -0.54, 8.53);

    const camera = cameraRef.current;
    const startPosition = camera.position.clone();

    console.log('🎬 Starting camera animation');
    console.log('📍 Start position:', startPosition);
    console.log('🎯 Target position:', cameraPosition);
    console.log('👁️ Look-at target:', lookAtTarget);

    // Disable controls initially, but enable during animation for proper target updates
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
      console.log('🚫 Controls disabled initially');
    }

    // Animate camera over 2 seconds
    const duration = 2000;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate camera position
      camera.position.lerpVectors(startPosition, cameraPosition, easeProgress);

      // Set OrbitControls target and enable controls temporarily for proper rotation update
      if (controlsRef.current) {
        controlsRef.current.target.copy(lookAtTarget);
        controlsRef.current.enabled = true;
        controlsRef.current.update(); // Force update to apply target rotation
      }

      console.log(`📹 Animation progress: ${(progress * 100).toFixed(1)}% - Camera at:`, camera.position.clone());

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        console.log('✅ Animation complete - final camera position:', camera.position);
        console.log('👁️ Final look-at target:', lookAtTarget);
        setIsAnimating(false);
        // Keep controls disabled when focused on engraving target
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    };

    animateCamera();
  }, [focusTarget]);

  // Re-enable controls when not in engraving mode
  useEffect(() => {
    if (!showEngravingUI && controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [showEngravingUI]);

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

      {/* Engraving UI Overlay */}
      {showEngravingUI && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15,
          pointerEvents: 'none', // Allow interaction with 3D scene behind
        }}>
          {/* Engraving Input Popup */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
            minWidth: '300px',
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              color: '#333',
              fontSize: '1.1rem',
              fontWeight: 600,
            }}>
              Add Engraving Text
            </h4>

            <input
              type="text"
              maxLength={15}
              value={engravingText || ''}
              onChange={(e) => onEngravingChange?.(e.target.value)}
              placeholder="Enter engraving text..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'monospace',
                marginBottom: '8px',
              }}
            />

            <div style={{
              fontSize: '0.8rem',
              color: '#666',
              textAlign: 'right',
            }}>
              {(engravingText || '').length}/15 characters
            </div>
          </div>

          {/* Arrow pointing to engraving location */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '70%',
            transform: 'translate(-50%, -50%)',
            zIndex: 16,
          }}>
            <div style={{
              width: '0',
              height: '0',
              borderLeft: '20px solid transparent',
              borderRight: '20px solid transparent',
              borderBottom: '30px solid #ff6b6b',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              animation: 'bounce 2s infinite',
            }} />
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '-10px',
              background: '#ff6b6b',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Engraving Area
            </div>
          </div>
        </div>
      )}

      {/* Add bounce animation CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `
      }} />
    </div>
  );
};

export default TelescopeViewer;

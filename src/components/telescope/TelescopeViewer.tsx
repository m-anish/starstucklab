import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { stlFiles } from './telescopeStlFiles';
import { PASTEL_COLORS } from './telescopeColors';
import { pickColorForFile, positionModel } from './telescopeUtils';
import type { TelescopeViewerProps } from './telescopeTypes';

// Add this interface at the top of the file for the onGraphicUpload handler
interface ExtendedTelescopeViewerProps extends TelescopeViewerProps {
  onGraphicUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TelescopeViewer: React.FC<ExtendedTelescopeViewerProps> = ({
  colors,
  onColorChange,
  focusTarget,
  showEngravingUI,
  engravingText,
  onEngravingChange,
  showGraphicUI,
  onGraphicUpload,
  showReviewMode
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const modelsRef = React.useRef<Map<string, THREE.Mesh>>(new Map());
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = React.useRef<any>(null);
  const animationFrameRef = React.useRef<number>();
  const orbitAnimationRef = React.useRef<number | null>(null);
  const [selectedPart, setSelectedPart] = useState<'tubeA' | 'tubeB' | 'base' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const initialCameraPosition = React.useRef(new THREE.Vector3(80, -70, 0));
  const initialCameraTarget = React.useRef(new THREE.Vector3(0, 0, 40));

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(120, -100, 10); // Zoomed out further
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 30);
    cameraRef.current = camera;
    
    // Store initial position and target
    initialCameraPosition.current.set(120, -100, 10);
    initialCameraTarget.current.set(0, 0, 30);

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
    // Press 'C' key to log current camera view (for capturing positions)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        console.log('📸 === CAMERA VIEW CAPTURED ===');
        console.log('🎥 Camera Position:', {
          x: camera.position.x.toFixed(2),
          y: camera.position.y.toFixed(2),
          z: camera.position.z.toFixed(2)
        });
        console.log('🎯 Controls Target (Look-At):', {
          x: controls.target.x.toFixed(2),
          y: controls.target.y.toFixed(2),
          z: controls.target.z.toFixed(2)
        });
        console.log('📋 Copy this for focusTarget config:');
        console.log(`{
  camera: new THREE.Vector3(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}),
  target: new THREE.Vector3(${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)})
}`);
        console.log('================================');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);

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
      window.removeEventListener('keydown', handleKeyPress);
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
    if (!focusTarget || !cameraRef.current || !controlsRef.current) return;

    setIsAnimating(true);

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    // Define target views for different focus targets
    let targetView;
    
    if (focusTarget === 'engraving') {
      // REPLACE THESE VALUES: Use the 'C' key to capture your desired engraving view
      targetView = {
      camera: new THREE.Vector3(-25.40, -15.70, 29.95),
      target: new THREE.Vector3(-5.78, -28.42, 30.55)
      };
    } else if (focusTarget === 'graphic') {
      // REPLACE THESE VALUES: Use the 'C' key to capture your desired graphic upload view
      targetView = {
      camera: new THREE.Vector3(-25.40, -15.70, 29.95),
      target: new THREE.Vector3(-5.78, -28.42, 30.55)
      };
    } else {
      return; // Unknown focus target
    }

    console.log('🎬 Starting camera animation to:', focusTarget);
    console.log('📍 Start position:', startPosition);
    console.log('🎯 Start target:', startTarget);
    console.log('📍 End position:', targetView.camera);
    console.log('🎯 End target:', targetView.target);

    // Disable controls during animation
    controls.enabled = false;

    // Animate camera over 3 seconds (50% slower than before)
    const duration = 3000;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function (ease-in-out cubic)
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetView.camera, easeProgress);
      
      // Interpolate controls target (look-at point)
      controls.target.lerpVectors(startTarget, targetView.target, easeProgress);
      
      // Update controls to apply the new target
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        console.log('✅ Animation complete');
        console.log('📍 Final camera position:', camera.position);
        console.log('🎯 Final target:', controls.target);
        setIsAnimating(false);
        // Keep controls disabled when focused
      }
    };

    animateCamera();
  }, [focusTarget]);

  // Re-enable controls when not in engraving/graphic mode
  useEffect(() => {
    if (!showEngravingUI && !showGraphicUI && !showReviewMode && controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [showEngravingUI, showGraphicUI, showReviewMode]);

  // Handle review mode - animate back to initial position and orbit
  useEffect(() => {
    if (!showReviewMode || !cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    console.log('🎬 Starting review mode animation');

    // Disable controls during animation
    controls.enabled = false;

    // First animate back to initial position
    const duration = 2000;
    const startTime = Date.now();

    const animateToStart = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPosition, initialCameraPosition.current, easeProgress);
      controls.target.lerpVectors(startTarget, initialCameraTarget.current, easeProgress);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateToStart);
      } else {
        console.log('✅ Returned to initial position, starting orbit');
        startOrbitAnimation();
      }
    };

    const startOrbitAnimation = () => {
      const orbitSpeed = 0.0015; // Slow rotation
      const orbitRadius = Math.sqrt(
        Math.pow(initialCameraPosition.current.x, 2) + 
        Math.pow(initialCameraPosition.current.y, 2)
      );
      let angle = Math.atan2(initialCameraPosition.current.y, initialCameraPosition.current.x);

      const orbit = () => {
        angle += orbitSpeed;
        
        camera.position.x = orbitRadius * Math.cos(angle);
        camera.position.y = orbitRadius * Math.sin(angle);
        camera.position.z = initialCameraPosition.current.z;
        
        controls.target.copy(initialCameraTarget.current);
        controls.update();

        orbitAnimationRef.current = requestAnimationFrame(orbit);
      };

      orbit();
    };

    animateToStart();

    // Cleanup orbit animation
    return () => {
      if (orbitAnimationRef.current) {
        cancelAnimationFrame(orbitAnimationRef.current);
        orbitAnimationRef.current = null;
      }
    };
  }, [showReviewMode]);

  return (
    <div className="telescope-viewer-container" style={{ position: 'relative', width: '100%', height: '500px' }}>
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

      {/* Color Control Buttons - Hidden when showing engraving/graphic UI */}
      {!showEngravingUI && !showGraphicUI && (
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
      )}

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

      {/* Graphic Upload UI Overlay */}
      {showGraphicUI && (
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
          pointerEvents: 'none',
        }}>
          {/* File Upload Dialog */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
            minWidth: '320px',
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#333',
              fontSize: '1.1rem',
              fontWeight: 600,
            }}>
              Upload Custom Graphic
            </h4>

            <div style={{
              border: '2px dashed #ddd',
              borderRadius: '8px',
              padding: '32px 20px',
              textAlign: 'center',
              background: '#fafafa',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#2a7a4f';
              e.currentTarget.style.background = '#f0f8f4';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.background = '#fafafa';
            }}>
              <input
                type="file"
                accept=".png,.svg,.jpg,.jpeg"
                onChange={onGraphicUpload}
                style={{ display: 'none' }}
                id="graphic-upload-input"
              />
              <label htmlFor="graphic-upload-input" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📁</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px', color: '#333' }}>
                  Click to upload
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  PNG, SVG, JPG (max 2MB)
                </div>
              </label>
            </div>
          </div>

          {/* Translucent bubble for graphic area */}
          <div style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
            zIndex: 16,
          }}>
            <div style={{
              width: '120px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(74, 144, 226, 0.5)',
              border: '3px solid rgba(74, 144, 226, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              boxShadow: '0 4px 16px rgba(74, 144, 226, 0.4)',
              animation: 'pulse 2s infinite',
            }}>
              Graphic Area
            </div>
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
          pointerEvents: 'none',
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
            top: '60%',
            left: '65%',
            transform: 'translate(-50%, -50%)',
            zIndex: 16,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {/* Left-pointing arrow */}
            <div style={{
              width: '0',
              height: '0',
              borderTop: '20px solid transparent',
              borderBottom: '20px solid transparent',
              borderRight: '30px solid #ff6b6b',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              animation: 'bounceHorizontal 2s infinite',
            }} />
            
            {/* Label beside arrow */}
            <div style={{
              background: '#ff6b6b',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              Engraving Area
            </div>
          </div>
        </div>
      )}

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
          
          @keyframes bounceHorizontal {
            0%, 20%, 50%, 80%, 100% {
              transform: translateX(0);
            }
            40% {
              transform: translateX(-10px);
            }
            60% {
              transform: translateX(-5px);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.05);
              opacity: 1;
            }
          }
        `
      }} />
      {/* Responsive height adjustment */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 640px) {
            .telescope-viewer-container {
              height: 350px !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default TelescopeViewer;
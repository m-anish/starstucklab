import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { stlFiles } from './telescopeStlFiles';
import { PASTEL_COLORS } from './telescopeColors';
import { pickColorForFile, positionModel } from './telescopeUtils';
import type { TelescopeViewerProps } from './telescopeTypes';
import OverlayContainer from './OverlayContainer';

// ============================================================================
// CAMERA POSITIONS - EDIT THESE TO CHANGE VIEWS
// ============================================================================
const CAMERA_VIEWS = {
  // Initial view (Step 1: Colors) - Wide angle showing full telescope
  initial: {
    camera: new THREE.Vector3(115, -100, -20),
    target: new THREE.Vector3(0, 0, 0)
  },
  
  // Engraving view (Step 2) - Close-up of tube area where engraving goes
  engraving: {
    camera: new THREE.Vector3(-25.40, -15.70, 29.95),
    target: new THREE.Vector3(-5.78, -28.42, 30.55)
  },
  
  // Graphic view (Step 3) - Close-up of graphic attachment area
  graphic: {
    camera: new THREE.Vector3(-25.40, -15.70, 29.95),
    target: new THREE.Vector3(-5.78, -28.42, 30.55)
  },
  
  // Review view (Step 4) - Same as initial, with slow orbit
  review: {
    camera: new THREE.Vector3(115, -100, -20),
    target: new THREE.Vector3(0, 0, 0)
  }
};

// To customize camera positions:
// 1. Load the page in your browser
// 2. Manually rotate the 3D view to your desired angle
// 3. Press the 'C' key on your keyboard
// 4. Check browser console for camera position values
// 5. Copy those values into the CAMERA_VIEWS object above

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
  showReviewMode,
  cameraState,
  onCameraStateChange
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
  const [isMobile, setIsMobile] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    // Use cameraState if provided, otherwise use initial view
    const initialPosition = cameraState?.position || CAMERA_VIEWS.initial.camera;
    const initialTarget = cameraState?.target || CAMERA_VIEWS.initial.target;
    camera.position.copy(initialPosition);
    camera.up.set(0, 0, 1);
    camera.lookAt(initialTarget);
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
    controls.target.copy(initialTarget);
    controlsRef.current = controls;

    // Listen for manual camera changes (user panning/zooming)
    const handleControlsChange = () => {
      // Only notify parent of manual changes when controls are enabled
      // (not during animations when controls are disabled)
      if (controls.enabled && onCameraStateChange) {
        onCameraStateChange({
          position: camera.position.clone(),
          target: controls.target.clone()
        });
      }
    };
    controls.addEventListener('change', handleControlsChange);

    // Debug: Press 'C' to capture current camera view
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        console.log('📸 CAMERA VIEW CAPTURED');
        console.log('Camera:', {
          x: camera.position.x.toFixed(2),
          y: camera.position.y.toFixed(2),
          z: camera.position.z.toFixed(2)
        });
        console.log('Target:', {
          x: controls.target.x.toFixed(2),
          y: controls.target.y.toFixed(2),
          z: controls.target.z.toFixed(2)
        });
        console.log(`Copy to CAMERA_VIEWS:
{
  camera: new THREE.Vector3(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}),
  target: new THREE.Vector3(${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)})
}`);
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

    // Load STL files with progress tracking
    const loader = new STLLoader();
    let loadedCount = 0;
    const totalFiles = stlFiles.length;

    const loadFile = (fileName: string) => {
      return new Promise<{ geometry: THREE.BufferGeometry; fileName: string }>((resolve, reject) => {
        loader.load(
          `/models/m42/${fileName}`,
          (geometry) => {
            loadedCount++;
            setLoadingProgress((loadedCount / totalFiles) * 100);

            // Create mesh
            const material = new THREE.MeshStandardMaterial({
              color: pickColorForFile(fileName, colors.tubeA, colors.tubeB, colors.base),
              metalness: fileName.includes('mirror') ? 0.9 : 0.1,
              roughness: fileName.includes('mirror') ? 0.1 : 0.8,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            positionModel(mesh, fileName);
            scene.add(mesh);
            modelsRef.current.set(fileName, mesh);

            resolve({ geometry, fileName });

            // Hide loading when all files are loaded
            if (loadedCount >= totalFiles) {
              setTimeout(() => setIsLoading(false), 500); // Small delay for smooth transition
            }
          },
          undefined,
          (error) => {
            loadedCount++;
            setLoadingProgress((loadedCount / totalFiles) * 100);
            console.warn(`Failed to load ${fileName}:`, error);
            reject(error);

            // Still hide loading even if some files fail
            if (loadedCount >= totalFiles) {
              setTimeout(() => setIsLoading(false), 500);
            }
          }
        );
      });
    };

    // Load all files
    stlFiles.forEach(fileName => {
      loadFile(fileName).catch(() => {
        // Individual file failures are handled above
      });
    });

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

  // Handle camera focus animation (Steps 2 & 3) and return to initial (Step 1)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    setIsAnimating(true);
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // START FROM CURRENT POSITION (not hardcoded!)
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    let targetView;
    if (focusTarget === 'engraving') {
      targetView = CAMERA_VIEWS.engraving;
    } else if (focusTarget === 'graphic') {
      targetView = CAMERA_VIEWS.graphic;
    } else if (focusTarget === null || focusTarget === undefined) {
      // Return to initial view when going back to step 1
      targetView = CAMERA_VIEWS.initial;
    } else {
      return;
    }

    controls.enabled = false;

    const duration = 4000; // 4 seconds (100% slower)
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPosition, targetView.camera, easeProgress);
      controls.target.lerpVectors(startTarget, targetView.target, easeProgress);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        setIsAnimating(false);
        // Notify parent of final camera state
        onCameraStateChange?.({
          position: camera.position.clone(),
          target: controls.target.clone()
        });
        // Re-enable controls when back to initial view, keep disabled when focused
        if (!focusTarget) {
          controls.enabled = true;
        }
      }
    };

    animateCamera();
  }, [focusTarget]);

  // Re-enable controls when not in special modes
  useEffect(() => {
    if (!showEngravingUI && !showGraphicUI && !showReviewMode && controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [showEngravingUI, showGraphicUI, showReviewMode]);

  // Handle review mode - animate back and orbit
  useEffect(() => {
    if (!showReviewMode || !cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    // START FROM CURRENT POSITION (not hardcoded!)
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();

    controls.enabled = false;

    const duration = 4000; // 4 seconds (100% slower)
    const startTime = Date.now();

    const animateToReview = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPosition, CAMERA_VIEWS.review.camera, easeProgress);
      controls.target.lerpVectors(startTarget, CAMERA_VIEWS.review.target, easeProgress);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateToReview);
      } else {
        // Notify parent of final camera state before starting orbit
        onCameraStateChange?.({
          position: camera.position.clone(),
          target: controls.target.clone()
        });
        startOrbitAnimation();
      }
    };

    const startOrbitAnimation = () => {
      const orbitSpeed = 0.0015;
      const orbitRadius = Math.sqrt(
        Math.pow(CAMERA_VIEWS.review.camera.x, 2) + 
        Math.pow(CAMERA_VIEWS.review.camera.y, 2)
      );
      let angle = Math.atan2(CAMERA_VIEWS.review.camera.y, CAMERA_VIEWS.review.camera.x);

      const orbit = () => {
        angle += orbitSpeed;
        camera.position.x = orbitRadius * Math.cos(angle);
        camera.position.y = orbitRadius * Math.sin(angle);
        camera.position.z = CAMERA_VIEWS.review.camera.z;
        controls.target.copy(CAMERA_VIEWS.review.target);
        controls.update();
        orbitAnimationRef.current = requestAnimationFrame(orbit);
      };

      orbit();
    };

    animateToReview();

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

      {/* Loading Progress Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          borderRadius: '12px',
        }}>
          <div className="parchment parchment--compact" style={{
            textAlign: 'center',
            minWidth: '250px',
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
              🔭 Loading Telescope...
            </div>

            <div style={{
              width: '200px',
              height: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              margin: '0 auto 12px',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #2a7a4f, #4a90e2)',
                width: `${loadingProgress}%`,
                transition: 'width 0.3s ease',
                borderRadius: '4px',
              }} />
            </div>

            <div style={{
              fontSize: '0.9rem',
              color: 'var(--parchment-italic)',
            }}>
              {Math.round(loadingProgress)}% complete
            </div>
          </div>
        </div>
      )}

      {/* Color Control Buttons */}
      {!showEngravingUI && !showGraphicUI && !showReviewMode && (
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '20px' : '30px',
          left: isMobile ? '20px' : '30px',
          transform: isMobile ? 'scale(0.8)' : 'scale(1.0)',
          transformOrigin: isMobile ? 'bottom left' : 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          zIndex: 10,
        }}>
          {[
            { key: 'tubeA', label: 'A', color: colors.tubeA },
            { key: 'tubeB', label: 'B', color: colors.tubeB },
            { key: 'base', label: 'Base', color: colors.base },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setSelectedPart(key as 'tubeA' | 'tubeB' | 'base')}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: color,
                border: selectedPart === key ? '3px solid #2a7a4f' : '3px solid rgba(255,255,255,0.8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 600,
                color: color === '#f7f7f7' ? '#333' : '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                margin: isMobile ? '0' : '4px',
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
          <div className="parchment parchment--compact" style={{
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80%',
            overflow: 'auto',
          }}>
            <h4 style={{
              margin: '0 0 var(--space-5) 0',
              textAlign: 'center',
            }}>
              Choose {selectedPart === 'tubeA' ? 'Tube A' : selectedPart === 'tubeB' ? 'Tube B' : 'Base'} Color
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
              gap: '12px',
              marginBottom: 'var(--space-5)',
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
                    height: '60px',
                    borderRadius: '8px',
                    background: color.hex,
                    border: '2px solid rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: (color.hex === '#f7f7f7' || color.hex === '#ffd100')? '#333' : '#fff',
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
              className="button"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #888 0%, #666 100%)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Engraving UI - MOVED BELOW ON MOBILE */}
      {showEngravingUI && (
        <>
          <OverlayContainer isMobile={isMobile} className="parchment parchment--compact" style={{ minWidth: '300px' }}>
            <h5 style={{
              margin: '0 0 var(--space-3) 0',
            }}>
              Add Engraving Text
            </h5>

            <input
              type="text"
              maxLength={15}
              value={engravingText || ''}
              onChange={(e) => onEngravingChange?.(e.target.value)}
              placeholder="Enter engraving text..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.8rem',
                border: '2px solid rgba(80, 50, 25, 0.25)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                marginBottom: '8px',
                background: 'rgba(255, 250, 240, 0.9)',
                color: 'var(--parchment-text)',
              }}
            />

            <div style={{
              fontSize: '0.8rem',
              color: 'var(--parchment-italic)',
              textAlign: 'right',
            }}>
              {(engravingText || '').length}/15 characters
            </div>
          </OverlayContainer>

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
            <div style={{
              width: '0',
              height: '0',
              borderTop: '20px solid transparent',
              borderBottom: '20px solid transparent',
              borderRight: '30px solid #ff6b6b',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              animation: 'bounceHorizontal 2s infinite',
            }} />

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
        </>
      )}

      {/* Graphic Upload UI - MOVED BELOW ON MOBILE */}
      {showGraphicUI && (
        <>
          <OverlayContainer isMobile={isMobile}>
            <h5 style={{
              margin: '0 0 var(--space-4) 0',
            }}>
              Upload Custom Graphic
            </h5>

            <div style={{
              border: '2px dashed rgba(80, 50, 25, 0.3)',
              borderRadius: '8px',
              padding: '32px 20px',
              textAlign: 'center',
              background: 'rgba(255, 250, 240, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}>
              <input
                type="file"
                accept=".png,.svg,.jpg,.jpeg"
                onChange={onGraphicUpload}
                style={{ display: 'none' }}
                id="graphic-upload-input"
              />
              <label htmlFor="graphic-upload-input" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>📁</div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--parchment-heading)'
                }}>
                  Click to upload
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  color: 'var(--parchment-italic)'
                }}>
                  PNG, SVG, JPG (max 2MB)
                </div>
              </label>
            </div>
          </OverlayContainer>

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
        </>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bounceHorizontal {
            0%, 20%, 50%, 80%, 100% { transform: translateX(0); }
            40% { transform: translateX(-10px); }
            60% { transform: translateX(-5px); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
          }
          
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

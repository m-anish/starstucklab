import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Color picker for telescope components
const pickColorForFile = (
  fileName: string,
  tubeAColor: string,
  tubeBColor: string,
  baseColor: string
): string => {
  const name = fileName.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '-').replace(/_/g, '-').trim();

  if (name.startsWith('tube-a-')) return tubeAColor;
  if (name.startsWith('tube-b-')) return tubeBColor;
  if (name.startsWith('base-')) return baseColor;
  if (name.startsWith('mount-')) return '#f5f5f5';
  if (name.startsWith('rod-')) return '#d6d6d6';
  if (name.startsWith('black-')) return '#1a1a1a';
  if (name.startsWith('mirror-')) return '#b2d9db';

  return '#9a9a9a';
};

// Pastel color palette with Hitchhiker's Guide meets Back to Future vibes
const PASTEL_COLORS = [
  // 🔥 WARM
  { hex: '#b31021', name: 'Sorrow Red' },
  { hex: '#ffd100', name: 'Warning Yellow' },
  { hex: '#eb7d16', name: 'Signal Orange' },
  { hex: '#7a4c24', name: 'Rust Brown' },
  { hex: '#d7267a', name: 'Pulse Magenta' },

  // ❄️ COOL
  { hex: '#005bbf', name: 'Echo Blue' },
  { hex: '#197e28', name: 'Forest Green' },
  { hex: '#02a9a1', name: 'Lost Teal' },
  { hex: '#6649a8', name: 'Dream Purple' },

  // 🌫 NEUTRAL
  { hex: '#111111', name: 'Oblivion Black' },
  { hex: '#f7f7f7', name: 'Blank White' },
  { hex: '#a1a3a4', name: 'Static Gray' },
];

const textColorFor = (hex: string) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000' : '#fff';
};

const TelescopeCustomizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = useRef<number>();

  const [tubeAColor, setTubeAColor] = useState('#b31021'); // Red
  const [tubeBColor, setTubeBColor] = useState('#ffd100'); // Yellow
  const [baseColor, setBaseColor] = useState('#a1a3a4');   // Gray
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeControl, setActiveControl] = useState<'tubeA' | 'tubeB' | 'base'>('tubeA');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Discover STL files dynamically
  const discoverSTLFiles = async (): Promise<string[]> => {
    const modules = import.meta.glob('/src/models/*.stl', {
      import: 'default',
      eager: true,
    });

    const files = Object.values(modules) as string[];
    console.log('📂 Discovered STL files:', files);
    return files;
  };

  // Load STL files
  const loadSTLFiles = async () => {
    const loader = new STLLoader();
    const stlFiles = await discoverSTLFiles();

    if (stlFiles.length === 0) {
      console.warn('⚠️ No STL files found');
      return new Map();
    }

    let loaded = 0;

    const meshPromises = stlFiles.map(async (filePath) => {
      try {
        const geometry = await loader.loadAsync(filePath);
        geometry.computeVertexNormals();

        let metalness = 0.3;
        let roughness = 0.7;

        const fileName = filePath.split('/').pop() || '';
        if (fileName.startsWith('mirror-')) {
          metalness = 0.8;
          roughness = 0.1;
        }
        else if (fileName.startsWith('rod-')) {
          metalness = 0.9;
          roughness = 0.5;
        }

        const material = new THREE.MeshStandardMaterial({
          color: pickColorForFile(fileName, tubeAColor, tubeBColor, baseColor),
          metalness: metalness,
          roughness: roughness,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        loaded++;
        setLoadingProgress((loaded / stlFiles.length) * 100);

        console.log(`✅ Loaded: ${fileName}`);
        return { file: fileName, mesh };
      } catch (error) {
        console.error(`❌ Failed to load ${filePath}:`, error);
        return null;
      }
    });

    const results = await Promise.all(meshPromises);
    const meshMap = new Map<string, THREE.Mesh>();

    results.forEach(result => {
      if (result) {
        meshMap.set(result.file, result.mesh);
      }
    });

    console.log(`📦 Total meshes loaded: ${meshMap.size}`);
    return meshMap;
  };

  // Update colors when user changes selection
  useEffect(() => {
    if (!modelsRef.current.size) return;

    modelsRef.current.forEach((mesh, file) => {
      const newColor = pickColorForFile(file, tubeAColor, tubeBColor, baseColor);
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.setStyle(newColor);
      }
    });
  }, [tubeAColor, tubeBColor, baseColor]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    // Camera setup - Z is UP
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(60, -50, 0);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 40);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2);
    mainLight.position.set(50, 50, 100);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
    fillLight.position.set(-30, -30, 50);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 100, 30);
    scene.add(rimLight);

    // Ground
    const groundGeometry = new THREE.CircleGeometry(500, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.z = -40;
    ground.receiveShadow = true;
    scene.add(ground);

    // Background & fog
    const backgroundColor = 0xd8e1e8;
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.Fog(backgroundColor, 1, 500);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
    hemisphereLight.position.set(0, 0, 1);
    scene.add(hemisphereLight);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const enforceUpright = () => {
      camera.up.set(0, 0, 1);
    };

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      enforceUpright();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Load models
    loadSTLFiles().then((meshMap) => {
      if (meshMap.size === 0) {
        setError('No STL files could be loaded. Check /public/models/ directory.');
        setIsLoading(false);
        return;
      }

      const group = new THREE.Group();
      meshMap.forEach((mesh) => group.add(mesh));

      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      group.position.sub(center);
      group.position.y += 32; // To the left
      group.position.z -= 12; // A little below center
      group.scale.setScalar(0.05);

      scene.add(group);
      camera.lookAt(group.position);
      modelsRef.current = meshMap;

      setIsLoading(false);
      setError(null);
    }).catch(err => {
      console.error('❌ Error loading models:', err);
      setError('Failed to load telescope models. Check browser console.');
      setIsLoading(false);
    });

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current) return;

      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  const handleColorChange = (color: string) => {
    if (activeControl === 'tubeA') setTubeAColor(color);
    else if (activeControl === 'tubeB') setTubeBColor(color);
    else setBaseColor(color);
  };

  const getCurrentColor = () => {
    if (activeControl === 'tubeA') return tubeAColor;
    if (activeControl === 'tubeB') return tubeBColor;
    return baseColor;
  };

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0',
      padding: '0',
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      {/* 3D Viewer - Full screen */}
      <div style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        background: '#d8e1e8',
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'grab',
            touchAction: 'pan-y pinch-zoom',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = 'grabbing';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = 'grab';
          }}
        />

        {/* Unified Controls Overlay */}
        {!isLoading && !error && (
          <>
            {/* Button Row */}
            <div style={{
              position: 'absolute',
              bottom: drawerOpen ? '200px' : '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              zIndex: 200,
              transition: 'bottom 0.3s ease',
            }}>
              {[
                { key: 'tubeA', color: tubeAColor, label: 'Tube A' },
                { key: 'tubeB', color: tubeBColor, label: 'Tube B' },
                { key: 'base', color: baseColor, label: 'Base' },
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => {
                    setActiveControl(btn.key as any);
                    setDrawerOpen(true);
                  }}
                  style={{
                    padding: '10px 16px',
                    background: '#ffffffcc',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '30px',
                    border: `3px solid ${btn.color}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    color: '#222',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: btn.color,
                    border: '2px solid rgba(0,0,0,0.3)',
                  }} />
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Sliding Drawer */}
            <div style={{
              position: 'absolute',
              bottom: drawerOpen ? '100px' : '-260px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '500px',
              padding: '20px 20px 28px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '14px',
              transition: 'bottom 0.45s cubic-bezier(0.25, 0.8, 0.25, 1)',
              zIndex: 500,
            }}>
              {PASTEL_COLORS.map(color => (
                <button
                  key={color.hex}
                  title={color.name}
                  onClick={() => {
                    if (activeControl === 'tubeA') setTubeAColor(color.hex);
                    if (activeControl === 'tubeB') setTubeBColor(color.hex);
                    if (activeControl === 'base') setBaseColor(color.hex);
                    setDrawerOpen(false);
                  }}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: color.hex,
                    border: '3px solid rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    color: textColorFor(color.hex),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    padding: '4px',
                    lineHeight: '1.1',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {color.name.replace(' ', '\n')}
                </button>
              ))}
            </div>

            {/* Add to Cart */}
            <div style={{
              position: 'absolute',
              top: isMobile ? '16px' : '24px',
              right: isMobile ? '16px' : '24px',
              zIndex: 100,
            }}>
              <button
                style={{
                  padding: isMobile ? '12px 28px' : '14px 38px',
                  background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
                  border: '2px solid #2a7a4f',
                  borderRadius: '24px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
              >
                Add to Cart
              </button>
            </div>

          </>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#333',
            textAlign: 'center',
            zIndex: 200,
          }}>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '1rem',
              fontWeight: 600,
            }}>
              Loading telescope...
            </div>
            <div style={{
              width: '200px',
              height: '4px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #4ec57a, #2a7a4f)',
                width: `${loadingProgress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              color: '#666',
            }}>
              {Math.round(loadingProgress)}%
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#333',
            textAlign: 'center',
            padding: '2rem',
            zIndex: 200,
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}>
              ⚠️
            </div>
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
            }}>
              {error}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#666',
            }}>
              Check browser console for details
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelescopeCustomizer;
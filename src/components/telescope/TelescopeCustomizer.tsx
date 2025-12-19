import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Color picker for telescope components
const pickColorForFile = (fileName: string, tubeColor: string, mountColor: string): string => {
  const name = fileName.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '-').replace(/_/g, '-').trim();
  
  if (name.startsWith('tube-')) return tubeColor;
  if (name.startsWith('base-')) return mountColor;
  if (name.startsWith('black-')) return '#1a1a1a'; // Always black
  if (name.startsWith('mirror-')) return '#b2d9dbff'; // Always bluish-silver
  
  return '#9a9a9a'; // Default gray for other parts
};

// Color presets for quick selection
const COLOR_PRESETS = {
  tube: [
    { name: 'Midnight Black', hex: '#1a1a1a' },
    { name: 'Space Gray', hex: '#4a4a4a' },
    { name: 'Deep Navy', hex: '#1a2332' },
    { name: 'Forest Green', hex: '#2d4a2b' },
    { name: 'Burgundy', hex: '#4a1a1a' },
  ],
  mount: [
    { name: 'Natural Wood', hex: '#8b6f47' },
    { name: 'Dark Walnut', hex: '#5d4a37' },
    { name: 'Cherry', hex: '#8b4513' },
    { name: 'Ebony', hex: '#2b1810' },
    { name: 'Birch', hex: '#d4a574' },
  ],
};

const TelescopeCustomizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = useRef<number>();

  const [tubeColor, setTubeColor] = useState('#1a1a1a');
  const [mountColor, setMountColor] = useState('#8b6f47');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // Use import.meta.glob with eager: false to get file paths without importing them
    const modules = import.meta.glob('/public/models/*.stl', { 
      eager: false,
      as: 'url'
    });
    
    // Extract just the public URLs
    const files = Object.keys(modules).map(path => {
      // Convert /public/models/file.stl to /models/file.stl
      return path.replace('/public', '');
    });
    
    console.log('📂 Discovered STL files:', files);
    return files;
  };

  // Load STL files
  const loadSTLFiles = async () => {
    const loader = new STLLoader();
    const stlFiles = await discoverSTLFiles();
    
    if (stlFiles.length === 0) {
      console.warn('⚠️ No STL files found in /public/models/');
      return new Map();
    }
    
    let loaded = 0;

    const meshPromises = stlFiles.map(async (filePath) => {
      try {
        const geometry = await loader.loadAsync(filePath);
        geometry.computeVertexNormals();

        var metalness = 0.3;
        var roughness = 0.7;
     
        const fileName = filePath.split('/').pop() || '';
        if (fileName.startsWith('mirror-')) {
          metalness = 0.8;
          roughness = 0.1;
        }

        const material = new THREE.MeshStandardMaterial({
          color: pickColorForFile(fileName, tubeColor, mountColor),
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
      const newColor = pickColorForFile(file, tubeColor, mountColor);
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.setStyle(newColor);
      }
    });
  }, [tubeColor, mountColor]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xbbc8d1);
    sceneRef.current = scene;

    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    // Camera setup - Z is UP
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(75, -87, 19);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
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

    // Lighting setup - three-point lighting for better visualization
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    // Main light (key light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 2);
    mainLight.position.set(50, 50, 100);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
    fillLight.position.set(-30, -30, 50);
    scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 100, 30);
    scene.add(rimLight);

    // Create circular geometry (Radius 500, 64 segments for smoothness)
    const groundGeometry = new THREE.CircleGeometry(500, 64);

    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444, 
        roughness: 0.8,
        metalness: 0
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);

    // Position it 40 units down the vertical Z-axis
    ground.position.z = -40; 

    ground.receiveShadow = true;
    scene.add(ground);

    // Match background and fog for the faint horizon effect
    const backgroundColor = 0xd8e1e8;
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.Fog(backgroundColor, 1, 500);

    // Sky color (top), Ground color (bottom), Intensity
    const light = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
    light.position.set(0, 0, 1); // Light shines down from the positive Z-axis
    scene.add(light);


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

    // Keep camera upright (Z-up)
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
      
      meshMap.forEach((mesh) => {
        group.add(mesh);
      });

      // Center the model
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      group.position.sub(center);

      // Scale for visibility
      group.scale.setScalar(0.05);
      scene.add(group);
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  const ColorPicker = ({ 
    title, 
    value, 
    onChange, 
    presets 
  }: { 
    title: string; 
    value: string; 
    onChange: (color: string) => void;
    presets: { name: string; hex: string }[];
  }) => (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ 
        fontSize: '1.1rem', 
        marginBottom: '0.75rem',
        color: '#f8f4e8',
        fontWeight: 600,
      }}>
        {title}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: '0.75rem',
      }}>
        {presets.map((preset) => (
          <button
            key={preset.hex}
            onClick={() => onChange(preset.hex)}
            style={{
              position: 'relative',
              padding: '0.5rem',
              border: value === preset.hex ? '3px solid #4ec57a' : '2px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              background: preset.hex,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'flex-end',
            }}
            onMouseEnter={(e) => {
              if (value !== preset.hex) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (value !== preset.hex) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }
            }}
          >
            <span style={{
              fontSize: '0.7rem',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600,
              lineHeight: 1.2,
            }}>
              {preset.name}
            </span>
            {value === preset.hex && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                fontSize: '1.2rem',
                color: '#4ec57a',
                textShadow: '0 0 4px rgba(0,0,0,0.5)',
              }}>
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ 
      maxWidth: isMobile ? '100%' : '1400px', 
      margin: '0 auto', 
      padding: isMobile ? '1rem' : '2rem 1rem',
      minHeight: '100vh',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '350px 1fr',
        gap: isMobile ? '1.5rem' : '2rem',
        alignItems: 'start',
      }}>
        {/* Control Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: isMobile ? '1.5rem' : '2rem',
          position: isMobile ? 'relative' : 'sticky',
          top: isMobile ? '0' : '100px',
          maxHeight: isMobile ? 'none' : 'calc(100vh - 120px)',
          overflowY: 'auto',
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1.5rem',
            color: '#f8f4e8',
            fontWeight: 700,
          }}>
            Customize Your M42
          </h2>

          <ColorPicker
            title="Tube Color"
            value={tubeColor}
            onChange={setTubeColor}
            presets={COLOR_PRESETS.tube}
          />

          <ColorPicker
            title="Mount Color"
            value={mountColor}
            onChange={setMountColor}
            presets={COLOR_PRESETS.mount}
          />

          <div style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              border: '2px solid #2a7a4f',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              Add to Cart
            </button>

            <p style={{
              marginTop: '1rem',
              fontSize: '0.85rem',
              color: 'rgba(248,244,232,0.7)',
              textAlign: 'center',
            }}>
              🖱️ {isMobile ? 'Touch to rotate • Pinch to zoom' : 'Rotate, pan, and zoom to explore'}
            </p>
          </div>
        </div>

        {/* 3D Viewer */}
        <div style={{
          position: 'relative',
          height: isMobile ? '60vh' : '80vh',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          background: '#1a1f2e',
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              cursor: 'grab',
              touchAction: 'none',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.cursor = 'grabbing';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.cursor = 'grab';
            }}
          />

          {isLoading && !error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              textAlign: 'center',
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
                background: 'rgba(255,255,255,0.1)',
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
                color: 'rgba(255,255,255,0.7)',
              }}>
                {Math.round(loadingProgress)}%
              </div>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              textAlign: 'center',
              padding: '2rem',
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
                color: 'rgba(255,255,255,0.7)',
              }}>
                Check browser console for details
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.85rem',
              backdropFilter: 'blur(4px)',
              whiteSpace: 'nowrap',
            }}>
              {isMobile ? '👆 Touch to explore' : '🖱️ Drag to rotate • Scroll to zoom • Right-click to pan'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelescopeCustomizer;
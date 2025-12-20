import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface CustomizationState {
  tubeAColor: string;
  tubeBColor: string;
  baseColor: string;
  engraving: string;
  graphic: File | null;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const STEPS: WizardStep[] = [
  { id: 'colors', title: 'Choose Colors', description: 'Select colors for tubes and base', icon: '🎨' },
  { id: 'engraving', title: 'Add Engraving', description: 'Personalize with text (optional)', icon: '✍️' },
  { id: 'graphic', title: 'Attach Graphic', description: 'Upload custom artwork (optional)', icon: '🖼️' },
  { id: 'review', title: 'Review & Add to Cart', description: 'Confirm your choices', icon: '✓' }
];

const PASTEL_COLORS = [
  { hex: '#b31021', name: 'Sorrow Red' },
  { hex: '#ffd100', name: 'Warning Yellow' },
  { hex: '#eb7d16', name: 'Signal Orange' },
  { hex: '#7a4c24', name: 'Rust Brown' },
  { hex: '#d7267a', name: 'Pulse Magenta' },
  { hex: '#005bbf', name: 'Echo Blue' },
  { hex: '#197e28', name: 'Forest Green' },
  { hex: '#02a9a1', name: 'Lost Teal' },
  { hex: '#6649a8', name: 'Dream Purple' },
  { hex: '#111111', name: 'Oblivion Black' },
  { hex: '#f7f7f7', name: 'Blank White' },
  { hex: '#a1a3a4', name: 'Static Gray' },
];

const BASE_PRICE = 28000;
const ENGRAVING_COST = 500;
const GRAPHIC_COST = 1000;

// ============================================================================
// COLOR PICKER FOR STL FILES
// ============================================================================

const pickColorForFile = (fileName: string, tubeA: string, tubeB: string, base: string): string => {
  const name = fileName.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '-').replace(/_/g, '-').trim();
  if (name.startsWith('tube-a-')) return tubeA;
  if (name.startsWith('tube-b-')) return tubeB;
  if (name.startsWith('base-')) return base;
  if (name.startsWith('mount-')) return '#f5f5f5';
  if (name.startsWith('rod-')) return '#d6d6d6';
  if (name.startsWith('black-')) return '#1a1a1a';
  if (name.startsWith('mirror-')) return '#b2d9db';
  return '#9a9a9a';
};

// ============================================================================
// MODEL POSITIONING
// ============================================================================

const positionModel = (mesh: THREE.Mesh, fileName: string): void => {
  // Scale down if needed (STL files might be in different units)
  const scale = 0.1; // Adjust this based on actual model sizes
  mesh.scale.setScalar(scale);
};

// ============================================================================
// 3D VIEWER COMPONENT
// ============================================================================

interface TelescopeViewerProps {
  colors: { tubeA: string; tubeB: string; base: string };
}

const TelescopeViewer: React.FC<TelescopeViewerProps> = ({ colors }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const modelsRef = React.useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = React.useRef<number>();

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

    // Define files to load based on telescope assembly
    const stlFiles = [
      // Base components
      'base-front-bottom.stl',
      'base-left-bottom.stl',
      'base-left-top.stl',
      'base-right-bottom.stl',
      'base-right-top.stl',

      // Black components
      'black-6x30-finderscope-mount.stl',
      'black-Baffle.stl',
      'black-Celestron-51630-Red-Dot.stl',
      'black-Dovetail-mount.stl',
      'black-Mirror-Cell---Primary.stl',
      'black-Mirror-Cell---Secondary.stl',
      'black-NRF---Collet.stl',
      'black-NRF---Drawtube.stl',
      'black-Spider-curved-single-nut.stl',
      'black-Svbony-SV182-6x30-finderscope.stl',
      'black-UTA-Sleeve.stl',

      // Gray components
      'gray-Hex-bolt-M4x0.7-x-50mm_1.stl',
      'gray-Hex-bolt-M4x0.7-x-50mm_2.stl',
      'gray-Hex-bolt-M4x0.7-x-50mm_3.stl',
      'gray-Hex-bolt-M4x0.7-x-50mm_4.stl',
      'gray-Hex-bolt-M4x0.7-x-50mm_5.stl',
      'gray-Hex-bolt-M4x0.7-x-50mm_6.stl',
      'gray-Hex-bolt-M4x0.7-x-50mm.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_10.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_11.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_12.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_13.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_14.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_15.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_16.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_17.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_18.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_19.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_1.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_20.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_21.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_22.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_23.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_24.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_25.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_26.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_27.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_28.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_29.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_2.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_30.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_31.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_32.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_33.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_34.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_35.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_36.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_37.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_38.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_3.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_4.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_5.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_6.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_7.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_8.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7_9.stl',
      'gray-Hex-nut-grade-A---B-M4x0.7.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_10.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_11.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_12.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_13.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_14.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_15.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_16.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_17.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_18.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_1.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_2.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_3.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_4.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_5.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_6.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_7.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_8.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12_9.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-12.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-16_1.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-16_2.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-16_3.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-16.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20_1.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20_2.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20_3.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20_4.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20_5.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20_6.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20_7.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-20.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-25_1.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-25.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-8_1.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-8_2.stl',
      'gray-Hex-socket-head-cap-screw-M4x0.70-x-8.stl',
      'gray-Nut-dome-M4x0.7_1.stl',
      'gray-Nut-dome-M4x0.7_2.stl',
      'gray-Nut-dome-M4x0.7.stl',
      'gray-Nut-nyloc-M4x0.7_1.stl',
      'gray-Nut-nyloc-M4x0.7_2.stl',
      'gray-Nut-nyloc-M4x0.7_3.stl',
      'gray-Nut-nyloc-M4x0.7.stl',

      // Mirror components
      'mirror-Mirror---Primary.stl',
      'mirror-Secondary-mirror.stl',

      // Mount/Structural components
      'mount-base.stl',

      // Rod components
      'rod-base-bottom-back.stl',
      'rod-base-bottom-front-top-front-left.stl',
      'rod-base-bottom-front-top-front-right.stl',
      'rod-base-bottom-left.stl',
      'rod-base-bottom-left-top-back-left.stl',
      'rod-base-bottom-left-top-front-left.stl',
      'rod-base-bottom-right.stl',
      'rod-base-bottom-right-top-back-right.stl',
      'rod-base-bottom-right-top-front-right.stl',
      'rod-base-top.stl',
      'rod-ota-1-12mm_rod_1m.stl',
      'rod-ota-2-12mm_rod_1m_1.stl',
      'rod-ota-3-12mm_rod_1m_2.stl',
      
      // Tube A components
      'tube-a-Bearing-1.stl',
      'tube-a-Bearing-2.stl',
      'tube-a-farsight.stl',
      'tube-a-lta-for-sleeve.stl',
      'tube-a-NRF---Collet-Nut-knurled.stl',
      'tube-a-NRF---Retaining-Ring.stl',
      'tube-a-Thumbscrew-Small---M4-Nyloc.stl',
      'tube-a-uta-for-sleeve.stl',

      // Tube B components
      'tube-b-Bearing-Mount-Interface.stl',
      'tube-b-nearsight.stl',
      'tube-b-NRF---Base.stl',
      'tube-b-NRF--Nut-knurled.stl',
      'tube-b-secondary-collimation-plate.stl',
      'tube-b-thumbscrew-large-m4-nyloc_1.stl',
      'tube-b-thumbscrew-large-m4-nyloc_2.stl',
      'tube-b-thumbscrew-large-m4-nyloc.stl',
      'tube-b-thumbscrew-small-m4-hex-nut_1.stl',
      'tube-b-thumbscrew-small-m4-hex-nut_2.stl',
      'tube-b-thumbscrew-small-m4-hex-nut.stl'

    ];

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
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '12px',
        background: '#d8e1e8',
      }}
    />
  );
};

// ============================================================================
// COLOR PICKER COMPONENT
// ============================================================================

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const textColor = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '0.95rem' }}>
        {label}
      </label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
        gap: '12px',
      }}>
        {PASTEL_COLORS.map(color => (
          <button
            key={color.hex}
            onClick={() => onChange(color.hex)}
            style={{
              width: '100%',
              height: '70px',
              borderRadius: '8px',
              background: color.hex,
              border: value === color.hex ? '3px solid #2a7a4f' : '2px solid rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: textColor(color.hex),
              padding: '4px',
              textAlign: 'center',
              lineHeight: '1.2',
              boxShadow: value === color.hex ? '0 0 0 2px rgba(42,122,79,0.3)' : 'none',
            }}
          >
            {color.name.split(' ').join('\n')}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export default function CustomizationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [customization, setCustomization] = useState<CustomizationState>({
    tubeAColor: '#b31021',
    tubeBColor: '#ffd100',
    baseColor: '#a1a3a4',
    engraving: '',
    graphic: null,
  });
  const [graphicPreview, setGraphicPreview] = useState<string | null>(null);

  const updateCustomization = (updates: Partial<CustomizationState>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const calculatePrice = () => {
    let total = BASE_PRICE;
    if (customization.engraving) total += ENGRAVING_COST;
    if (customization.graphic) total += GRAPHIC_COST;
    return total;
  };

  const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File too large (max 2MB)');
      return;
    }

    updateCustomization({ graphic: file });

    const reader = new FileReader();
    reader.onload = (ev) => {
      setGraphicPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    // Get existing cart
    const stored = localStorage.getItem('starstucklab_cart');
    const cart = stored ? JSON.parse(stored) : { items: [] };

    // Convert graphic to base64 for storage
    if (customization.graphic && graphicPreview) {
      const cartItem = {
        slug: 'm42',
        title: 'M42 Dobsonian (Customized)',
        price: calculatePrice().toString(),
        currency: 'INR',
        quantity: 1,
        customization: {
          tubeAColor: customization.tubeAColor,
          tubeBColor: customization.tubeBColor,
          baseColor: customization.baseColor,
          engraving: customization.engraving,
          graphicData: graphicPreview,
          graphicName: customization.graphic.name,
        }
      };

      cart.items.push(cartItem);
    } else {
      const cartItem = {
        slug: 'm42',
        title: 'M42 Dobsonian (Customized)',
        price: calculatePrice().toString(),
        currency: 'INR',
        quantity: 1,
        customization: {
          tubeAColor: customization.tubeAColor,
          tubeBColor: customization.tubeBColor,
          baseColor: customization.baseColor,
          engraving: customization.engraving,
        }
      };

      cart.items.push(cartItem);
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    cart.expiry = expiry.toISOString();

    localStorage.setItem('starstucklab_cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: cart.items } }));

    // Show success message and redirect back to product page
    alert('✓ Added to cart!');
    window.location.href = '/shop/m42';
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <a 
          href="/shop/m42" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#666',
            textDecoration: 'none',
            fontSize: '0.95rem',
            transition: 'color 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#2a7a4f'}
          onMouseOut={(e) => e.currentTarget.style.color = '#666'}
        >
          ← Back to Product Details
        </a>
      </div>
      {/* Progress Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '40px',
        padding: '0 20px',
      }}>
        {STEPS.map((step, idx) => (
          <div key={step.id} style={{
            flex: 1,
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: idx <= currentStep ? '#2a7a4f' : '#ddd',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              fontSize: '1.5rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
            }}>
              {idx < currentStep ? '✓' : step.icon}
            </div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: idx === currentStep ? 600 : 400,
              color: idx === currentStep ? '#2a7a4f' : '#666',
            }}>
              {step.title}
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                left: 'calc(50% + 24px)',
                width: 'calc(100% - 48px)',
                height: '2px',
                background: idx < currentStep ? '#2a7a4f' : '#ddd',
                transition: 'all 0.3s ease',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ minHeight: '500px', marginBottom: '32px' }}>
        {/* Step 0: Colors */}
        {currentStep === 0 && (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Choose Your Colors</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Select colors for each part of your telescope</p>

            <TelescopeViewer colors={{
              tubeA: customization.tubeAColor,
              tubeB: customization.tubeBColor,
              base: customization.baseColor,
            }} />

            <div style={{ marginTop: '32px' }}>
              <ColorPicker
                label="Tube A Color"
                value={customization.tubeAColor}
                onChange={(color) => updateCustomization({ tubeAColor: color })}
              />
              <ColorPicker
                label="Tube B Color"
                value={customization.tubeBColor}
                onChange={(color) => updateCustomization({ tubeBColor: color })}
              />
              <ColorPicker
                label="Base Color"
                value={customization.baseColor}
                onChange={(color) => updateCustomization({ baseColor: color })}
              />
            </div>
          </div>
        )}

        {/* Step 1: Engraving */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Add Engraving (Optional)</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Personalize your telescope with custom text (max 30 characters)</p>

            <div style={{
              background: '#f5f5f5',
              padding: '32px',
              borderRadius: '12px',
              marginBottom: '24px',
            }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>
                Engraving Text
              </label>
              <input
                type="text"
                maxLength={30}
                value={customization.engraving}
                onChange={(e) => updateCustomization({ engraving: e.target.value })}
                placeholder="Enter your text..."
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.1rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#666' }}>
                {customization.engraving.length}/30 characters
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              padding: '48px',
              borderRadius: '12px',
              color: '#fff',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '12px', opacity: 0.9 }}>
                Preview:
              </div>
              <div style={{
                fontSize: '2rem',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                letterSpacing: '2px',
              }}>
                {customization.engraving || '(no engraving)'}
              </div>
            </div>

            {customization.engraving && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(42,122,79,0.1)',
                borderRadius: '8px',
                color: '#2a7a4f',
                fontSize: '0.9rem',
              }}>
                ✓ Engraving will add ₹{ENGRAVING_COST.toLocaleString()} to the total price
              </div>
            )}
          </div>
        )}

        {/* Step 2: Graphic */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Attach Custom Graphic (Optional)</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Upload artwork or logo (PNG, SVG, JPG - max 2MB)</p>

            <div style={{
              border: '2px dashed #ddd',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              background: '#fafafa',
              cursor: 'pointer',
            }}>
              <input
                type="file"
                accept=".png,.svg,.jpg,.jpeg"
                onChange={handleGraphicUpload}
                style={{ display: 'none' }}
                id="graphic-upload"
              />
              <label htmlFor="graphic-upload" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                  Click to upload or drag and drop
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  PNG, SVG, or JPG (max 2MB)
                </div>
              </label>
            </div>

            {graphicPreview && (
              <div style={{ marginTop: '32px' }}>
                <div style={{ fontWeight: 600, marginBottom: '12px' }}>Preview:</div>
                <div style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '2px solid #ddd',
                  textAlign: 'center',
                }}>
                  <img
                    src={graphicPreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  />
                  <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#666' }}>
                    {customization.graphic?.name}
                  </div>
                </div>

                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'rgba(42,122,79,0.1)',
                  borderRadius: '8px',
                  color: '#2a7a4f',
                  fontSize: '0.9rem',
                }}>
                  ✓ Custom graphic will add ₹{GRAPHIC_COST.toLocaleString()} to the total price
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Review Your Customization</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>Confirm your choices before adding to cart</p>

            <div style={{
              background: '#f5f5f5',
              padding: '32px',
              borderRadius: '12px',
              marginBottom: '24px',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>Colors</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { label: 'Tube A', color: customization.tubeAColor },
                    { label: 'Tube B', color: customization.tubeBColor },
                    { label: 'Base', color: customization.baseColor },
                  ].map(item => (
                    <div key={item.label} style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#fff',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: item.color,
                        margin: '0 auto 8px',
                        border: '3px solid rgba(0,0,0,0.1)',
                      }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                        {PASTEL_COLORS.find(c => c.hex === item.color)?.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {customization.engraving && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>Engraving</div>
                  <div style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '1.2rem',
                  }}>
                    "{customization.engraving}"
                  </div>
                </div>
              )}

              {customization.graphic && (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>Custom Graphic</div>
                  <div style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}>
                    {graphicPreview && (
                      <img src={graphicPreview} alt="Graphic" style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{customization.graphic.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                        {(customization.graphic.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              padding: '32px',
              borderRadius: '12px',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '4px' }}>Total Price</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                    ₹{calculatePrice().toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>
                    Base: ₹{BASE_PRICE.toLocaleString()}
                    {customization.engraving && ` + Engraving: ₹${ENGRAVING_COST.toLocaleString()}`}
                    {customization.graphic && ` + Graphic: ₹${GRAPHIC_COST.toLocaleString()}`}
                  </div>
                </div>
                <div style={{ fontSize: '4rem' }}>🔭</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        paddingTop: '24px',
        borderTop: '1px solid #ddd',
      }}>
        {currentStep > 0 && (
          <button
            onClick={prevStep}
            style={{
              padding: '14px 32px',
              background: '#fff',
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            ← Previous
          </button>
        )}

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            style={{
              marginLeft: 'auto',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            Next Step →
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            style={{
              marginLeft: 'auto',
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(42,122,79,0.3)',
            }}
          >
            Add to Cart 🛒
          </button>
        )}
      </div>
    </div>
  );
}

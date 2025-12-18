// src/components/telescope/TelescopeCustomizer.tsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { loadTelescopeOBJ } from './OBJLoader';
import { matchPartToColor, applyColorToCategory } from './colorMatcher';

const TUBE_COLORS = [
  { name: 'Cosmic Black', hex: '#1a1a1a' },
  { name: 'Nebula Gray', hex: '#4a5568' },
  { name: 'Starlight White', hex: '#f7fafc' },
  { name: 'Deep Space Blue', hex: '#2c5282' },
  { name: 'Mars Red', hex: '#742a2a' },
  { name: 'Forest Green', hex: '#22543d' },
  { name: 'Solar Gold', hex: '#b7791f' },
  { name: 'Lunar Silver', hex: '#a0aec0' },
];

const MOUNT_COLORS = [
  { name: 'Natural Wood', hex: '#8b6f47' },
  { name: 'Dark Walnut', hex: '#3e2723' },
  { name: 'Matte Black', hex: '#2d3748' },
  { name: 'Charcoal Gray', hex: '#4a5568' },
];

const TelescopeCustomizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const telescopeRef = useRef<THREE.Group | null>(null);
  const textMeshRef = useRef<THREE.Sprite | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const [tubeColor, setTubeColor] = useState(TUBE_COLORS[0].hex);
  const [mountColor, setMountColor] = useState(MOUNT_COLORS[0].hex);
  const [customText, setCustomText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const basePrice = 28000;

  const getAdditionalCost = () => {
    let cost = 0;
    if (tubeColor !== TUBE_COLORS[0].hex) cost += 2000;
    if (customText.length > 0) cost += 1500;
    return cost;
  };

  const totalPrice = basePrice + getAdditionalCost();

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b0e);

    const camera = new THREE.PerspectiveCamera(
      45,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 3, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    const groundGeometry = new THREE.CircleGeometry(5, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1d24,
      metalness: 0,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const loadModel = async () => {
      try {
        const telescope = await loadTelescopeOBJ(
          '/models/m42-telescope.obj',
          '/models/m42-telescope.mtl'
        );

        console.log('Loaded telescope parts:');
        telescope.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.name.includes('tube-a') || 
                child.name.includes('tube-b') || 
                child.name.includes('base') || 
                child.name.includes('arm') || 
                child.name.includes('eyepiece')) {
              console.log('  -', child.name);
            }
          }
        });

        // telescope.scale.set(0.01, 0.01, 0.01);
        telescope.scale.set(1, 1, 1);
        telescope.position.set(0, 1, 0);

        telescope.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(telescope);
        telescopeRef.current = telescope;
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        createPlaceholder(scene);
        setIsLoading(false);
      }
    };

    loadModel();

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (telescopeRef.current && !isDragging.current) {
        telescopeRef.current.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !telescopeRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      telescopeRef.current.rotation.y += deltaX * 0.01;
      telescopeRef.current.rotation.x += deltaY * 0.01;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      camera.position.z = Math.max(3, Math.min(15, camera.position.z + delta));
    };

    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvasRef.current.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, []);

  const createPlaceholder = (scene: THREE.Scene) => {
    const telescope = new THREE.Group();

    const tubeGeometry = new THREE.CylinderGeometry(0.3, 0.35, 4, 32);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: tubeColor,
      metalness: 0.7,
      roughness: 0.3,
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.rotation.z = Math.PI / 2;
    tube.position.y = 1.5;
    tube.name = 'tube-a';
    tube.castShadow = true;
    telescope.add(tube);

    const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.3, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: mountColor,
      metalness: 0.2,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.15;
    base.name = 'base';
    base.castShadow = true;
    telescope.add(base);

    scene.add(telescope);
    telescopeRef.current = telescope;
  };

  useEffect(() => {
    if (!telescopeRef.current) return;
    telescopeRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const category = matchPartToColor(child.name);
        const newColor = applyColorToCategory(category, tubeColor, mountColor);
        child.material.color.set(newColor);
      }
    });
  }, [tubeColor, mountColor]);

  useEffect(() => {
    if (!telescopeRef.current) return;
    if (textMeshRef.current) {
      telescopeRef.current.remove(textMeshRef.current);
    }
    if (customText.length > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8f4e8';
        ctx.font = 'bold 48px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(customText, 256, 64);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.set(0, 2.5, 0);
        telescopeRef.current.add(sprite);
        textMeshRef.current = sprite;
      }
    }
  }, [customText]);

  const handleReset = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(5, 3, 8);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

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
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'grab',
            touchAction: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
          }}
        >
          <button onClick={handleReset} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px', color: '#f8f4e8', cursor: 'pointer' }}>
            Reset View
          </button>
          <div style={{ padding: '8px 16px', color: 'rgba(248, 244, 232, 0.7)', fontSize: '0.85rem' }}>
            Drag to rotate • Scroll to zoom
          </div>
        </div>
        {isLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#f8f4e8' }}>
            Loading telescope...
          </div>
        )}
      </div>

      <div style={{ background: 'linear-gradient(135deg, #fae5d0 0%, #f4dcc0 100%)', borderRadius: '20px', padding: '3rem 2rem', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.38)', position: 'relative', zIndex: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#28160b', textAlign: 'center', marginBottom: '2rem' }}>
          Customize Your M42 Dobsonian
        </h2>

        <section style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(80, 50, 25, 0.15)' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#28160b', marginBottom: '1rem' }}>
            <span>🔭</span> Tube Assembly Color
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
            {TUBE_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setTubeColor(color.hex)}
                style={{
                  aspectRatio: '1',
                  backgroundColor: color.hex,
                  border: tubeColor === color.hex ? '3px solid #2a7a4f' : '2px solid rgba(80, 50, 25, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                title={color.name}
              >
                {tubeColor === color.hex && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.5rem', color: 'white', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)' }}>✓</span>}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#3d2f24' }}>
            Selected: {TUBE_COLORS.find((c) => c.hex === tubeColor)?.name}
          </div>
        </section>

        <section style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(80, 50, 25, 0.15)' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#28160b', marginBottom: '1rem' }}>
            <span>🪵</span> Mount Finish
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
            {MOUNT_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setMountColor(color.hex)}
                style={{
                  aspectRatio: '1',
                  backgroundColor: color.hex,
                  border: mountColor === color.hex ? '3px solid #2a7a4f' : '2px solid rgba(80, 50, 25, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                title={color.name}
              >
                {mountColor === color.hex && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.5rem', color: 'white', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)' }}>✓</span>}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#3d2f24' }}>
            Selected: {MOUNT_COLORS.find((c) => c.hex === mountColor)?.name}
          </div>
        </section>

        <section style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(80, 50, 25, 0.15)' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#28160b', marginBottom: '1rem' }}>
            <span>✏️</span> Custom Engraving
          </h3>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value.slice(0, 20))}
            placeholder="Add your name or message"
            maxLength={20}
            style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(80, 50, 25, 0.2)', borderRadius: '12px', fontSize: '1rem', color: '#28160b', background: 'rgba(255, 250, 240, 0.9)' }}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#3d2f24', textAlign: 'right' }}>
            {customText.length} / 20 characters
          </div>
        </section>

        <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: '1px solid rgba(80, 50, 25, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span>Base price:</span>
            <span>₹{basePrice.toLocaleString()}</span>
          </div>
          {tubeColor !== TUBE_COLORS[0].hex && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#2a7a4f', fontSize: '0.9rem' }}>
              <span>Custom tube color:</span>
              <span>+₹2,000</span>
            </div>
          )}
          {customText.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#2a7a4f', fontSize: '0.9rem' }}>
              <span>Custom engraving:</span>
              <span>+₹1,500</span>
            </div>
          )}
          <div style={{ height: '1px', background: 'rgba(80, 50, 25, 0.15)', margin: '1rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
            <strong>Your Price:</strong>
            <strong>₹{totalPrice.toLocaleString()}</strong>
          </div>
        </div>

        <button style={{ width: '100%', marginTop: '2rem', padding: '18px 32px', background: 'linear-gradient(135deg, #2a7a4f 0%, #1d5a3d 100%)', border: '2px solid #2a7a4f', borderRadius: '12px', color: 'white', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
          Add to Cart - ₹{totalPrice.toLocaleString()}
        </button>
      </div>
    </div>
  );
};

export default TelescopeCustomizer;
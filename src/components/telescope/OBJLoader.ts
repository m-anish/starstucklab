// src/components/telescope/OBJLoader.ts
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

// Provide minimal ambient declarations for three/examples modules to satisfy TypeScript
declare module 'three/examples/jsm/loaders/OBJLoader' {
  import * as THREE from 'three';
  export class OBJLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);
    load(url: string, onLoad: (obj: THREE.Group) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
    setMaterials(materials: any): void;
  }
  export default OBJLoader;
}
declare module 'three/examples/jsm/loaders/MTLLoader' {
  import * as THREE from 'three';
  export class MTLLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);
    load(url: string, onLoad: (materials: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
  }
  export default MTLLoader;
}

export async function loadTelescopeOBJ(
  objPath: string,
  mtlPath?: string
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const objLoader = new OBJLoader();

    // If MTL file exists, load materials first
    if (mtlPath) {
      const mtlLoader = new MTLLoader();

      mtlLoader.load(
        mtlPath,
        (materials) => {
          materials.preload();
          objLoader.setMaterials(materials);
          loadOBJ(objLoader, objPath, resolve, reject);
        },
        (progress) => {
          console.log('Loading MTL:', ((progress.loaded / progress.total) * 100).toFixed(2) + '%');
        },
        (error) => {
          console.warn('MTL load failed, loading OBJ without materials:', error);
          loadOBJ(objLoader, objPath, resolve, reject);
        }
      );
    } else {
      loadOBJ(objLoader, objPath, resolve, reject);
    }
  });
}

function loadOBJ(
  loader: OBJLoader,
  path: string,
  resolve: (group: THREE.Group) => void,
  reject: (error: any) => void
) {
  loader.load(
    path,
    (object) => {
      console.log('Loaded OBJ with parts:', object.children.map((c) => c.name));

      // Center the model
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);

      // Apply default materials if none exist
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!child.material || Array.isArray(child.material)) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              metalness: 0.5,
              roughness: 0.5,
            });
          }
        }
      });

      resolve(object);
    },
    (progress) => {
      console.log('Loading OBJ:', ((progress.loaded / progress.total) * 100).toFixed(2) + '%');
    },
    (error) => {
      reject(error);
    }
  );
}
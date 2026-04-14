import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const muskModelPath = "assets/3d_models/Musk(1).glb";
const muskScale = 10;
const muskPosition = new THREE.Vector3(0, -1, -40);


// loading a large Musk model as a spectator beside the ring.
export function loadMuskSpectator(scene) {
    loader.load(muskModelPath, (gltf) => {
        const musk = gltf.scene;

        musk.scale.setScalar(muskScale);
        musk.position.copy(muskPosition);
        musk.updateMatrixWorld(true);

        musk.traverse((child) => {
            if (!child.isMesh) return;

            child.castShadow = true;
            child.receiveShadow = true;
        });

        scene.add(musk);
    });
}

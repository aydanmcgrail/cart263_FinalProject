import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const muskModelPath = "assets/3d_models/Musk(1).glb";
const muskScale = 18;
const muskPosition = new THREE.Vector3(0, -3, -40);
const zuckPath = "assets/3d_models/zucknormal.glb";
const zuckScale = 22;
const zuckPosition = new THREE.Vector3(0, -3, 40);
const zuckReptilePath = "assets/3d_models/zuckreptile.glb";
const zuckReptileScale = 50;

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

// loading a large zuck model as a spectator beside the ring.
export function loadZuckSpectator(scene) {
  loader.load(zuckPath, (gltf) => {
    const zuck = gltf.scene;

    zuck.scale.setScalar(zuckScale);
    zuck.position.copy(zuckPosition);
    zuck.rotation.y = Math.PI;
    zuck.updateMatrixWorld(true);

    zuck.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = true;
      child.receiveShadow = true;
    });

    scene.add(zuck);
  });
}

// loading two large signs with logo panel texture on opposite sides.
export function loadSigns(scene) {
  textureLoader.load("assets/images/logo panel.png", (texture) => {
    const aspect = texture.image.width / texture.image.height;
    const width = 60;
    const height = width / aspect;

    // Sign 1 on the right side
    const geometry1 = new THREE.PlaneGeometry(width, height);
    const material1 = new THREE.MeshLambertMaterial({ map: texture });
    const sign1 = new THREE.Mesh(geometry1, material1);
    sign1.position.set(35, 15, 0);
    sign1.rotation.y = -Math.PI / 2;
    sign1.castShadow = true;
    sign1.receiveShadow = true;
    scene.add(sign1);

    // Sign 2 on the left side
    const geometry2 = new THREE.PlaneGeometry(width, height);
    const material2 = new THREE.MeshLambertMaterial({ map: texture.clone() });
    const sign2 = new THREE.Mesh(geometry2, material2);
    sign2.position.set(-35, 15, 0);
    sign2.rotation.y = Math.PI / 2;
    sign2.castShadow = true;
    sign2.receiveShadow = true;
    scene.add(sign2);
  });
}

// loading zuckreptile model on top of the ring, looking down.
export function loadZuckReptile(scene) {
  loader.load(zuckReptilePath, (gltf) => {
    const zuckReptile = gltf.scene;

    zuckReptile.scale.setScalar(zuckReptileScale);
    zuckReptile.position.set(0, 50, -20);
    zuckReptile.rotation.x = Math.PI / 2; // look down
    zuckReptile.updateMatrixWorld(true);

    zuckReptile.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = true;
      child.receiveShadow = true;
    });

    scene.add(zuckReptile);
  });
}

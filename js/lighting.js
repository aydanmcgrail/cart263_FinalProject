// lights

import * as THREE from "three";

export function lightSetUp(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(0, 8, 4);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight2.position.set(0, 8, -4);
  directionalLight2.castShadow = true;
  scene.add(directionalLight2);

  const frontFillLight = new THREE.DirectionalLight(0xffffff, 1.8);
  frontFillLight.position.set(0, 3, 5);
  frontFillLight.target.position.set(0, 1.4, 0);
  scene.add(frontFillLight);
  scene.add(frontFillLight.target);

  const frontFillLight2 = new THREE.DirectionalLight(0xffffff, 1.8);
  frontFillLight2.position.set(0, 3, -5);
  frontFillLight2.target.position.set(0, 1.4, 0);
  scene.add(frontFillLight2);
  scene.add(frontFillLight2.target);

  const spotLight = new THREE.SpotLight(0xfff1c4, 45, 22, Math.PI * 0.18, 0.75);
  spotLight.position.set(0, 7, 3);
  spotLight.target.position.set(0, 1.2, 0);
  spotLight.castShadow = true;
  scene.add(spotLight);
  scene.add(spotLight.target);

  const spotLight2 = new THREE.SpotLight(
    0xfff1c4,
    45,
    22,
    Math.PI * 0.18,
    0.75,
  );
  spotLight2.position.set(0, 7, -3);
  spotLight2.target.position.set(0, 1.2, 0);
  spotLight2.castShadow = true;
  scene.add(spotLight2);
  scene.add(spotLight2.target);
}
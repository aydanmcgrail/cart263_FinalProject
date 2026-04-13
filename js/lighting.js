// lights

import * as THREE from "three";

export function lightSetUp(scene){

const ambientLight = new THREE.AmbientLight(0xffeedd, 0.25);
scene.add(ambientLight);

const skyLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
skyLight.position.set(0,15,0);
skyLight.castShadow = true;
scene.add(skyLight);

const leftWindowLight = new THREE.DirectionalLight(0xffcc88, 1.5);
leftWindowLight.position.set(-15,6,0);
leftWindowLight.target.position.set(0,0,0);
leftWindowLight.castShadow = true;
scene.add(leftWindowLight);
scene.add(leftWindowLight.target);

const rightWindowLight = new THREE.DirectionalLight(0xffcc88, 1.5);
rightWindowLight.position.set(15,6,0);
rightWindowLight.target.position.set(0,0,0);
rightWindowLight.castShadow = true;
scene.add(rightWindowLight);
scene.add(rightWindowLight.target);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
// directionalLight.position.set(0, 8, 4);
// directionalLight.castShadow = true;
// scene.add(directionalLight);

// const frontFillLight = new THREE.DirectionalLight(0xffffff, 1.8);
// frontFillLight.position.set(0, 3, 5);
// frontFillLight.target.position.set(0, 1.4, 0);
// scene.add(frontFillLight);
// scene.add(frontFillLight.target);

const spotLight = new THREE.SpotLight(0xfff1c4, 8, 22, Math.PI * 0.18, 0.75);
spotLight.position.set(0, 7, 3);
spotLight.target.position.set(0, 1.2, 0);
spotLight.castShadow = true;
scene.add(spotLight);
scene.add(spotLight.target);
}

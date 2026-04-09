import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// scene

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

// canvas

const canvas = document.querySelector("canvas#three-ex");

// sizes

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0 ,5, 12);
scene.add(camera);

// renderer

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});

renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;

//resizes the window properly
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});

// controls

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// lights

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('grey', 2);
directionalLight.position.set(0, 10, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

const spotLight = new THREE.SpotLight('yellow', 40, 20, Math.PI * 0.1, 0.8);
spotLight.position.set(0,10,0);
spotLight.castShadow = true;
scene.add(spotLight);
scene.add(spotLight.target);

// materials

const floorMaterial = new THREE.MeshStandardMaterial({
    color: 'beige'
});
floorMaterial.roughness = 0.9;

const groundMaterial = new THREE.MeshStandardMaterial({
    color: "maroon"
});
groundMaterial.roughness = 0.95;

const postMaterial = new THREE.MeshStandardMaterial({
    color: "blue"
});

const ropeMaterial = new THREE.MeshStandardMaterial({
    color: "red"
});

// floor

//ring floor
const floor = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.15, 8),
    floorMaterial
);
floor.receiveShadow = true;
scene.add(floor);

// floor of the room itself
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60,60),
    groundMaterial
);

ground.rotation.x = -Math.PI * 0.5;
ground.position.y = -0.68;
ground.receiveShadow = true;
scene.add(ground);

// corner posts

const postGeometry = new THREE.CylinderGeometry(0.07, 0.07, 2, 12);

const post1 = new THREE.Mesh(postGeometry, postMaterial);
    post1.position.set(-4, 1, -4);
    post1.castShadow = true;
    scene.add(post1);

const post2 = new THREE.Mesh(postGeometry, postMaterial);
    post2.position.set(4, 1, -4);
    post2.castShadow = true;
    scene.add(post2);

const post3 = new THREE.Mesh(postGeometry, postMaterial);
    post3.position.set(-4, 1, 4);
    post3.castShadow = true;
    scene.add(post3);

const post4 = new THREE.Mesh(postGeometry, postMaterial);
    post4.position.set(4, 1, 4);
    post4.castShadow = true;
    scene.add(post4);

// ropes

const ropeGeometry = new THREE.CylinderGeometry(0.025, 0.025, 8, 8);

// lower ropes
const ropeLowFront = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeLowFront.rotation.z = Math.PI / 2;
ropeLowFront.position.set(0, 0.6, -4);
scene.add(ropeLowFront);

const ropeLowBack = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeLowBack.rotation.z = Math.PI / 2;
ropeLowBack.position.set(0, 0.6, 4);
scene.add(ropeLowBack);

const ropeLowLeft = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeLowLeft.rotation.x = Math.PI / 2;
ropeLowLeft.position.set(-4, 0.6, 0);
scene.add(ropeLowLeft);

const ropeLowRight = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeLowRight.rotation.x = Math.PI / 2;
ropeLowRight.position.set(4, 0.6, 0);
scene.add(ropeLowRight);

//middle ropes
const ropeMiddleFront = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeMiddleFront.rotation.z = Math.PI / 2;
ropeMiddleFront.position.set(0, 1.2, -4);
scene.add(ropeMiddleFront);

const ropeMiddleBack = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeMiddleBack.rotation.z = Math.PI / 2;
ropeMiddleBack.position.set(0, 1.2, 4);
scene.add(ropeMiddleBack);

const ropeMiddleLeft = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeMiddleLeft.rotation.x = Math.PI / 2;
ropeMiddleLeft.position.set(-4, 1.2, 0);
scene.add(ropeMiddleLeft);

const ropeMiddleRight = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeMiddleRight.rotation.x = Math.PI / 2;
ropeMiddleRight.position.set(4, 1.2, 0);
scene.add(ropeMiddleRight);

// top ropes

const ropeTopFront = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeTopFront.rotation.z = Math.PI /2;
ropeTopFront.position.set(0, 1.8, -4);
scene.add(ropeTopFront);

const ropeTopBack = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeTopBack.rotation.z = Math.PI /2;
ropeTopBack.position.set(0, 1.8, 4);
scene.add(ropeTopBack);

const ropeTopLeft = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeTopLeft.rotation.x = Math.PI / 2;
ropeTopLeft.position.set(-4, 1.8, 0);
scene.add(ropeTopLeft);

const ropeTopRight = new THREE.Mesh(ropeGeometry, ropeMaterial);
ropeTopRight.rotation.x = Math.PI / 2;
ropeTopRight.position.set(4, 1.8, 0);
scene.add(ropeTopRight);

// animate

window.requestAnimationFrame(animate);

function animate(){
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);    
    }
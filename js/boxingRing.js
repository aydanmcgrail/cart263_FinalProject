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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('white', 1.5);
directionalLight.position.set(0, 10, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

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

// animate

window.requestAnimationFrame(animate);

function animate(){
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);    
    }
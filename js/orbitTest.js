import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'


const scene = new THREE.Scene()
const sizes = {
    width: 800,
    height: 600
}
const canvas = document.querySelector('canvas#three-ex')
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3;
scene.add(camera)

renderer.setSize(sizes.width, sizes.height)

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const mesh_2 = new THREE.Mesh(geometry, material)
scene.add(mesh_2)
mesh_2.position.x = -1.5

// ANIMATION SETUP
window.requestAnimationFrame(animate)


function animate() {
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate)
}

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
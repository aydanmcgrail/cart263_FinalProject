import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

///////////////////////////////////////scene setup////////////////////////////////////////
const scene = new THREE.Scene()
const sizes = {
    width: 800,
    height: 600
}

const canvas = document.querySelector('canvas#three-ex')
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3;
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
const controls = new OrbitControls(camera, canvas)

////////////////////////ambient light////////////////////////////////////////////////////////////////////////////////////////
const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)
ambientLight.color = new THREE.Color('#55c762')
ambientLight.intensity = .5;
//scene.add(ambientLight);

///////////////////direcion light/////////////////////////////////////////////////////////////////////////////////////////////
//const directionalLight = new THREE.DirectionalLight()
//scene.add(directionalLight);

//directionalLight.position.set(-5, 1, 0)


//////////////////////point light////////////////////////////////////////////////////////////////////////////////////////////
const pointLight = new THREE.PointLight(0xff9000, 1.5)
scene.add(pointLight)
console.log(pointLight.position) // default position is 0,0,0

pointLight.position.set(0, 1.5, 0) //set y 

//or
//pointLight.position.set(1,1,1) 

//set the intensity too
pointLight.intensity = 10

//The point light has a third parameter for distance. Its default value is 0, meaning that the distance is actually infinite.
pointLight.distance = 0
pointLight.decay = 2



////////////////////MATERIALS/////////////////////////////////////////////////////////////////////////////////////////////////
const material = new THREE.MeshStandardMaterial({})
//or
//const material = new THREE.MeshStandardMaterial({ map: water_texture })
material.roughness = 0.4
//supports lighting!

//NEW for casting shadows add a plane:)
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    material
)

scene.add(plane)
plane.rotation.x = - Math.PI * 0.5
plane.position.y = -.5;
plane.position.z = 1;
plane.position.x = -1;

const object1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    //new THREE.MeshBasicMaterial({ color: '#64bbd3' })
    material
)


const object2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    //new THREE.MeshBasicMaterial({ color: '#64bbd3' })
    material
)

const object3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    //new THREE.MeshBasicMaterial({ color: '#64bbd3' })
    material
)


scene.add(object1, object3, object2)
object3.position.x = -1.5
object1.position.x = 1.5
object1.position.y = 0.5
//////////////////////////////////////////////////////////////
window.requestAnimationFrame(animate);

function animate(timer) {
    controls.update();

    /*let x = directionalLight.position.x
    x += .02
    directionalLight.position.set(x, 5, 0)*/

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
}
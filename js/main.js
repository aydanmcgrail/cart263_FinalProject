// library ref: because we are loading a module
import * as THREE from 'three';

//SCENE//////////////////////////////////////////////////////
const scene = new THREE.Scene()
//console.log(scene);
const loader = new THREE.TextureLoader();
const water_texture = await loader.loadAsync('textures/Ice002_1K-JPG_Color.jpg');
//need to ensure that the textures are encoded correctly - mapping the colors correctly.
water_texture.colorSpace = THREE.SRGBColorSpace;

/////////////////////////////////////////////////////////////////////////////////
////////////////////////texture and material/////////////////////////////////
/*const material = new THREE.MeshBasicMaterial({
    map: water_texture
})
material.color = new THREE.Color('#ad86dd')
//or
material.color = new THREE.Color('rgb(0, 128, 255)')

material.map = water_texture
material.color = new THREE.Color('#f1b6fb')*/



//material.transparent = true
//material.opacity = 0.5
//////////////////////////////////////////////////////////////////////////
/*const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    material
)
sphere.position.x = - 1.5

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    material
)

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.3, 16, 32),
    material
)
torus.position.x = 1.5

scene.add(sphere, plane, torus)*/
///////////////////////////////////////////////////////////////////////////////
/*
//A: the geometry
const geometry = new THREE.BoxGeometry(1, 1, 1)
//B: the material
const material = new THREE.MeshBasicMaterial({ color: 0x800080 })
//C: put together
const mesh = new THREE.Mesh(geometry, material)
//D: ADD TO THE SCENE
scene.add(mesh)

mesh.scale.x = 1
mesh.scale.y = 0.75
mesh.scale.z = 1.75

mesh.rotation.x = Math.PI * 0.25
mesh.rotation.y = Math.PI * 0.25*/

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const mesh_2 = new THREE.Mesh(geometry, material)
scene.add(mesh_2)
mesh_2.position.x = -2

material.wireframe = true

//TURN ON AXES HELPER
//https://threejs.org/docs/?q=Axes#AxesHelper
const axesHelper = new THREE.AxesHelper(1)
scene.add(axesHelper)
//move it 
axesHelper.position.x = -1;
axesHelper.position.y = -1;

/*const mesh_2 = new THREE.Mesh(geometry, material)
scene.add(mesh_2)
mesh_2.position.x = 1.5
mesh_2.position.y = 1.25
mesh_2.position.z = -1*/


const sizes = {
    width: 800,
    height: 600
}
//Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
scene.add(camera)

//move camera
camera.position.z = 3
camera.position.x = -0.5

//camera.lookAt(mesh_2.position)


//Access the Canvas
const canvas = document.querySelector('canvas#three-ex')
//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
//give it the size
renderer.setSize(sizes.width, sizes.height)

//render:
//renderer.render(scene, camera)
let elapsedTime = 0  //
window.requestAnimationFrame(animate)
function animate(timer) {
    //calculate the difference since last frame
    let deltaTime = timer - elapsedTime
    elapsedTime = timer //update  new elapsedTime

    mesh.rotation.y += 0.001 * deltaTime
    mesh.rotation.z += 0.001

    // Update objects -> elapsed time increases ...
    mesh_2.position.x = Math.cos(elapsedTime / 1000)
    mesh_2.position.y = Math.sin(elapsedTime / 1000)


    //camera.position.x = Math.cos(elapsedTime / 1000)
    //camera.position.y = Math.sin(elapsedTime / 1000)

    renderer.render(scene, camera)
    window.requestAnimationFrame(animate)

}


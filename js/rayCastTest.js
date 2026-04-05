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

//////////////////////////////objects///////////////////////////

const object1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#d69b52' })
)
object1.position.x = -2

const object2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#aac658' })
)
object2.position.x = 2


const object3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#64bbd3' })
)

scene.add(object1, object2, object3)

//define the mouse 
let mouse = { x: 0, y: 0 }

//object1.updateMatrixWorld()
//object2.updateMatrixWorld()
//object3.updateMatrixWorld()

////////////////////raycaster////////////////////////////////

const raycaster = new THREE.Raycaster()

//ray will start somewhere on left of the spheres
const rayOrigin = new THREE.Vector3(- 3, 0, 0)
//right (positive x)
const rayDirection = new THREE.Vector3(10, 0, 0)  //reduce magnitude BUT keep direction
console.log(rayDirection.length())

//set direction only (has length ==1)
rayDirection.normalize()
console.log(rayDirection.length())

//raycaster.set(rayOrigin, rayDirection) //raycaster has been oriented

//cast a ray - check intersection with ONLY object 1
const intersect = raycaster.intersectObject(object1)
console.log(intersect)

//cast a ray - check intersection with obj1, obj2 and obj 3 
//const intersects = raycaster.intersectObjects([object1, object2, object3])
//console.log(intersects)


////////////////////////animate///////////////////////

window.requestAnimationFrame(animate);

function animate(timer) {
    controls.update();

    object1.position.y = Math.sin(timer / 1000 * .5) * 3
    object2.position.y = Math.sin(timer / 1000 * .4) * 3
    object3.position.y = Math.sin(timer / 1000 * .3) * 3

    raycaster.setFromCamera(mouse, camera);

    //add objects to collision
    const objectsToTest = [object1, object2, object3]

    for (const object of objectsToTest) {
        object.material.color.set('#ff0000')
    }

    //test collision
    const intersects = raycaster.intersectObjects(objectsToTest)

    for (const intersect of intersects) {
        intersect.object.material.color.set('#0000ff')
    }

    raycaster.setFromCamera(scene, camera);

    renderer.render(scene, camera);
    console.log(intersects)
    window.requestAnimationFrame(animate);
}

/*function animate(timer) {
    controls.update();

    raycaster.setFromCamera(mouse, camera);

    const objectsToTest = [object1, object2, object3];
    const intersects = raycaster.intersectObjects(objectsToTest);

    for (const object of objectsToTest) {
        object.material.color.set("#ff0000");
    }

    for (const intersect of intersects) {
        intersect.object.material.color.set("#0000ff");
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
}*/


window.addEventListener("mousemove", function (event) {
    mouse.x = (event.clientX / sizes.width) * 2 - 1; //map to between -1,1
    mouse.y = -(event.clientY / sizes.height) * 2 + 1; //map to between -1,1
    //console.log(mouse);
});


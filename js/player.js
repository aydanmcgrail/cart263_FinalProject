import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

let player;

// booleans for movement
const keyState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// base positions for the gloves, punch timing, and reach distance for the punch animation.
const baseLeftGlovePosition = new THREE.Vector3(-0.28, -0.32, -0.65);
const baseRightGlovePosition = new THREE.Vector3(0.28, -0.32, -0.65);
const punchDuration = 0.22;
const punchReach = 0.35;


// player properties, controls, and event listeners for movement and punching. Also includes functions to keep the player within the ring bounds and to update the punch animation.
export function setupPlayer(scene, camera, canvas, ringBounds) {
    const controls = new PointerLockControls(camera, canvas);

    player = {
        controls,
        camera,
        height: 1.65,
        radius: 0.35,
        speed: 3.2,
        health: 100,
        punchTimer: 0,
        punchSide: null,
        hitDuringPunch: false,
        leftGlove: createGlove(),
        rightGlove: createGlove()
    };

    // "first person" camera setup, positioning the camera at the player's height and adding the gloves as children of the camera so they move with it 
    camera.position.set(0, ringBounds.floorTopY + player.height, 2.4);

    player.leftGlove.position.copy(baseLeftGlovePosition);
    player.rightGlove.position.copy(baseRightGlovePosition);
    camera.add(player.leftGlove);
    camera.add(player.rightGlove);

    // event listener to lock pointer controls when canvas is clicked
    canvas.addEventListener("click", () => {
        controls.lock();
    });

    // event listeners for input controls
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
}

// tick for the plater movement, bounds, and punching 
export function updatePlayer(deltaTime, ringBounds) {
    if (!player) return;

    movePlayer(deltaTime);
    keepPlayerInsideRing(ringBounds);
    updatePunch(deltaTime);
}

// simple getter function to access the player object from other modules
export function getPlayer() {
    return player;
}

// creating the glove element for the player, simplem sphere for now
function createGlove() {
    const geometry = new THREE.SphereGeometry(0.14, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: "red",
        roughness: 0.55
    });

    return new THREE.Mesh(geometry, material);
}

// Exporting the location and side of the punch for collision detection
export function getPunch(){

    if (!player || !player.punchSide || player.hitDuringPunch) return null;
     
    // which glove is punching
    const glove = player.punchSide === "left" ? player.leftGlove : player.rightGlove;

    // locating the position of the punch in the scene/world
    const punchPoint = new THREE.Vector3();
    glove.getWorldPosition(punchPoint);

    // returning the punch information as an object, including which side the punch is on, the location of the punch, and a radius for collision detection
    return {
        side: player.punchSide,
        point: punchPoint,
        radius: 0.02
    }

}

export function notePunch() {
    player.hitDuringPunch = true;
}

// Movement controls, making the booleans turn true when keys are pressed
function handleKeyDown(event) {
    if (event.code === "KeyW") keyState.forward = true;
    if (event.code === "KeyS") keyState.backward = true;
    if (event.code === "KeyA") keyState.left = true;
    if (event.code === "KeyD") keyState.right = true;
}

// Making the booleans turn false when keys are released
function handleKeyUp(event) {
    if (event.code === "KeyW") keyState.forward = false;
    if (event.code === "KeyS") keyState.backward = false;
    if (event.code === "KeyA") keyState.left = false;
    if (event.code === "KeyD") keyState.right = false;
}

// Mouse event for punching, left and right respectively
function handleMouseDown(event) {
    if (!player || !player.controls.isLocked || player.punchSide) return;

    if (event.button === 0) {
        player.punchSide = "left";
        player.punchTimer = 0;
        player.hitDuringPunch = false;
    }

    if (event.button === 2) {
        player.punchSide = "right";
        player.punchTimer = 0;
        player.hitDuringPunch = false;
    }

}

// reading input and moving the player accordingly
function movePlayer(deltaTime) {
    if (!player.controls.isLocked) return;

    // Converting movement input into numbers which then dictate the direction
    const forwardAmount = Number(keyState.forward) - Number(keyState.backward);
    const rightAmount = Number(keyState.right) - Number(keyState.left);

    const direction = new THREE.Vector2(rightAmount, forwardAmount);

    // preventing faster diag movement 
    direction.normalize();

    player.controls.moveRight(direction.x * player.speed * deltaTime);
    player.controls.moveForward(direction.y * player.speed * deltaTime);
}

// keeping the player within the bounds of the ring
function keepPlayerInsideRing(ringBounds) {
    player.camera.position.x = THREE.MathUtils.clamp(
        player.camera.position.x,
        ringBounds.minX + player.radius,
        ringBounds.maxX - player.radius
    );

    player.camera.position.z = THREE.MathUtils.clamp(
        player.camera.position.z,
        ringBounds.minZ + player.radius,
        ringBounds.maxZ - player.radius
    );

    player.camera.position.y = ringBounds.floorTopY + player.height;
}

// glove and punnch handling and animation
function updatePunch(deltaTime) {
    player.leftGlove.position.copy(baseLeftGlovePosition);
    player.rightGlove.position.copy(baseRightGlovePosition);

    // if no punch is currently happening, exit the function
    if (!player.punchSide) return;

    // punch time is equal to time elapsed since previous frame, so that the punch consistently takes the same amount of time regardless of fps
    player.punchTimer += deltaTime;

    // how far into the punch the player is 
    const progress = Math.min(player.punchTimer / punchDuration, 1);
    // sine wave for smooth punch, based on the current position of the punch in progress
    const extension = Math.sin(progress * Math.PI) * punchReach;
    // which glove to move based on which punch is happening
    const glove = player.punchSide === "left" ? player.leftGlove : player.rightGlove;
    // moving the glove
    glove.position.z -= extension;
    // once the punch is complete, reset the punch 
    if (progress >= 1) {
        player.punchSide = null;
        player.punchTimer = 0;
    }
}

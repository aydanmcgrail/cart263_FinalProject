import * as THREE from "three";
import { loadOpponent, updateOpponent, getOpponent, damageOpponent, getOpponentPunch, noteOpponentPunch } from "./opponent.js";
import { setupPlayer, updatePlayer, getPunch, notePunch, getPlayer, damagePlayer } from "./player.js";
import { createRing, ringBounds } from "./ring.js";
import { lightSetUp } from "./lighting.js";
import { createStartScreen, createControlsMenu, showControlsHint, showLosingScreen } from "./ui.js";



// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
const clock = new THREE.Clock();
let gameStarted = false;
let gameOver = false;
const circusMusic = new Audio("assets/sounds/circus.mp3");
circusMusic.loop = true;
circusMusic.volume = 0.55;
const booSound = new Audio("assets/sounds/boo.mp3");
booSound.volume = 0.8;


// canvas
const canvas = document.querySelector("canvas#three-ex");

// sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 5, 12);
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

// create the ring
createRing(scene);



// function to check if the player's punch intersects with the opponent's hitbox, applying damage if a hit is detected and ensuring that only one hit can be registered per punch animation.
function checkPlayerPunch() {
    const opponent = getOpponent();
    const punch = getPunch();

    if (!punch || !opponent) return;

    // updating the opponent's world matrix to ensure the hitbox is in the correct position for collision detection
    const opponentBox = new THREE.Box3().setFromObject(opponent);
    opponentBox.expandByScalar(-0.5)
    // finding the closest point on the opponent's hitbox to the punch point
    const closestPoint = punch.point.clone().clamp(opponentBox.min, opponentBox.max)
    // calculating the distance from the punch point to the closest point on the opponent's hitbox
    const distance = closestPoint.distanceTo(punch.point);

    // applying damage if punch is in bounds, calling notePunch to prevent multiple hits from the same punch
    if (distance <= punch.radius) {
        damageOpponent(5);
        notePunch();
    }
}

// function to check if the opponent's punch intersects with the player's hitbox, applying damage and preventing one attack from hitting multiple times.
function checkOpponentPunch() {
    const player = getPlayer();
    const punch = getOpponentPunch();

    if (!player || !punch) return;

    // using the camera as the center of the player, then lowering it slightly so hits land around the upper body instead of only the eyes.
    const playerHitPoint = player.camera.position.clone();
    playerHitPoint.y -= 0.45;

    // calculating the distance between the opponent's punch sphere and the player's body sphere.
    const distance = playerHitPoint.distanceTo(punch.point);

    // applying damage if the two hit spheres overlap, calling noteOpponentPunch to prevent repeated damage from the same animation.
    if (distance <= punch.radius + player.radius) {
        damagePlayer(10);
        noteOpponentPunch();
    }
}

// importing opponent model and functions
loadOpponent(scene, ringBounds);

// importing player functions 
setupPlayer(scene, camera, canvas, ringBounds);
createControlsMenu();
createStartScreen(startGame);

// lighting
lightSetUp(scene);



// walls and ceiling

// const wallFront = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 0.5), wallMaterial);
// wallFront.position.set(0, 5, -20);
// scene.add(wallFront);

// const wallBack = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 0.5), wallMaterial);
// wallBack.position.set(0, 5, 20);
// scene.add(wallBack);

// const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 0.5), wallMaterial);
// wallLeft.position.set(-20, 5, 0);
// wallLeft.rotation.y = Math.PI / 2;
// scene.add(wallLeft);

// const wallRight = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 0.5), wallMaterial);
// wallRight.position.set(20, 5, 0);
// wallRight.rotation.y = Math.PI / 2;
// scene.add(wallRight);

// const ceiling = new THREE.Mesh(new THREE.BoxGeometry(40, 0.5, 40), wallMaterial);
// ceiling.position.set(0, 15, 0);
// scene.add(ceiling);

// animate

window.requestAnimationFrame(animate);

function animate() {

    const delta = clock.getDelta();

    if (gameStarted) {
        updatePlayer(delta, ringBounds);
        updateOpponent(delta, ringBounds);

        checkPlayerPunch();
        checkOpponentPunch();
        checkPlayerLoss();
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
}



// playing the looping circus music after the first user interaction.
function playCircusMusic() {
    circusMusic.currentTime = 0;
    circusMusic.play().catch(() => {
        // browser audio rules may block playback until a user gesture is accepted.
    });
}

// removing the menu overlay and locking pointer controls so gameplay begins immediately.
function startGame(startOverlay) {
    gameStarted = true;
    playCircusMusic();
    startOverlay.remove();
    showControlsHint();
    clock.getDelta();

    const player = getPlayer();

    if (player) {
        player.controls.lock();
    }
}

function checkPlayerLoss() {
    const player = getPlayer();

    if (!player || player.health > 0) return;

    if (gameOver) return;

    gameOver = true;
    gameStarted = false;

    circusMusic.pause();
    playBooSound();

    player.controls.unlock();
    showLosingScreen(() => {
        window.location.reload();
    });
}


function playBooSound() {
    booSound.currentTime = 0;
    booSound.play().catch(() => {
        // browser audio rules can still block playback in automated or unfocused contexts.
    });
}

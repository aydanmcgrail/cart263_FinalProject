import * as THREE from "three";
import { loadOpponent, updateOpponent } from "./opponent.js";
import { setupPlayer, updatePlayer, getPlayer } from "./player.js";
import { createRing, ringBounds } from "./ring.js";
import { lightSetUp } from "./lighting.js";
import { createStartScreen, createControlsMenu, showControlsHint, showLosingScreen } from "./ui.js";
import { playCircusMusic, stopCircusMusic, playBooSound } from "./audio.js";
import { checkPlayerPunch, checkOpponentPunch } from "./combat.js";


// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
const clock = new THREE.Clock();
let gameStarted = false;
let gameOver = false;


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



// importing opponent model and functions
loadOpponent(scene, ringBounds);

// importing player functions 
setupPlayer(scene, camera, canvas, ringBounds);
createControlsMenu();
createStartScreen(startGame);

// lighting
lightSetUp(scene);



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

    if (!player || player.health > 0 || gameOver) return;

    gameOver = true;
    gameStarted = false;

    stopCircusMusic();
    playBooSound();
    player.controls.unlock();

    showLosingScreen(() => {
        window.location.reload();
    });
}


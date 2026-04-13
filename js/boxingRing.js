import * as THREE from "three";
import { loadOpponent, updateOpponent, getOpponent, damageOpponent, getOpponentPunch, noteOpponentPunch } from "./opponent.js";
import { setupPlayer, updatePlayer, getPunch, notePunch, getPlayer, damagePlayer } from "./player.js";
import { createRing, ringBounds } from "./ring.js";




// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
const clock = new THREE.Clock();
let gameStarted = false;
let gameOver = false;
let controlsHint;
let controlsMenu;
let controlsMenuOpen = false;
let losingOverlay;
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
createStartScreen();
createControlsMenu();
window.addEventListener("keydown", handleGameMenuKeyDown);

// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(0, 8, 4);
directionalLight.castShadow = true;
scene.add(directionalLight);

const frontFillLight = new THREE.DirectionalLight(0xffffff, 1.8);
frontFillLight.position.set(0, 3, 5);
frontFillLight.target.position.set(0, 1.4, 0);
scene.add(frontFillLight);
scene.add(frontFillLight.target);

const spotLight = new THREE.SpotLight(0xfff1c4, 45, 22, Math.PI * 0.18, 0.75);
spotLight.position.set(0, 7, 3);
spotLight.target.position.set(0, 1.2, 0);
spotLight.castShadow = true;
scene.add(spotLight);
scene.add(spotLight.target);



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

// creating the opening UI flow that shows the title before starting the actual game.
function createStartScreen() {
    const startOverlay = document.createElement("div");
    startOverlay.id = "start-screen";
    startOverlay.style.position = "fixed";
    startOverlay.style.left = "0";
    startOverlay.style.top = "0";
    startOverlay.style.width = "100vw";
    startOverlay.style.height = "100vh";
    startOverlay.style.zIndex = "100";
    startOverlay.style.display = "flex";
    startOverlay.style.flexDirection = "column";
    startOverlay.style.alignItems = "center";
    startOverlay.style.justifyContent = "center";
    startOverlay.style.background = "rgba(5, 5, 12, 0.94)";
    startOverlay.style.color = "white";
    startOverlay.style.fontFamily = "Arial, sans-serif";
    startOverlay.style.cursor = "pointer";
    startOverlay.style.textAlign = "center";
    startOverlay.style.padding = "32px";
    startOverlay.style.boxSizing = "border-box";

    document.body.appendChild(startOverlay);
    showTitleScreen(startOverlay);

    // clicking the title screen starts the game.
    startOverlay.addEventListener("click", (event) => {
        event.stopPropagation();
        startGame(startOverlay);
    });
}

// showing the title page before the player sees the controls.
function showTitleScreen(startOverlay) {
    startOverlay.innerHTML = `
        <h1 style="font-size: 64px; margin: 0 0 18px; letter-spacing: 0; text-transform: uppercase;">Consume Or Die</h1>
        <p style="font-size: 20px; margin: 0;">Click to start</p>
    `;
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

// creating the in-game controls hint and menu, hidden until the game starts.
function createControlsMenu() {
    controlsHint = document.createElement("div");
    controlsHint.id = "controls-hint";
    controlsHint.textContent = "Press E for controls";
    controlsHint.style.position = "fixed";
    controlsHint.style.left = "18px";
    controlsHint.style.top = "18px";
    controlsHint.style.zIndex = "30";
    controlsHint.style.display = "none";
    controlsHint.style.padding = "8px 10px";
    controlsHint.style.background = "rgba(0, 0, 0, 0.55)";
    controlsHint.style.color = "white";
    controlsHint.style.fontFamily = "Arial, sans-serif";
    controlsHint.style.fontSize = "15px";
    controlsHint.style.fontWeight = "bold";
    controlsHint.style.pointerEvents = "none";

    controlsMenu = document.createElement("div");
    controlsMenu.id = "controls-menu";
    controlsMenu.innerHTML = `
        <h2 style="font-size: 22px; margin: 0 0 12px; letter-spacing: 0;">Controls</h2>
        <div><strong>W</strong> - Move forward</div>
        <div><strong>A</strong> - Move left</div>
        <div><strong>S</strong> - Move backward</div>
        <div><strong>D</strong> - Move right</div>
        <div><strong>Mouse</strong> - Look around</div>
        <div><strong>Left Click</strong> - Left punch</div>
        <div><strong>Right Click</strong> - Right punch</div>
        <div><strong>E</strong> - Close controls</div>
    `;
    controlsMenu.style.position = "fixed";
    controlsMenu.style.left = "18px";
    controlsMenu.style.top = "58px";
    controlsMenu.style.zIndex = "30";
    controlsMenu.style.display = "none";
    controlsMenu.style.padding = "14px 16px";
    controlsMenu.style.background = "rgba(0, 0, 0, 0.78)";
    controlsMenu.style.color = "white";
    controlsMenu.style.fontFamily = "Arial, sans-serif";
    controlsMenu.style.fontSize = "16px";
    controlsMenu.style.lineHeight = "1.7";
    controlsMenu.style.border = "2px solid rgba(255, 255, 255, 0.75)";
    controlsMenu.style.boxSizing = "border-box";
    controlsMenu.style.pointerEvents = "none";

    document.body.appendChild(controlsHint);
    document.body.appendChild(controlsMenu);
}

function showControlsHint() {
    if (!controlsHint) return;
    controlsHint.style.display = "block";
}

function handleGameMenuKeyDown(event) {
    if (!gameStarted || event.code !== "KeyE" || event.repeat) return;

    event.preventDefault();
    controlsMenuOpen = !controlsMenuOpen;
    controlsMenu.style.display = controlsMenuOpen ? "block" : "none";
    controlsHint.textContent = controlsMenuOpen ? "Press E to close controls" : "Press E for controls";
}

function checkPlayerLoss() {
    const player = getPlayer();

    if (!player || player.health > 0) return;

    showLosingScreen();
}

function showLosingScreen() {
    if (gameOver) return;

    gameOver = true;
    gameStarted = false;

    circusMusic.pause();
    playBooSound();
    hideControlsMenu();

    const player = getPlayer();

    if (player) {
        player.controls.unlock();
    }

    losingOverlay = document.createElement("div");
    losingOverlay.id = "losing-screen";
    losingOverlay.style.position = "fixed";
    losingOverlay.style.left = "0";
    losingOverlay.style.top = "0";
    losingOverlay.style.width = "100vw";
    losingOverlay.style.height = "100vh";
    losingOverlay.style.zIndex = "120";
    losingOverlay.style.display = "flex";
    losingOverlay.style.flexDirection = "column";
    losingOverlay.style.alignItems = "center";
    losingOverlay.style.justifyContent = "center";
    losingOverlay.style.background = "rgba(0, 0, 0, 0.86)";
    losingOverlay.style.color = "white";
    losingOverlay.style.fontFamily = "Arial, sans-serif";
    losingOverlay.style.textAlign = "center";
    losingOverlay.style.padding = "32px";
    losingOverlay.style.boxSizing = "border-box";

    const title = document.createElement("h1");
    title.textContent = "You Suck!";
    title.style.fontSize = "72px";
    title.style.margin = "0 0 28px";
    title.style.letterSpacing = "0";
    title.style.textTransform = "uppercase";

    const restartButton = document.createElement("button");
    restartButton.textContent = "Restart";
    restartButton.style.padding = "12px 24px";
    restartButton.style.fontSize = "22px";
    restartButton.style.fontWeight = "bold";
    restartButton.style.cursor = "pointer";
    restartButton.style.border = "2px solid white";
    restartButton.style.borderRadius = "6px";
    restartButton.style.background = "black";
    restartButton.style.color = "white";

    restartButton.addEventListener("click", () => {
        window.location.reload();
    });

    losingOverlay.appendChild(title);
    losingOverlay.appendChild(restartButton);
    document.body.appendChild(losingOverlay);
}

function playBooSound() {
    booSound.currentTime = 0;
    booSound.play().catch(() => {
        // browser audio rules can still block playback in automated or unfocused contexts.
    });
}

function hideControlsMenu() {
    if (controlsHint) {
        controlsHint.style.display = "none";
    }

    if (controlsMenu) {
        controlsMenu.style.display = "none";
    }

    controlsMenuOpen = false;
}

import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let player;
const gloveLoader = new GLTFLoader();
let gloveModelPromise;
let playerHealthBarFill;
let playerDamageFlashOverlay;
let playerDamageFlashTimeout;
let lowHealthImageOverlay;

// booleans for movement
const keyState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// punch timing and reach distance for the punch animation.
const punchDuration = 0.22;
const punchReach = 0.35;
const playerMaxHealth = 100;
const lowHealthThreshold = 50;
const lowHealthImagePaths = [
    "assets/images/blood2.png",
    "assets/images/blood.png"
];
const gloveModelPath = "assets/3d_models/GantboxeBras.glb";
const gloveModelScale = 0.26;
const gloveModelRotation = new THREE.Euler(0, Math.PI / 2, 0);
const gloveModelOffset = new THREE.Vector3(0, -0.02, 0);
const gloveHitPointOffset = new THREE.Vector3(0, 0.02, -0.34);


// player properties, controls, and event listeners for movement and punching. Also includes functions to keep the player within the ring bounds and to update the punch animation.
export function setupPlayer(scene, camera, canvas, ringBounds) {
    const controls = new PointerLockControls(camera, canvas);

    player = {
        controls,
        camera,
        height: 1.72,
        radius: 0.35,
        speed: 3.2,
        health: 100,
        punchTimer: 0,
        punchSide: null,
        hitDuringPunch: false,
        leftGlove: createGlove("left"),
        rightGlove: createGlove("right")
    };

    // "first person" camera setup, positioning the camera at the player's height and adding the gloves as children of the camera so they move with it 
    camera.position.set(0, ringBounds.floorTopY + player.height, 2.4);

    player.leftGlove.position.copy(getBaseGlovePosition("left"));
    player.rightGlove.position.copy(getBaseGlovePosition("right"));
    camera.add(player.leftGlove);
    camera.add(player.rightGlove);

    createPlayerHealthBar();
    createPlayerDamageFlash();
    createLowHealthImageOverlay();

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

// loading the arm and glove model once, then cloning it for each hand
function loadGloveModel() {
    if (!gloveModelPromise) {
        gloveModelPromise = new Promise((resolve, reject) => {
            gloveLoader.load(gloveModelPath, (gltf) => {
                resolve(gltf.scene);
            }, undefined, reject);
        });
    }

    return gloveModelPromise;
}

// creating the glove group for the player, with a hidden hit point at the knuckles
function createGlove(side) {
    const group = new THREE.Group();
    const hitPoint = new THREE.Object3D();

    group.scale.x = side === "left" ? -1 : 1;
    hitPoint.position.copy(gloveHitPointOffset);
    group.userData.hitPoint = hitPoint;
    group.add(hitPoint);

    loadGloveModel().then((sourceModel) => {
        const model = sourceModel.clone(true);

        model.scale.setScalar(gloveModelScale);
        model.rotation.copy(gloveModelRotation);
        model.position.copy(gloveModelOffset);

        model.traverse((child) => {
            if (!child.isMesh) return;

            child.castShadow = true;
            child.receiveShadow = true;

            if (Array.isArray(child.material)) {
                child.material = child.material.map((material) => prepareGloveMaterial(material));
            }
            else {
                child.material = prepareGloveMaterial(child.material);
            }
        });

        group.add(model);
    }).catch((error) => {
        console.error("Could not load player glove model:", error);
    });

    return group;
}

function prepareGloveMaterial(material) {
    const preparedMaterial = material.clone();
    preparedMaterial.side = THREE.DoubleSide;
    preparedMaterial.roughness = Math.max(preparedMaterial.roughness ?? 0.55, 0.55);

    return preparedMaterial;
}

function getBaseGlovePosition(side) {
    const aspect = player?.camera.aspect ?? window.innerWidth / window.innerHeight;
    const narrowAmount = THREE.MathUtils.clamp((1.15 - aspect) / 0.75, 0, 1);
    const xOffset = THREE.MathUtils.lerp(0.34, 0.18, narrowAmount);
    const yOffset = THREE.MathUtils.lerp(-0.5, -0.43, narrowAmount);
    const zOffset = THREE.MathUtils.lerp(-0.55, -0.72, narrowAmount);

    return new THREE.Vector3(side === "left" ? -xOffset : xOffset, yOffset, zOffset);
}

// Exporting the location and side of the punch for collision detection
export function getPunch() {

    if (!player || !player.punchSide || player.hitDuringPunch) return null;

    // which glove is punching
    const glove = player.punchSide === "left" ? player.leftGlove : player.rightGlove;

    // locating the position of the punch in the scene/world
    const punchPoint = new THREE.Vector3();
    const hitPoint = glove.userData.hitPoint ?? glove;
    hitPoint.getWorldPosition(punchPoint);

    // returning the punch information as an object, including which side the punch is on, the location of the punch, and a radius for collision detection
    return {
        side: player.punchSide,
        point: punchPoint,
        radius: 0.09
    }

}

// acknnowledging a punch has hit so that a single punch doesn't register multiple hits.
export function notePunch() {
    player.hitDuringPunch = true;
}

// function to apply damage to the player, making sure health does not go below zero.
export function damagePlayer(amount) {
    if (!player || player.health <= 0) return;

    player.health = Math.max(0, player.health - amount);
    updatePlayerHealthBar();
    startPlayerDamageFlash();
    console.log("Player Health:", player.health);
}

// creating the player's health UI in the bottom left corner of the viewport.
function createPlayerHealthBar() {
    const existingHealthBar = document.querySelector("#player-health-ui");

    if (existingHealthBar) {
        existingHealthBar.remove();
    }

    const healthContainer = document.createElement("div");
    healthContainer.id = "player-health-ui";
    healthContainer.style.position = "fixed";
    healthContainer.style.left = "24px";
    healthContainer.style.bottom = "24px";
    healthContainer.style.zIndex = "10";
    healthContainer.style.pointerEvents = "none";
    healthContainer.style.fontFamily = "Arial, sans-serif";

    // text label above the health bar so the player knows what the bar represents.
    const healthLabel = document.createElement("div");
    healthLabel.textContent = "HEALTH";
    healthLabel.style.color = "white";
    healthLabel.style.fontSize = "16px";
    healthLabel.style.fontWeight = "bold";
    healthLabel.style.marginBottom = "6px";
    healthLabel.style.textShadow = "0 2px 4px black";

    // black outer bar with a red background to show missing health.
    const healthBarBackground = document.createElement("div");
    healthBarBackground.style.width = "220px";
    healthBarBackground.style.height = "18px";
    healthBarBackground.style.background = "darkred";
    healthBarBackground.style.border = "2px solid white";
    healthBarBackground.style.boxSizing = "border-box";

    // green fill that shrinks as the player takes damage.
    playerHealthBarFill = document.createElement("div");
    playerHealthBarFill.style.width = "100%";
    playerHealthBarFill.style.height = "100%";
    playerHealthBarFill.style.background = "limegreen";
    playerHealthBarFill.style.transition = "width 0.15s linear, background 0.15s linear";

    healthBarBackground.appendChild(playerHealthBarFill);
    healthContainer.appendChild(healthLabel);
    healthContainer.appendChild(healthBarBackground);
    document.body.appendChild(healthContainer);

    updatePlayerHealthBar();
}

// updating the player's health bar width and color based on current health.
function updatePlayerHealthBar() {
    if (!player || !playerHealthBarFill) return;

    const healthPercent = THREE.MathUtils.clamp(player.health / playerMaxHealth, 0, 1);

    playerHealthBarFill.style.width = `${healthPercent * 100}%`;

    if (healthPercent > 0.5) {
        playerHealthBarFill.style.background = "limegreen";
    }
    else if (healthPercent > 0.25) {
        playerHealthBarFill.style.background = "yellow";
    }
    else {
        playerHealthBarFill.style.background = "red";
    }

    updateLowHealthImageOverlay();
}

// creating a full-screen red overlay that flashes when the player takes damage.
function createPlayerDamageFlash() {
    const existingDamageFlash = document.querySelector("#player-damage-flash");

    if (existingDamageFlash) {
        existingDamageFlash.remove();
    }

    playerDamageFlashOverlay = document.createElement("div");
    playerDamageFlashOverlay.id = "player-damage-flash";
    playerDamageFlashOverlay.style.position = "fixed";
    playerDamageFlashOverlay.style.left = "0";
    playerDamageFlashOverlay.style.top = "0";
    playerDamageFlashOverlay.style.width = "100vw";
    playerDamageFlashOverlay.style.height = "100vh";
    playerDamageFlashOverlay.style.zIndex = "20";
    playerDamageFlashOverlay.style.pointerEvents = "none";
    playerDamageFlashOverlay.style.background = "rgba(255, 0, 0, 0.2)";
    playerDamageFlashOverlay.style.opacity = "0";
    playerDamageFlashOverlay.style.transition = "opacity 0.2s linear";

    document.body.appendChild(playerDamageFlashOverlay);
}

// briefly showing the red overlay, then fading it back out after the player is damaged.
function startPlayerDamageFlash() {
    if (!playerDamageFlashOverlay) return;

    if (playerDamageFlashTimeout) {
        clearTimeout(playerDamageFlashTimeout);
    }

    // resetting the transition lets repeated hits restart the flash immediately.
    playerDamageFlashOverlay.style.transition = "none";
    playerDamageFlashOverlay.style.opacity = "1";

    window.requestAnimationFrame(() => {
        playerDamageFlashOverlay.style.transition = "opacity 0.2s linear";
        playerDamageFlashOverlay.style.opacity = "0";
    });

    playerDamageFlashTimeout = setTimeout(() => {
        playerDamageFlashOverlay.style.opacity = "0";
    }, 220);
}

// creating the low health screen overlay using both blood splatter PNGs.
function createLowHealthImageOverlay() {
    const existingLowHealthOverlay = document.querySelector("#low-health-image-overlay");

    if (existingLowHealthOverlay) {
        existingLowHealthOverlay.remove();
    }

    lowHealthImageOverlay = document.createElement("div");
    lowHealthImageOverlay.id = "low-health-image-overlay";
    lowHealthImageOverlay.style.position = "fixed";
    lowHealthImageOverlay.style.left = "0";
    lowHealthImageOverlay.style.top = "0";
    lowHealthImageOverlay.style.width = "100vw";
    lowHealthImageOverlay.style.height = "100vh";
    lowHealthImageOverlay.style.zIndex = "15";
    lowHealthImageOverlay.style.pointerEvents = "none";
    lowHealthImageOverlay.style.opacity = "0";
    lowHealthImageOverlay.style.transition = "opacity 0.2s linear";

    lowHealthImagePaths.forEach((imagePath, index) => {
        const image = document.createElement("img");
        image.src = imagePath;
        image.alt = "";
        image.draggable = false;
        image.style.position = "absolute";
        image.style.width = "56vw";
        image.style.maxWidth = "720px";
        image.style.height = "auto";
        image.style.userSelect = "none";

        // placing the two images on opposite sides so they frame the viewport instead of covering only one spot.
        if (index === 0) {
            image.style.left = "-6vw";
            image.style.top = "-4vh";
        }
        else {
            image.style.right = "-5vw";
            image.style.bottom = "-6vh";
        }

        lowHealthImageOverlay.appendChild(image);
    });

    document.body.appendChild(lowHealthImageOverlay);
    updateLowHealthImageOverlay();
}

// showing the image overlay only when the player has 50 health or lower.
function updateLowHealthImageOverlay() {
    if (!player || !lowHealthImageOverlay) return;

    lowHealthImageOverlay.style.opacity = player.health <= lowHealthThreshold ? "1" : "0";
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
    player.leftGlove.position.copy(getBaseGlovePosition("left"));
    player.rightGlove.position.copy(getBaseGlovePosition("right"));

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

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getPlayer } from "./player.js";

let opponent;
let mixer;
let actions = {};
let currentAttack;
let currentAttackTimer = 0;
let currentAttackDuration = 0;
let attackIndex = 0;
let attackTimer = 0;
let hitDuringAttack = false;
let opponentHealth = 100;
let speechTimer = 0;
let healthBar;
let healthBarFill;
let damageFlashTimer = 0;
let damageFlashMaterials = [];

const loader = new GLTFLoader();
const opponentMaxHealth = 100;
const attackNames = ["double_punch", "left_punch", "right_punch"];
const opponentSpeed = 1.25;
const attackRange = 1.35;
const attackDelay = 0.35;
const punchActiveStart = 0.28;
const punchActiveEnd = 0.68;
const punchForwardDistance = 0.9;
const punchHeightOffset = 1.2;
const punchRadius = 0.25;
const modelFacingOffset = 0;
const healthBarWidth = 1.1;
const healthBarHeight = 0.12;
const healthBarYOffset = 0.35;
const damageFlashDuration = 0.2;
const damageFlashStrength = 0.3;
const speechDelayMin = 5;
const speechDelayMax = 12;
const opponentHitSound = new Audio("assets/sounds/ouch.mp3");
opponentHitSound.volume = 0.6;
const opponentSpeechSound = new Audio("assets/sounds/speech.wav");
opponentSpeechSound.volume = 0.65;


// Loading the GLB file for the opponent model and setting up the animations.

export function loadOpponent(scene, ringBounds) {
    loader.load('assets/3d_models/boxer_model_final.glb', (gltf) => {
        opponent = gltf.scene;

        opponent.scale.setScalar(0.25);
        prepareDamageFlashMaterials();
        opponent.updateMatrixWorld(true);

        const modelBox = new THREE.Box3().setFromObject(opponent);
        opponent.position.y = ringBounds.floorTopY - modelBox.min.y;

        scene.add(opponent);
        createHealthBar(scene);

        mixer = new THREE.AnimationMixer(opponent);

        gltf.animations.forEach((clip) => {
            actions[clip.name] = mixer.clipAction(clip);
        });

        speechTimer = getRandomSpeechDelay();
    });
}

//updating the animations, AI movement, attacks, and preventing out of bounds 

export function updateOpponent(deltaTime, ringBounds) {
    if (mixer) {
        mixer.update(deltaTime);
    }

    if (currentAttack) {
        currentAttackTimer += deltaTime;
    }

    updateOpponentAI(deltaTime);
    keepOpponentInsideRing(ringBounds);
    updateOpponentSpeech(deltaTime);
    updateDamageFlash(deltaTime);
    updateHealthBar();
}

export function getOpponent() {
    return opponent;
}

// function to apply damage to the opponent, ensuring health does not drop below 0 and logging the current health to the console.
export function damageOpponent(amount) {
    if (opponentHealth <= 0) return;

    opponentHealth = Math.max(0, opponentHealth - amount);
    console.log("Opponent Health;", opponentHealth)

    playOpponentHitSound();
    startDamageFlash();
}

// exporting the current opponent punch position so boxingRing.js can test it against the player.
export function getOpponentPunch() {
    if (!opponent || !currentAttack || hitDuringAttack || currentAttackDuration <= 0) return null;

    // only counting the punch during the middle of the animation so windup and recovery do not damage the player.
    const attackProgress = currentAttackTimer / currentAttackDuration;
    if (attackProgress < punchActiveStart || attackProgress > punchActiveEnd) return null;

    const player = getPlayer();
    if (!player) return null;

    // finding the flat direction toward the player so the hit sphere appears in front of the opponent.
    const directionToPlayer = new THREE.Vector3(
        player.camera.position.x - opponent.position.x,
        0,
        player.camera.position.z - opponent.position.z
    );

    if (directionToPlayer.length() <= 0.001) return null;

    directionToPlayer.normalize();

    // using the opponent's current hitbox to keep the punch height stable even while animations shift the model origin.
    opponent.updateMatrixWorld(true);
    const opponentBox = new THREE.Box3().setFromObject(opponent);

    // placing an invisible hit sphere around where the opponent's glove reaches during a punch.
    const punchPoint = opponent.position.clone();
    punchPoint.add(directionToPlayer.multiplyScalar(punchForwardDistance));
    punchPoint.y = opponentBox.min.y + punchHeightOffset;

    return {
        point: punchPoint,
        radius: punchRadius
    };
}

// Acknowledging a punch has hit so that one opponent attack cannot damage the player multiple times.
export function noteOpponentPunch() {
    hitDuringAttack = true;
}

// playing a sound effect when opponent takes damage
function playOpponentHitSound() {
    opponentHitSound.currentTime = 0;
    opponentHitSound.play().catch(() => {
        // prevents browser autoplay rules from creating errors before the player interacts with the page.
    });
}

// choosing a random delay so the opponent speech does not happen at a predictable rhythm.
function getRandomSpeechDelay() {
    return THREE.MathUtils.randFloat(speechDelayMin, speechDelayMax);
}

// updating the opponent speech timer and playing the speech sound whenever the random delay runs out.
function updateOpponentSpeech(deltaTime) {
    if (!opponent || opponentHealth <= 0) return;

    speechTimer -= deltaTime;

    if (speechTimer > 0) return;

    playOpponentSpeech();
    speechTimer = getRandomSpeechDelay();
}

// playing the opponent speech sound, restarting it only if it is not already playing.
function playOpponentSpeech() {
    if (!opponentSpeechSound.paused) return;

    opponentSpeechSound.currentTime = 0;
    opponentSpeechSound.play().catch(() => {
        // prevents browser autoplay rules from creating errors before the player interacts with the page.
    });
}

// storing the opponent's original material colors so the flash can tint it without changing opacity.
function prepareDamageFlashMaterials() {
    damageFlashMaterials = [];

    opponent.traverse((child) => {
        if (!child.isMesh || !child.material) return;

        if (Array.isArray(child.material)) {
            child.material = child.material.map((material) => cloneDamageFlashMaterial(material));
        }
        else {
            child.material = cloneDamageFlashMaterial(child.material);
        }
    });
}

// cloning a material and saving the values that get restored after the red flash.
function cloneDamageFlashMaterial(material) {
    const clonedMaterial = material.clone();

    damageFlashMaterials.push({
        material: clonedMaterial,
        color: clonedMaterial.color ? clonedMaterial.color.clone() : null,
        emissive: clonedMaterial.emissive ? clonedMaterial.emissive.clone() : null,
        emissiveIntensity: clonedMaterial.emissiveIntensity,
        opacity: clonedMaterial.opacity,
        transparent: clonedMaterial.transparent
    });

    return clonedMaterial;
}

// starting the red damage flash when the opponent is hit.
function startDamageFlash() {
    damageFlashTimer = damageFlashDuration;
    setDamageFlashMaterials();
}

// updating the flash timer every frame and restoring materials when the flash is done.
function updateDamageFlash(deltaTime) {
    if (damageFlashTimer <= 0) return;

    damageFlashTimer -= deltaTime;

    if (damageFlashTimer <= 0) {
        restoreDamageFlashMaterials();
    }
}

// tinting the existing opaque materials red without changing their transparency.
function setDamageFlashMaterials() {
    damageFlashMaterials.forEach((entry) => {
        if (entry.color && entry.material.color) {
            entry.material.color.copy(entry.color).lerp(new THREE.Color("red"), damageFlashStrength);
        }

        if (entry.emissive && entry.material.emissive) {
            entry.material.emissive.copy(entry.emissive).lerp(new THREE.Color("red"), damageFlashStrength);
            entry.material.emissiveIntensity = Math.max(entry.emissiveIntensity ?? 1, 1);
        }

        // keeping the original opacity settings untouched so the opponent mesh never becomes transparent.
        entry.material.opacity = entry.opacity;
        entry.material.transparent = entry.transparent;
    });
}

// restoring the original material colors after the flash.
function restoreDamageFlashMaterials() {
    damageFlashMaterials.forEach((entry) => {
        if (entry.color && entry.material.color) {
            entry.material.color.copy(entry.color);
        }

        if (entry.emissive && entry.material.emissive) {
            entry.material.emissive.copy(entry.emissive);
            entry.material.emissiveIntensity = entry.emissiveIntensity;
        }

        entry.material.opacity = entry.opacity;
        entry.material.transparent = entry.transparent;
    });
}

// keeping the opponent inside the ring by checking hitbox bounds
function keepOpponentInsideRing(ringBounds) {
    if (!opponent) return;

    opponent.updateMatrixWorld(true);

    const opponentBox = new THREE.Box3().setFromObject(opponent);

    if (opponentBox.min.x < ringBounds.minX) {
        opponent.position.x += ringBounds.minX - opponentBox.min.x;
    }

    if (opponentBox.max.x > ringBounds.maxX) {
        opponent.position.x -= opponentBox.max.x - ringBounds.maxX;
    }

    if (opponentBox.min.z < ringBounds.minZ) {
        opponent.position.z += ringBounds.minZ - opponentBox.min.z;
    }

    if (opponentBox.max.z > ringBounds.maxZ) {
        opponent.position.z -= opponentBox.max.z - ringBounds.maxZ;
    }

    opponent.updateMatrixWorld(true);

    const correctedBox = new THREE.Box3().setFromObject(opponent);
    opponent.position.y += ringBounds.floorTopY - correctedBox.min.y;
}

// Creating a small 3D health bar that will float above the opponent instead of being fixed to the screen.
function createHealthBar(scene) {
    healthBar = new THREE.Group();

    const backgroundMaterial = new THREE.MeshBasicMaterial({
        color: "black",
        side: THREE.DoubleSide
    });

    const missingHealthMaterial = new THREE.MeshBasicMaterial({
        color: "darkred",
        side: THREE.DoubleSide
    });

    const fillMaterial = new THREE.MeshBasicMaterial({
        color: "limegreen",
        side: THREE.DoubleSide
    });

    // black background is slightly larger so it works like a border around the health bar.
    const background = new THREE.Mesh(
        new THREE.PlaneGeometry(healthBarWidth + 0.08, healthBarHeight + 0.08),
        backgroundMaterial
    );

    // red bar sits behind the green fill so missing health is visible as the opponent takes damage.
    const missingHealth = new THREE.Mesh(
        new THREE.PlaneGeometry(healthBarWidth, healthBarHeight),
        missingHealthMaterial
    );
    missingHealth.position.z = 0.001;

    // green fill is scaled from left to right based on the opponent's current health.
    healthBarFill = new THREE.Mesh(
        new THREE.PlaneGeometry(healthBarWidth, healthBarHeight),
        fillMaterial
    );
    healthBarFill.position.z = 0.002;

    healthBar.add(background);
    healthBar.add(missingHealth);
    healthBar.add(healthBarFill);
    scene.add(healthBar);

    updateHealthBar();
}

// Updating the health bar position, size, and rotation so it stays above the opponent and faces the player's camera.
function updateHealthBar() {
    if (!opponent || !healthBar || !healthBarFill) return;

    opponent.updateMatrixWorld(true);
    const opponentBox = new THREE.Box3().setFromObject(opponent);
    const opponentCenter = opponentBox.getCenter(new THREE.Vector3());

    // placing the health bar above the opponent's current animated hitbox.
    healthBar.position.set(
        opponentCenter.x,
        opponentBox.max.y + healthBarYOffset,
        opponentCenter.z
    );

    const player = getPlayer();

    // copying the camera rotation makes the bar behave like a billboard that always faces the player.
    if (player) {
        healthBar.quaternion.copy(player.camera.quaternion);
    }

    const healthPercent = THREE.MathUtils.clamp(opponentHealth / opponentMaxHealth, 0, 1);

    // scaling and shifting the green fill keeps the left edge anchored while the right side shrinks.
    healthBarFill.scale.x = healthPercent;
    healthBarFill.position.x = (healthPercent - 1) * healthBarWidth * 0.5;

    // changing color gives a quick read on low health without needing text.
    if (healthPercent > 0.5) {
        healthBarFill.material.color.set("limegreen");
    }
    else if (healthPercent > 0.25) {
        healthBarFill.material.color.set("yellow");
    }
    else {
        healthBarFill.material.color.set("red");
    }
}

// AI function to make the opponent face the player, move toward them, and attack when close enough.
function updateOpponentAI(deltaTime) {
    if (!opponent) return;

    const player = getPlayer();
    if (!player) return;

    if (attackTimer > 0) {
        attackTimer -= deltaTime;
    }

    // Calculating the flat direction from the opponent to the player so the opponent does not tilt up or down.
    const playerPosition = player.camera.position;
    const directionToPlayer = new THREE.Vector3(
        playerPosition.x - opponent.position.x,
        0,
        playerPosition.z - opponent.position.z
    );

    const distanceToPlayer = directionToPlayer.length();

    if (distanceToPlayer <= 0.001) return;

    directionToPlayer.normalize();

    // Making the opponent always turn toward the player. The model offset keeps the imported boxer facing forward.
    opponent.lookAt(
        playerPosition.x,
        opponent.position.y,
        playerPosition.z
    );
    opponent.rotateY(modelFacingOffset);

    // Moving toward the player until the opponent is close enough to punch.
    if (distanceToPlayer > attackRange) {
        opponent.position.x += directionToPlayer.x * opponentSpeed * deltaTime;
        opponent.position.z += directionToPlayer.z * opponentSpeed * deltaTime;
        return;
    }

    // Cycling through the three punch animations when the opponent is in attack range.
    if (attackTimer <= 0) {
        playNextAttack();
    }
}

// Plays the next attack in the list, then advances the index so the next punch is different.
function playNextAttack() {
    const attackName = attackNames[attackIndex];
    const nextAttack = actions[attackName];

    if (!nextAttack) {
        console.warn("Missing opponent animation:", attackName);
        attackIndex = (attackIndex + 1) % attackNames.length;
        attackTimer = attackDelay;
        return;
    }

    if (currentAttack) {
        currentAttack.fadeOut(0.1);
    }

    nextAttack.reset();
    nextAttack.setLoop(THREE.LoopOnce, 1);
    nextAttack.clampWhenFinished = true;
    nextAttack.fadeIn(0.1);
    nextAttack.play();

    currentAttack = nextAttack;
    currentAttackTimer = 0;
    currentAttackDuration = nextAttack.getClip().duration;
    hitDuringAttack = false;
    attackIndex = (attackIndex + 1) % attackNames.length;
    attackTimer = currentAttackDuration + attackDelay;
}

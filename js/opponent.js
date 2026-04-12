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

const loader = new GLTFLoader();
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

// Loading the GLB file for the opponent model and setting up the animations.

export function loadOpponent(scene, ringBounds) {
    loader.load('assets/3d_models/boxer_model_final.glb', (gltf) => {
        opponent = gltf.scene;

        opponent.scale.setScalar(0.25);
        opponent.updateMatrixWorld(true);

        const modelBox = new THREE.Box3().setFromObject(opponent);
        opponent.position.y = ringBounds.floorTopY - modelBox.min.y;

        scene.add(opponent);

        mixer = new THREE.AnimationMixer(opponent);

        gltf.animations.forEach((clip) => {
            actions[clip.name] = mixer.clipAction(clip);
        });
    });
}

//Updating the animations, AI movement, attacks, and preventing out of bounds 

export function updateOpponent(deltaTime, ringBounds) {
    if (mixer) {
        mixer.update(deltaTime);
    }

    if (currentAttack) {
        currentAttackTimer += deltaTime;
    }

    updateOpponentAI(deltaTime);
    keepOpponentInsideRing(ringBounds);
}

export function getOpponent() {
    return opponent;
}

// function to apply damage to the opponent, ensuring health does not drop below 0 and logging the current health to the console.
export function damageOpponent(amount) {
    if (opponentHealth <= 0) return;

    opponentHealth = Math.max(0, opponentHealth - amount);
    console.log("Opponent Health;", opponentHealth)
}

// Exporting the current opponent punch position so boxingRing.js can test it against the player.
export function getOpponentPunch() {
    if (!opponent || !currentAttack || hitDuringAttack || currentAttackDuration <= 0) return null;

    // Only counting the punch during the middle of the animation so windup and recovery do not damage the player.
    const attackProgress = currentAttackTimer / currentAttackDuration;
    if (attackProgress < punchActiveStart || attackProgress > punchActiveEnd) return null;

    const player = getPlayer();
    if (!player) return null;

    // Finding the flat direction toward the player so the hit sphere appears in front of the opponent.
    const directionToPlayer = new THREE.Vector3(
        player.camera.position.x - opponent.position.x,
        0,
        player.camera.position.z - opponent.position.z
    );

    if (directionToPlayer.length() <= 0.001) return null;

    directionToPlayer.normalize();

    // Using the opponent's current hitbox to keep the punch height stable even while animations shift the model origin.
    opponent.updateMatrixWorld(true);
    const opponentBox = new THREE.Box3().setFromObject(opponent);

    // Placing an invisible hit sphere around where the opponent's glove reaches during a punch.
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

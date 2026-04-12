import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getPlayer } from "./player.js";

let opponent;
let mixer;
let actions = {};
let currentAttack;
let attackIndex = 0;
let attackTimer = 0;
let opponentHealth = 100;

const loader = new GLTFLoader();
const attackNames = ["double_punch", "left_punch", "right_punch"];
const opponentSpeed = 1.25;
const attackRange = 1.35;
const attackDelay = 0.35;
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
    attackIndex = (attackIndex + 1) % attackNames.length;
    attackTimer = nextAttack.getClip().duration + attackDelay;
}

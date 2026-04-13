import * as THREE from "three";
import { getOpponent, damageOpponent, getOpponentPunch, noteOpponentPunch } from "./opponent.js";
import { getPunch, notePunch, getPlayer, damagePlayer } from "./player.js";


export function updateCombat() {
    checkPlayerPunch();
    checkOpponentPunch();
}

// function to check if the player's punch intersects with the opponent's hitbox, applying damage if a hit is detected and ensuring that only one hit can be registered per punch animation.
export function checkPlayerPunch() {
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
export function checkOpponentPunch() {
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

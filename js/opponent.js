import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let opponent;
let mixer;
let actions = {};

const loader = new GLTFLoader();

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

        actions['right_punch'].play();
    });
}

export function updateOpponent(deltaTime, ringBounds) {
    if (mixer) {
        mixer.update(deltaTime);
    }

    keepOpponentInsideRing(ringBounds);
}

export function getOpponent() {
    return opponent;
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

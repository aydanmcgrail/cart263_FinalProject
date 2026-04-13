
const booSound = new Audio("assets/sounds/boo.mp3");
booSound.volume = 0.8;
const circusMusic = new Audio("assets/sounds/circus.mp3");
circusMusic.loop = true;
circusMusic.volume = 0.55;

 // playing the looping circus music after the first user interaction.
export function playCircusMusic() {
    circusMusic.currentTime = 0;
    circusMusic.play().catch(() => {
        // browser audio rules may block playback until a user gesture is accepted.
    });
}

export function stopCircusMusic() {
    circusMusic.pause();
}

// boo sound when player loses
export function playBooSound() {
    booSound.currentTime = 0;
    booSound.play().catch(() => {
        // browser audio rules can still block playback in automated or unfocused contexts.
    });
}

let controlsHint;
let controlsMenu;
let controlsMenuOpen = false;
let losingOverlay;

// creating the opening UI flow that shows the title before starting the actual game.
export function createStartScreen(onStart) {

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
        onStart(startOverlay);
    });
}

// showing the title page before the player sees the controls.
export function showTitleScreen(startOverlay) {
    startOverlay.innerHTML = `
        <h1 style="font-size: 64px; margin: 0 0 18px; letter-spacing: 0; text-transform: uppercase;">Consume Or Die</h1>
        <p style="font-size: 20px; margin: 0;">Click to start</p>
    `;
}

// creating the in-game controls hint and menu, hidden until the game starts.
export function createControlsMenu() {
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

    window.addEventListener("keydown", handleGameMenuKeyDown);
}

// showing menu
export function showControlsHint() {
    if (!controlsHint) return;
    controlsHint.style.display = "block";
}

// Losing screen that appears when player runs out of health
export function showLosingScreen(onRestart) {
    if (losingOverlay) return;

    hideControlsMenu();

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
        onRestart();
    });

    losingOverlay.appendChild(title);
    losingOverlay.appendChild(restartButton);
    document.body.appendChild(losingOverlay);
}

// hiding the controls menu
export function hideControlsMenu() {
    if (controlsHint) {
        controlsHint.style.display = "none";
    }

    if (controlsMenu) {
        controlsMenu.style.display = "none";
    }

    controlsMenuOpen = false;
}



function handleGameMenuKeyDown(event) {
    if (!controlsHint || controlsHint.style.display === "none" || event.code !== "KeyE" || event.repeat) return;

    event.preventDefault();
    controlsMenuOpen = !controlsMenuOpen;
    controlsMenu.style.display = controlsMenuOpen ? "block" : "none";
    controlsHint.textContent = controlsMenuOpen ? "Press E to close controls" : "Press E for controls";
}

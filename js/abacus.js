const rods = 13;
const rodLeft = [11.1, 17.6, 24.0, 30.5, 37.0, 43.5, 50.0, 56.5, 63.0, 69.5, 76.0, 82.5, 88.9];
const upperHome = [18.5, 26.7];
const upperActive = [30.2, 36.2];
const lowerActive = [43.5, 49.6, 55.7, 61.8, 67.9];
const lowerHome = [52.7, 60.8, 68.9, 77.0, 85.1];

const beadLayer = document.getElementById("abacusBeads");
const valueOutput = document.getElementById("abacusValue");
const placeText = document.getElementById("placeText");
const resetButton = document.getElementById("resetAbacus");

const state = Array.from({ length: rods }, () => ({
    upper: 0,
    lower: 0
}));

function createAbacus() {
    for (let rod = 0; rod < rods; rod += 1) {
        const rodEl = document.createElement("div");
        rodEl.className = "rod";
        rodEl.style.left = `${rodLeft[rod]}%`;
        rodEl.dataset.rod = rod;
        beadLayer.appendChild(rodEl);

        for (let index = 0; index < 2; index += 1) {
            rodEl.appendChild(createBead(rod, "upper", index));
        }

        for (let index = 0; index < 5; index += 1) {
            rodEl.appendChild(createBead(rod, "lower", index));
        }
    }

    updateView();
}

function createBead(rod, type, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bead";
    button.dataset.rod = rod;
    button.dataset.type = type;
    button.dataset.index = index;
    button.setAttribute("aria-label", `${rod + 1}档${type === "upper" ? "上珠" : "下珠"}${index + 1}`);

    const img = document.createElement("img");
    img.src = "assets/images/abacus/abacus-bead-paper.png";
    img.alt = "";
    button.appendChild(img);

    button.addEventListener("click", () => toggleBead(rod, type, index));
    button.addEventListener("pointerdown", startDrag);
    return button;
}

function toggleBead(rod, type, index) {
    if (type === "upper") {
        const active = state[rod].upper > index;
        state[rod].upper = active ? index : index + 1;
    } else {
        const active = state[rod].lower > index;
        state[rod].lower = active ? index : index + 1;
    }
    updateView();
}

function startDrag(event) {
    const bead = event.currentTarget;
    bead.setPointerCapture(event.pointerId);
    bead.dataset.dragStartY = event.clientY;
    bead.addEventListener("pointerup", endDrag, { once: true });
    bead.addEventListener("pointercancel", endDrag, { once: true });
}

function endDrag(event) {
    const bead = event.currentTarget;
    const rod = Number(bead.dataset.rod);
    const type = bead.dataset.type;
    const index = Number(bead.dataset.index);
    const startY = Number(bead.dataset.dragStartY || event.clientY);
    const delta = event.clientY - startY;

    if (Math.abs(delta) < 8) {
        toggleBead(rod, type, index);
        return;
    }

    if (type === "upper") {
        const towardBeam = delta > 0;
        state[rod].upper = towardBeam ? Math.max(state[rod].upper, index + 1) : Math.min(state[rod].upper, index);
    } else {
        const towardBeam = delta < 0;
        state[rod].lower = towardBeam ? Math.max(state[rod].lower, index + 1) : Math.min(state[rod].lower, index);
    }

    updateView();
}

function updateView() {
    document.querySelectorAll(".bead").forEach((bead) => {
        const rod = Number(bead.dataset.rod);
        const type = bead.dataset.type;
        const index = Number(bead.dataset.index);
        const activeCount = state[rod][type];
        const active = activeCount > index;
        const positions = type === "upper"
            ? (active ? upperActive : upperHome)
            : (active ? lowerActive : lowerHome);

        bead.classList.toggle("active", active);
        bead.style.top = `${positions[index]}%`;
    });

    const value = state.reduce((sum, rodState, index) => {
        const place = 10 ** (rods - index - 1);
        return sum + ((rodState.upper * 5) + rodState.lower) * place;
    }, 0);

    valueOutput.value = value;
    valueOutput.textContent = value.toLocaleString("zh-CN");

    const activePlaces = state
        .map((rodState, index) => {
            const digit = (rodState.upper * 5) + rodState.lower;
            if (!digit) return "";
            const place = rods - index - 1;
            return `${digit}在10^${place}位`;
        })
        .filter(Boolean);

    placeText.textContent = activePlaces.length
        ? activePlaces.join("，")
        : "各档均未拨入。";
}

resetButton.addEventListener("click", () => {
    state.forEach((rodState) => {
        rodState.upper = 0;
        rodState.lower = 0;
    });
    updateView();
});

createAbacus();

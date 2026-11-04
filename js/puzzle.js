const board = document.getElementById("board");
const moveCountEl = document.getElementById("moveCount");
const messageEl = document.getElementById("win");
const restartButton = document.getElementById("restartPuzzle");

const initialPieces = [
    { id: "caocao", name: "曹操", img: "caocao.png", x: 1, y: 0, w: 2, h: 2, type: "caocao" },
    { id: "guanyu", name: "关羽", img: "guanyu.png", x: 1, y: 2, w: 2, h: 1, type: "horizontal" },
    { id: "zhangfei", name: "张飞", img: "zhangfei.png", x: 0, y: 0, w: 1, h: 2, type: "vertical" },
    { id: "zhaoyun", name: "赵云", img: "zhaoyun.png", x: 3, y: 0, w: 1, h: 2, type: "vertical" },
    { id: "machao", name: "马超", img: "machao.png", x: 0, y: 2, w: 1, h: 2, type: "vertical" },
    { id: "huangzhong", name: "黄忠", img: "huangzhong.png", x: 3, y: 2, w: 1, h: 2, type: "vertical" },
    { id: "soldier1", name: "兵", img: "guanyu.png", x: 0, y: 4, w: 1, h: 1, type: "soldier" },
    { id: "soldier2", name: "兵", img: "zhangfei.png", x: 1, y: 3, w: 1, h: 1, type: "soldier" },
    { id: "soldier3", name: "兵", img: "zhaoyun.png", x: 2, y: 3, w: 1, h: 1, type: "soldier" },
    { id: "soldier4", name: "兵", img: "machao.png", x: 3, y: 4, w: 1, h: 1, type: "soldier" }
];

let pieces = [];
let moves = 0;
let drag = null;

function setupPuzzle() {
    board.innerHTML = "";
    pieces = initialPieces.map((piece) => ({ ...piece }));
    moves = 0;
    moveCountEl.textContent = "0";
    messageEl.textContent = "拖动棋子开始挑战。空格在棋盘底部两侧，先为曹操让出向下通道。";

    pieces.forEach((piece) => {
        const el = document.createElement("div");
        el.className = `piece ${piece.type}`;
        el.dataset.id = piece.id;
        el.setAttribute("aria-label", piece.name);

        const img = document.createElement("img");
        img.src = `assets/images/puzzle/${piece.img}`;
        img.alt = piece.name;
        el.appendChild(img);

        el.addEventListener("pointerdown", startDrag);
        board.appendChild(el);
    });

    renderPieces();
}

function cellSize() {
    return (board.clientWidth - 20) / 4;
}

function renderPieces() {
    const size = cellSize();
    pieces.forEach((piece) => {
        const el = board.querySelector(`[data-id="${piece.id}"]`);
        el.style.left = `${10 + piece.x * size}px`;
        el.style.top = `${10 + piece.y * size}px`;
        el.style.width = `${piece.w * size - 6}px`;
        el.style.height = `${piece.h * size - 6}px`;
    });
}

function startDrag(event) {
    const el = event.currentTarget;
    const piece = pieces.find((item) => item.id === el.dataset.id);
    drag = {
        piece,
        el,
        startX: event.clientX,
        startY: event.clientY,
        originX: piece.x,
        originY: piece.y
    };
    el.classList.add("dragging");
    el.setPointerCapture(event.pointerId);
    el.addEventListener("pointermove", moveDrag);
    el.addEventListener("pointerup", endDrag, { once: true });
    el.addEventListener("pointercancel", endDrag, { once: true });
}

function moveDrag(event) {
    if (!drag) return;
    const size = cellSize();
    const left = 10 + drag.originX * size + event.clientX - drag.startX;
    const top = 10 + drag.originY * size + event.clientY - drag.startY;
    drag.el.style.left = `${left}px`;
    drag.el.style.top = `${top}px`;
}

function endDrag(event) {
    if (!drag) return;
    const size = cellSize();
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const stepX = horizontal ? Math.sign(dx) : 0;
    const stepY = horizontal ? 0 : Math.sign(dy);

    drag.el.classList.remove("dragging");
    drag.el.removeEventListener("pointermove", moveDrag);

    if (Math.max(Math.abs(dx), Math.abs(dy)) < size * 0.32) {
        messageEl.textContent = "再拖远一点，让棋子越过半格后松手。";
        renderPieces();
        drag = null;
        return;
    }

    const nextX = drag.originX + stepX;
    const nextY = drag.originY + stepY;

    if (canMove(drag.piece, nextX, nextY)) {
        drag.piece.x = nextX;
        drag.piece.y = nextY;
        moves += 1;
        moveCountEl.textContent = moves;
        messageEl.textContent = `${drag.piece.name}移动成功。继续为曹操打开出口。`;
        checkWin();
    } else {
        messageEl.textContent = "这一步被边界或其他棋子挡住了。";
    }

    renderPieces();
    drag = null;
}

function canMove(piece, nextX, nextY) {
    if (nextX < 0 || nextY < 0 || nextX + piece.w > 4 || nextY + piece.h > 5) {
        return false;
    }

    const dx = nextX - piece.x;
    const dy = nextY - piece.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
    if (piece.type === "horizontal" && dy !== 0) return false;
    if (piece.type === "vertical" && dx !== 0) return false;

    return !pieces.some((other) => {
        if (other.id === piece.id) return false;
        return rectanglesOverlap(
            { x: nextX, y: nextY, w: piece.w, h: piece.h },
            other
        );
    });
}

function rectanglesOverlap(a, b) {
    return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
}

function checkWin() {
    const caocao = pieces.find((piece) => piece.id === "caocao");
    if (caocao.x === 1 && caocao.y === 3) {
        messageEl.textContent = `通关！曹操已到达华容道出口，共用 ${moves} 步。`;
    }
}

restartButton.addEventListener("click", setupPuzzle);
window.addEventListener("resize", renderPieces);
setupPuzzle();

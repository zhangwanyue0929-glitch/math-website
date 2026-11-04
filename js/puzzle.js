/**
 * 华容道 · 横刀立马
 *
 * 棋盘 4 列 × 5 行。棋子占 18 格，剩下 2 格是空位。
 *   曹操 2×2，关羽 2×1（横放在曹操下方），
 *   张飞、赵云、马超、黄忠各 1×2，兵 1×1 共四枚。
 * 出口在底部正中。曹操左上角落到第 2 列、第 4 行
 * （占据最下面两行的中间两列）即通关。
 *
 * “横将 / 竖将”只说明棋子的形状，不限制移动方向。
 * 任何棋子都可以沿横向或纵向滑进空格，一次可连走多格，松手记一步。
 * 若规定横将只能横走、竖将只能竖走，这个开局没有解，所以这里按经典规则做。
 *
 * 计步：一次直线滑动算一步（连走多格也只算一步）。
 * 按这个规则，横刀立马最少 90 步。
 * 另一种传统计法允许同一步里拐弯，最少是 81 步，本页的拖动是直线滑动。
 *
 * 坐标：x 向右、y 向下，都从 0 起算。
 */
(function () {
    var COLS = 4;
    var ROWS = 5;

    var INITIAL = [
        { id: "caocao", name: "曹操", img: "caocao.png", x: 1, y: 0, w: 2, h: 2 },
        { id: "guanyu", name: "关羽", img: "guanyu.png", x: 1, y: 2, w: 2, h: 1 },
        { id: "zhangfei", name: "张飞", img: "zhangfei.png", x: 0, y: 0, w: 1, h: 2 },
        { id: "zhaoyun", name: "赵云", img: "zhaoyun.png", x: 3, y: 0, w: 1, h: 2 },
        { id: "machao", name: "马超", img: "machao.png", x: 0, y: 2, w: 1, h: 2 },
        { id: "huangzhong", name: "黄忠", img: "huangzhong.png", x: 3, y: 2, w: 1, h: 2 },
        { id: "s1", name: "兵", x: 1, y: 3, w: 1, h: 1 },
        { id: "s2", name: "兵", x: 2, y: 3, w: 1, h: 1 },
        { id: "s3", name: "兵", x: 0, y: 4, w: 1, h: 1 },
        { id: "s4", name: "兵", x: 3, y: 4, w: 1, h: 1 }
    ];

    var START_TEXT = "拖动棋子滑进空格，一次可连走多格，记为一步。也可以轻点只有一个方向可走的棋子。曹操到达底部正中的出口即通关。";

    var board = document.getElementById("board");
    var shell = document.querySelector(".board-shell");
    var moveCountEl = document.getElementById("moveCount");
    var messageEl = document.getElementById("win");
    var banner = document.getElementById("winBanner");
    var restartButton = document.getElementById("restartPuzzle");

    var pieces = [];
    var moves = 0;
    var won = false;
    var drag = null;

    function clonePieces() {
        return INITIAL.map(function (piece) {
            return {
                id: piece.id,
                name: piece.name,
                img: piece.img || "",
                x: piece.x,
                y: piece.y,
                w: piece.w,
                h: piece.h
            };
        });
    }

    /* 一格加上间隙的像素距离，拖动时用它把手指位移换算成格数。 */
    function stepSize() {
        var gap = parseFloat(window.getComputedStyle(board).columnGap) || 0;
        var step = (board.clientWidth + gap) / COLS;
        var cell = step - gap;
        board.style.height = (ROWS * cell + (ROWS - 1) * gap) + "px";
        return step;
    }

    function occupancy(skipId) {
        var grid = [];
        var y;
        var x;
        for (y = 0; y < ROWS; y += 1) {
            grid.push([null, null, null, null]);
        }
        pieces.forEach(function (piece) {
            if (piece.id === skipId) return;
            for (y = 0; y < piece.h; y += 1) {
                for (x = 0; x < piece.w; x += 1) {
                    grid[piece.y + y][piece.x + x] = piece.id;
                }
            }
        });
        return grid;
    }

    function fits(piece, x, y, grid) {
        if (x < 0 || y < 0 || x + piece.w > COLS || y + piece.h > ROWS) return false;
        var dy;
        var dx;
        for (dy = 0; dy < piece.h; dy += 1) {
            for (dx = 0; dx < piece.w; dx += 1) {
                if (grid[y + dy][x + dx]) return false;
            }
        }
        return true;
    }

    /* 沿一个方向最多能滑几格。路径上每一格都必须是空的。 */
    function maxSlide(piece, dx, dy) {
        if (!dx && !dy) return 0;
        var grid = occupancy(piece.id);
        var x = piece.x;
        var y = piece.y;
        var steps = 0;
        while (fits(piece, x + dx, y + dy, grid)) {
            x += dx;
            y += dy;
            steps += 1;
        }
        return steps;
    }

    function renderPieces() {
        pieces.forEach(function (piece) {
            var el = board.querySelector('[data-id="' + piece.id + '"]');
            if (!el) return;
            el.style.gridColumn = (piece.x + 1) + " / span " + piece.w;
            el.style.gridRow = (piece.y + 1) + " / span " + piece.h;
            el.style.transform = "";
        });
    }

    function setMessage(text) {
        messageEl.textContent = text;
    }

    function checkWin() {
        var caocao = pieces.find(function (piece) { return piece.id === "caocao"; });
        if (caocao.x === 1 && caocao.y === 3) {
            won = true;
            shell.classList.add("won");
            banner.hidden = false;
            setMessage("通关！曹操已到达华容道出口，共用 " + moves + " 步。");
        }
    }

    function commit(piece, x, y) {
        if (x === piece.x && y === piece.y) return false;
        piece.x = x;
        piece.y = y;
        moves += 1;
        moveCountEl.textContent = String(moves);
        renderPieces();
        if (!won) {
            setMessage(piece.name + "移动成功。继续为曹操打开向下的出口。");
            checkWin();
        }
        return true;
    }

    function tryTap(piece) {
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (dir) {
            return maxSlide(piece, dir[0], dir[1]) > 0;
        });
        if (dirs.length === 1) {
            commit(piece, piece.x + dirs[0][0], piece.y + dirs[0][1]);
            return;
        }
        if (dirs.length === 0) {
            setMessage(piece.name + "四周都没有空位，试试别的棋子。");
            return;
        }
        setMessage(piece.name + "有多个方向可走，请向空位拖动。");
    }

    function onPointerDown(event) {
        if (won) return;
        if (event.button !== undefined && event.button !== 0) return;
        var el = event.currentTarget;
        var piece = pieces.find(function (item) { return item.id === el.dataset.id; });
        drag = {
            pointerId: event.pointerId,
            piece: piece,
            el: el,
            startX: event.clientX,
            startY: event.clientY,
            axis: null,
            step: stepSize(),
            previewX: piece.x,
            previewY: piece.y
        };
        el.classList.add("dragging");
        if (el.setPointerCapture) el.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    function onPointerMove(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        var dx = event.clientX - drag.startX;
        var dy = event.clientY - drag.startY;
        if (!drag.axis && Math.hypot(dx, dy) > 8) {
            drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
        if (!drag.axis) return;

        var delta = drag.axis === "x" ? dx : dy;
        var dir = Math.sign(delta);
        var dirX = drag.axis === "x" ? dir : 0;
        var dirY = drag.axis === "y" ? dir : 0;
        var max = maxSlide(drag.piece, dirX, dirY);
        var limit = max * drag.step;
        var clamped = dir * Math.min(Math.abs(delta), limit);
        var steps = Math.round(Math.abs(clamped) / drag.step);
        if (steps > max) steps = max;
        drag.previewX = drag.piece.x + dirX * steps;
        drag.previewY = drag.piece.y + dirY * steps;
        /* 手指在合法范围内跟手，不会滑进别的棋子。 */
        drag.el.style.transform = drag.axis === "x"
            ? "translate(" + clamped + "px, 0)"
            : "translate(0, " + clamped + "px)";
        event.preventDefault();
    }

    function onPointerUp(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        var piece = drag.piece;
        var el = drag.el;
        var moved = drag.previewX !== piece.x || drag.previewY !== piece.y;
        var axis = drag.axis;
        var nextX = drag.previewX;
        var nextY = drag.previewY;
        el.classList.remove("dragging");
        el.style.transform = "";
        drag = null;

        if (moved) {
            commit(piece, nextX, nextY);
            return;
        }
        if (!axis) {
            tryTap(piece);
            return;
        }
        setMessage("这一步被边界或其他棋子挡住了。");
        renderPieces();
    }

    function onKeyDown(event) {
        if (won) return;
        var map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        var dir = map[event.key];
        if (!dir) return;
        var piece = pieces.find(function (item) { return item.id === event.currentTarget.dataset.id; });
        if (maxSlide(piece, dir[0], dir[1]) < 1) {
            setMessage(piece.name + "不能往这个方向移动。");
            return;
        }
        event.preventDefault();
        commit(piece, piece.x + dir[0], piece.y + dir[1]);
    }

    function buildPiece(piece) {
        var el = document.createElement("div");
        el.className = "piece" + (piece.id === "caocao" ? " piece-caocao" : "") + (piece.name === "兵" ? " soldier" : "");
        el.dataset.id = piece.id;
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", piece.name + "，" + piece.w + "乘" + piece.h);

        if (piece.img) {
            var img = document.createElement("img");
            img.src = "assets/images/puzzle/" + piece.img;
            img.alt = "";
            img.draggable = false;
            el.appendChild(img);
        }

        var label = document.createElement("span");
        label.className = "piece-name";
        label.textContent = piece.name;
        el.appendChild(label);

        el.addEventListener("pointerdown", onPointerDown, { passive: false });
        el.addEventListener("pointermove", onPointerMove, { passive: false });
        el.addEventListener("pointerup", onPointerUp);
        el.addEventListener("pointercancel", onPointerUp);
        el.addEventListener("keydown", onKeyDown);
        el.addEventListener("contextmenu", function (event) { event.preventDefault(); });
        return el;
    }

    function setupPuzzle() {
        pieces = clonePieces();
        moves = 0;
        won = false;
        drag = null;
        moveCountEl.textContent = "0";
        shell.classList.remove("won");
        banner.hidden = true;
        setMessage(START_TEXT);
        board.innerHTML = "";
        pieces.forEach(function (piece) {
            board.appendChild(buildPiece(piece));
        });
        stepSize();
        renderPieces();
    }

    restartButton.addEventListener("click", setupPuzzle);
    window.addEventListener("resize", function () {
        if (drag) return;
        stepSize();
        renderPieces();
    });

    setupPuzzle();
})();

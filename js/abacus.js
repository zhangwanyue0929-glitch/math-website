/**
 * 传统二五珠算盘。
 * 上珠一颗记五，下珠一颗记一；靠梁才算入读数，靠框则不计。
 * 本页不自动进位：某一档凑满十时，由操作者向左一档拨入一颗下珠。
 *
 * 珠位是按算盘框图片量出来的百分比（相对整个算盘，不是相对某一档）。
 * 上珠 index 0 靠近梁，先被拨下；下珠 index 0 也靠近梁，先被拨上。
 * 这样拨动时珠子不会互相穿过。
 *
 * 早先同时监听了 click 和 pointerup，轻点会拨过去又拨回来，看起来像点不动。
 * 现在只在 pointerup 里处理点击和拖动。
 */
(function () {
    var rods = 13;
    var rodLeft = [11.03, 17.55, 24.01, 30.53, 37.02, 43.45, 49.94, 56.40, 62.92, 69.35, 75.84, 82.33, 88.85];
    var upperHome = [26.39, 19.70];
    var upperActive = [30.40, 23.71];
    var lowerHome = [53.82, 60.52, 67.21, 73.91, 80.60];
    var lowerActive = [43.00, 49.69, 56.39, 63.08, 69.78];
    var placeNames = ["个", "十", "百", "千", "万", "十万", "百万", "千万", "亿", "十亿", "百亿", "千亿", "万亿"];

    var beadLayer = document.getElementById("abacusBeads");
    var valueOutput = document.getElementById("abacusValue");
    var placeText = document.getElementById("placeText");
    var resetButton = document.getElementById("resetAbacus");

    var state = [];
    var drag = null;
    var rod;

    for (rod = 0; rod < rods; rod += 1) {
        state.push({ upper: 0, lower: 0 });
    }

    function createAbacus() {
        var index;
        for (rod = 0; rod < rods; rod += 1) {
            for (index = 0; index < 2; index += 1) {
                beadLayer.appendChild(createBead(rod, "upper", index));
            }
            for (index = 0; index < 5; index += 1) {
                beadLayer.appendChild(createBead(rod, "lower", index));
            }
        }
        updateView();
    }

    function createBead(rodIndex, type, index) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "bead";
        button.dataset.rod = String(rodIndex);
        button.dataset.type = type;
        button.dataset.index = String(index);
        button.style.setProperty("--x", rodLeft[rodIndex] + "%");
        button.setAttribute("aria-label", (rodIndex + 1) + "档" + (type === "upper" ? "上珠" : "下珠") + (index + 1));

        var img = document.createElement("img");
        img.src = "assets/images/abacus/abacus-bead-paper.png";
        img.alt = "";
        img.draggable = false;
        button.appendChild(img);

        button.addEventListener("pointerdown", onPointerDown);
        button.addEventListener("pointerup", onPointerUp);
        button.addEventListener("pointercancel", onPointerUp);
        button.addEventListener("contextmenu", function (event) { event.preventDefault(); });
        return button;
    }

    function toggleBead(rodIndex, type, index) {
        var active = state[rodIndex][type] > index;
        /* 点到第几颗，就把这一侧拨到这一颗靠梁；再点一次则拨回这一颗靠框。 */
        state[rodIndex][type] = active ? index : index + 1;
        updateView();
    }

    function onPointerDown(event) {
        if (event.button !== undefined && event.button !== 0) return;
        drag = {
            id: event.pointerId,
            bead: event.currentTarget,
            y: event.clientY
        };
        if (event.currentTarget.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
    }

    function onPointerUp(event) {
        if (!drag || event.pointerId !== drag.id) return;
        var bead = drag.bead;
        var delta = event.clientY - drag.y;
        drag = null;

        var rodIndex = Number(bead.dataset.rod);
        var type = bead.dataset.type;
        var index = Number(bead.dataset.index);

        if (Math.abs(delta) < 10) {
            toggleBead(rodIndex, type, index);
            return;
        }

        /* 上珠向下靠近梁，下珠向上靠近梁。拖过阈值就吸附，不必对准像素。 */
        if (type === "upper") {
            var upperToward = delta > 0;
            state[rodIndex].upper = upperToward
                ? Math.max(state[rodIndex].upper, index + 1)
                : Math.min(state[rodIndex].upper, index);
        } else {
            var lowerToward = delta < 0;
            state[rodIndex].lower = lowerToward
                ? Math.max(state[rodIndex].lower, index + 1)
                : Math.min(state[rodIndex].lower, index);
        }
        updateView();
    }

    function updateView() {
        document.querySelectorAll(".bead").forEach(function (bead) {
            var rodIndex = Number(bead.dataset.rod);
            var type = bead.dataset.type;
            var index = Number(bead.dataset.index);
            var active = state[rodIndex][type] > index;
            var positions = type === "upper"
                ? (active ? upperActive : upperHome)
                : (active ? lowerActive : lowerHome);
            bead.classList.toggle("active", active);
            bead.style.top = positions[index] + "%";
        });

        var value = state.reduce(function (sum, rodState, index) {
            var place = Math.pow(10, rods - index - 1);
            return sum + (rodState.upper * 5 + rodState.lower) * place;
        }, 0);

        valueOutput.textContent = value.toLocaleString("zh-CN");

        var parts = [];
        var needCarry = false;
        state.forEach(function (rodState, index) {
            var digit = rodState.upper * 5 + rodState.lower;
            if (!digit) return;
            if (digit >= 10) needCarry = true;
            parts.push(placeNames[rods - 1 - index] + "位 " + digit);
        });

        if (!parts.length) {
            placeText.textContent = "各档均未拨入。";
            return;
        }
        placeText.textContent = parts.join("，") + (needCarry ? "。有的档位已满十，可以向左进一。" : "。");
    }

    resetButton.addEventListener("click", function () {
        state.forEach(function (rodState) {
            rodState.upper = 0;
            rodState.lower = 0;
        });
        updateView();
    });

    createAbacus();
})();

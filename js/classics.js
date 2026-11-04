const classics = {
    gougu: {
        kicker: "《周髀算经》与《九章算术》的测量智慧",
        title: "勾股定理",
        text: "中国古代把直角三角形中较短的直角边称为“勾”，较长的直角边称为“股”，斜边称为“弦”。勾股关系说明：勾平方与股平方相加，等于弦平方。",
        detail: "勾股定理不只是纸面公式，它来自土地丈量、城墙高度、河宽距离等实际问题。古人借助矩、绳和面积拼补来理解“勾三股四弦五”等典型数组，把空间测量转化为可以计算的数。",
        points: [
            "把几何图形和数值计算连接起来，是古代测量术的基础工具。",
            "可用于估算不可直接到达的距离，例如隔河测宽、登高测影。",
            "在《九章算术》的“勾股”章中形成了成体系的问题与算法。"
        ],
        html: `
            <div class="gougu-box">
                <div class="gougu-visual" id="gouguVisual"></div>
                <label>勾 a：<span id="aValue">3</span>
                    <input type="range" id="aRange" min="1" max="12" value="3">
                </label>
                <label>股 b：<span id="bValue">4</span>
                    <input type="range" id="bRange" min="1" max="12" value="4">
                </label>
                <div class="formula-card" id="result"></div>
            </div>
        `
    },
    yanghui: {
        kicker: "《详解九章算法》中的三角垛形",
        title: "杨辉三角",
        text: "杨辉三角以层层相加的方式排列数字：每个内部数字都等于它肩上左右两个数字之和。它揭示了组合数、二项式展开系数与多种数列之间的关系。",
        detail: "在中国数学传统中，这种图式常用于“开方作法”和高次方展开。它看似只是数字堆叠，实际包含了组合选择的计数思想：第 n 行的数字可解释为从 n 个对象中取 k 个的方法数。",
        points: [
            "每一行的和都是 2 的幂，体现二项展开的总项数。",
            "斜列中可以读出自然数、三角数、四面体数等多种数列。",
            "它把代数展开、组合计数和递推算法放在同一张图里。"
        ],
        html: `
            <div class="pascal-control">
                <button id="lessRows" type="button">减少行数</button>
                <span id="rowText">当前 8 行</span>
                <button id="moreRows" type="button">增加行数</button>
            </div>
            <div id="pascal"></div>
        `
    },
    circle: {
        kicker: "刘徽割圆术与圆周率逼近",
        title: "割圆术",
        text: "割圆术用圆内接正多边形逼近圆。边数越多，多边形周长越接近圆周长，进而得到越来越精密的圆周率估计。",
        detail: "刘徽在注解《九章算术》时提出割圆思想，从正六边形开始不断倍增边数，以“割之弥细，所失弥少”的方式逼近圆。这个过程体现了极限思想的萌芽。",
        points: [
            "通过可计算的多边形周长逼近难以直接测量的曲线长度。",
            "边数倍增后误差逐渐缩小，展示了逼近与极限的思想。",
            "为祖冲之等后世数学家进一步精算圆周率提供了方法基础。"
        ],
        html: `
            <div class="circle-demo">
                <canvas id="circleCanvas" width="420" height="420"></canvas>
                <label>多边形边数
                    <input type="range" id="sideRange" min="6" max="192" step="6" value="6">
                </label>
                <button id="doubleSides" type="button">边数加倍</button>
                <p id="sideText"></p>
            </div>
        `
    }
};

const buttons = document.querySelectorAll(".classic-btn");

buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        loadClassic(btn.dataset.classic);
    });
});

function loadClassic(key) {
    const item = classics[key];
    document.getElementById("classic-kicker").textContent = item.kicker;
    document.getElementById("classic-title").textContent = item.title;
    document.getElementById("classic-text").textContent = item.text;
    document.getElementById("classic-detail").textContent = item.detail;
    document.getElementById("classic-points").innerHTML = item.points
        .map((point) => `<li>${point}</li>`)
        .join("");
    document.getElementById("demo-container").innerHTML = item.html;

    if (key === "gougu") initGougu();
    if (key === "yanghui") initPascal();
    if (key === "circle") initCircle();
}

function initGougu() {
    const aRange = document.getElementById("aRange");
    const bRange = document.getElementById("bRange");
    const visual = document.getElementById("gouguVisual");

    function update() {
        const a = Number(aRange.value);
        const b = Number(bRange.value);
        const c = Math.sqrt(a * a + b * b);
        document.getElementById("aValue").textContent = a;
        document.getElementById("bValue").textContent = b;
        document.getElementById("result").textContent = `${a}² + ${b}² = ${c.toFixed(2)}²，弦长约为 ${c.toFixed(2)}`;
        visual.style.width = `${Math.max(180, a * 22)}px`;
        visual.style.height = `${Math.max(150, b * 18)}px`;
    }

    aRange.addEventListener("input", update);
    bRange.addEventListener("input", update);
    update();
}

function initPascal() {
    let rows = 8;
    const container = document.getElementById("pascal");
    const rowText = document.getElementById("rowText");

    function draw() {
        const triangle = [];
        container.innerHTML = "";

        for (let i = 0; i < rows; i += 1) {
            triangle[i] = [];
            const row = document.createElement("div");
            row.className = "pascal-row";

            for (let j = 0; j <= i; j += 1) {
                triangle[i][j] = (j === 0 || j === i)
                    ? 1
                    : triangle[i - 1][j - 1] + triangle[i - 1][j];
                const span = document.createElement("span");
                span.textContent = triangle[i][j];
                row.appendChild(span);
            }
            container.appendChild(row);
        }
        rowText.textContent = `当前 ${rows} 行`;
    }

    document.getElementById("lessRows").addEventListener("click", () => {
        rows = Math.max(4, rows - 1);
        draw();
    });

    document.getElementById("moreRows").addEventListener("click", () => {
        rows = Math.min(12, rows + 1);
        draw();
    });

    draw();
}

function initCircle() {
    const canvas = document.getElementById("circleCanvas");
    const ctx = canvas.getContext("2d");
    const sideRange = document.getElementById("sideRange");
    const sideText = document.getElementById("sideText");
    const doubleButton = document.getElementById("doubleSides");

    function draw() {
        const sides = Number(sideRange.value);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = 145;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#c6a15b";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i <= sides; i += 1) {
            const angle = -Math.PI / 2 + (Math.PI * 2 / sides) * i;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#8b3a32";
        ctx.lineWidth = 2;
        ctx.stroke();

        const piApprox = sides * Math.sin(Math.PI / sides);
        sideText.textContent = `当前为正 ${sides} 边形，内接周长估得 π ≈ ${piApprox.toFixed(6)}，与 Math.PI 相差 ${Math.abs(Math.PI - piApprox).toFixed(6)}。`;
    }

    sideRange.addEventListener("input", draw);
    doubleButton.addEventListener("click", () => {
        sideRange.value = Math.min(192, Number(sideRange.value) * 2);
        draw();
    });
    draw();
}

loadClassic("gougu");

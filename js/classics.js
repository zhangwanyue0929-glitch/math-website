/**
 * 数学经典馆：勾股定理、杨辉三角、割圆术。
 * 图形用 SVG，方便缩放，也方便在答辩时指出每一条边对应的量。
 * 条目数据集中在 classics 里，以后可以从接口替换，不必改布局。
 */
(function () {
    var classics = {
        gougu: {
            kicker: "中国古代数学实验",
            title: "勾股定理",
            text: "中国古代把直角三角形中较短的直角边称为“勾”，较长的直角边称为“股”，斜边称为“弦”。勾平方与股平方相加，等于弦平方。",
            detail: "勾股定理来自土地丈量、城墙高度和河宽一类实际问题。《周髀算经》已有“勾三股四弦五”，《九章算术》勾股章则把多种测量问题收成可以计算的算法。",
            sourceNote: "《九章算术》勾股术。特例“勾三股四弦五”已见于《周髀算经》。",
            sourceText: "勾股术曰：勾股各自乘，并而开方除之，即弦。",
            bookHref: "classic-jiuzhang.html",
            bookLabel: "阅读《九章算术》",
            points: [
                "把图形和数值连在一起，是古代测量术的基本工具。",
                "可以估算不能直接到达的距离，例如隔河测宽。",
                "在《九章算术》“勾股”章里形成了成套的问题和算法。"
            ],
            html: ''
                + '<div class="gougu-box">'
                + '  <svg class="math-svg" id="gouguSvg" viewBox="0 0 320 230" role="img" aria-label="勾股形">'
                + '    <polyline id="gouguShape" fill="rgba(139,58,50,0.08)" stroke="#8b3a32" stroke-width="3" stroke-linejoin="round"></polyline>'
                + '    <polyline id="gouguRight" fill="none" stroke="#8b3a32" stroke-width="2"></polyline>'
                + '    <text id="labelGou" fill="#8b3a32" font-size="16">勾</text>'
                + '    <text id="labelGu" fill="#8b3a32" font-size="16">股</text>'
                + '    <text id="labelXian" fill="#8b3a32" font-size="16">弦</text>'
                + '  </svg>'
                + '  <p class="diagram-caption">交互滑块 / 公式结果</p>'
                + '  <label>勾 a <span id="aValue">3</span><input type="range" id="aRange" min="1" max="12" value="3"></label>'
                + '  <label>股 b <span id="bValue">4</span><input type="range" id="bRange" min="1" max="12" value="4"></label>'
                + '  <div class="formula-card" id="result"></div>'
                + '</div>'
        },
        yanghui: {
            kicker: "《详解九章算法》中的三角数表",
            title: "杨辉三角",
            text: "杨辉三角层层相加：每个数等于它肩上左右两数之和。它同时是组合数和二项式展开的系数表。",
            detail: "在中国数学里，这张表常用于开方作法。第 n 行从 0 数起，第 k 个数就是从 n 个里取 k 个的方法数。",
            sourceNote: "杨辉所录“开方作法本源”图注。他写明这张表贾宪已经在用。",
            sourceText: "出释锁算书，贾宪用此术。",
            bookHref: "person-yanghui.html",
            bookLabel: "阅读杨辉专题",
            points: [
                "每一行的和都是 2 的幂。",
                "斜着读，可以看到自然数、三角数等数列。",
                "一张表里同时有递推、组合和二项展开。"
            ],
            html: ''
                + '<div class="pascal-control">'
                + '  <button id="lessRows" type="button">减少行数</button>'
                + '  <span id="rowText">当前 8 行</span>'
                + '  <button id="moreRows" type="button">增加行数</button>'
                + '</div>'
                + '<div id="pascal" aria-label="杨辉三角"></div>'
        },
        circle: {
            kicker: "刘徽割圆术与圆周率逼近",
            title: "割圆术",
            text: "割圆术用圆内接正多边形逼近圆。边数越多，多边形周长越接近圆周长，得到的圆周率就越精细。",
            detail: "刘徽注解《九章算术》时从正六边形开始，不断把边数加倍，说“割之弥细，所失弥少”。这是极限思想的早期表达。",
            sourceNote: "刘徽《九章算术注》圆田术注。",
            sourceText: "割之弥细，所失弥少。割之又割，以至于不可割，则与圆合体而无所失矣。",
            bookHref: "person-liuhui.html",
            bookLabel: "阅读刘徽专题",
            points: [
                "用算得出的直线段去逼近曲线。",
                "边数加倍以后，误差明显变小。",
                "为后来更密的圆周率准备了方法，但《缀术》已经失传。"
            ],
            html: ''
                + '<div class="circle-demo">'
                + '  <svg class="math-svg" id="circleSvg" viewBox="0 0 320 320" role="img" aria-label="割圆示意">'
                + '    <circle cx="160" cy="160" r="130" fill="none" stroke="#c6a15b" stroke-width="2"></circle>'
                + '    <polygon id="circlePoly" fill="rgba(139,58,50,0.12)" stroke="#8b3a32" stroke-width="2"></polygon>'
                + '  </svg>'
                + '  <label>多边形边数 <span id="sideLabel">6</span>'
                + '    <input type="range" id="sideRange" min="6" max="96" step="1" value="6">'
                + '  </label>'
                + '  <button id="doubleSides" type="button">边数加倍</button>'
                + '  <p id="sideText"></p>'
                + '</div>'
        }
    };

    var buttons = document.querySelectorAll(".classic-btn");

    buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            buttons.forEach(function (item) { item.classList.remove("active"); });
            btn.classList.add("active");
            loadClassic(btn.dataset.classic);
        });
    });

    var remote = {};

    function shown(key) {
        var item = classics[key];
        var hit = remote[key];
        if (!hit) return item;
        var copy = {};
        Object.keys(item).forEach(function (name) { copy[name] = item[name]; });
        if (hit.subtitle) copy.kicker = hit.subtitle;
        if (hit.title) copy.title = hit.title;
        if (hit.summary) copy.text = hit.summary;
        if (hit.modernText) copy.detail = hit.modernText;
        if (hit.sourceNote) copy.sourceNote = hit.sourceNote;
        if (hit.sourceText) copy.sourceText = hit.sourceText;
        if (hit.points) {
            copy.points = hit.points.split("\n").filter(function (line) { return line.trim(); });
        }
        return copy;
    }

    function loadClassic(key) {
        var item = shown(key);
        document.getElementById("classic-kicker").textContent = item.kicker;
        document.getElementById("classic-title").textContent = item.title;
        document.getElementById("classic-text").textContent = item.text;
        document.getElementById("classic-detail").textContent = item.detail;
        document.getElementById("classic-source-note").textContent = item.sourceNote || "";
        document.getElementById("classic-source").textContent = item.sourceText || "";
        var book = document.getElementById("classic-book");
        book.textContent = item.bookLabel;
        book.setAttribute("href", item.bookHref);
        var list = document.getElementById("classic-points");
        list.innerHTML = "";
        item.points.forEach(function (point) {
            var li = document.createElement("li");
            li.textContent = point;
            list.appendChild(li);
        });
        /* 演示图形只来自本文件，不从数据库取 HTML。 */
        document.getElementById("demo-container").innerHTML = item.html;
        if (key === "gougu") initGougu();
        if (key === "yanghui") initPascal();
        if (key === "circle") initCircle();
        if (window.history && history.replaceState) history.replaceState(null, "", "#" + key);
    }

    function initGougu() {
        var aRange = document.getElementById("aRange");
        var bRange = document.getElementById("bRange");
        var shape = document.getElementById("gouguShape");
        var right = document.getElementById("gouguRight");

        function update() {
            var a = Number(aRange.value);
            var b = Number(bRange.value);
            var c = Math.sqrt(a * a + b * b);
            var cText = Math.abs(c - Math.round(c)) < 1e-6 ? String(Math.round(c)) : c.toFixed(2);
            document.getElementById("aValue").textContent = String(a);
            document.getElementById("bValue").textContent = String(b);
            document.getElementById("result").textContent = a + "² + " + b + "² = " + cText + "²，弦长约 " + cText;

            /* 直角在左下。按勾、股的比例放大，让图形铺满示意区。 */
            var scale = Math.min(210 / b, 132 / a);
            var x0 = 58;
            var y0 = 164;
            var x1 = x0 + b * scale;
            var y1 = y0 - a * scale;
            var mark = Math.max(10, Math.min(16, scale * 0.35));
            shape.setAttribute("points", x0 + "," + y0 + " " + x0 + "," + y1 + " " + x1 + "," + y0 + " " + x0 + "," + y0);
            right.setAttribute("points", (x0 + mark) + "," + y0 + " " + (x0 + mark) + "," + (y0 - mark) + " " + x0 + "," + (y0 - mark));
            document.getElementById("labelGou").setAttribute("x", 22);
            document.getElementById("labelGou").setAttribute("y", (y0 + y1) / 2 + 6);
            document.getElementById("labelGu").setAttribute("x", (x0 + x1) / 2 - 8);
            document.getElementById("labelGu").setAttribute("y", y0 + 24);
            document.getElementById("labelXian").setAttribute("x", (x0 + x1) / 2 + 4);
            document.getElementById("labelXian").setAttribute("y", (y0 + y1) / 2 - 8);
        }

        aRange.addEventListener("input", update);
        bRange.addEventListener("input", update);
        update();
    }

    function initPascal() {
        var rows = 8;
        var container = document.getElementById("pascal");
        var rowText = document.getElementById("rowText");

        function draw() {
            container.innerHTML = "";
            var prev = [];
            var i;
            var j;
            for (i = 0; i < rows; i += 1) {
                var row = document.createElement("div");
                row.className = "pascal-row";
                var current = [];
                for (j = 0; j <= i; j += 1) {
                    var value = (j === 0 || j === i) ? 1 : prev[j - 1] + prev[j];
                    current.push(value);
                    var cell = document.createElement("span");
                    cell.textContent = String(value);
                    row.appendChild(cell);
                }
                prev = current;
                container.appendChild(row);
            }
            rowText.textContent = "当前 " + rows + " 行";
        }

        document.getElementById("lessRows").addEventListener("click", function () {
            rows = Math.max(4, rows - 1);
            draw();
        });
        document.getElementById("moreRows").addEventListener("click", function () {
            rows = Math.min(12, rows + 1);
            draw();
        });
        draw();
    }

    function initCircle() {
        var poly = document.getElementById("circlePoly");
        var sideRange = document.getElementById("sideRange");
        var sideText = document.getElementById("sideText");

        function draw() {
            var sides = Number(sideRange.value);
            var cx = 160;
            var cy = 160;
            var r = 130;
            var points = [];
            var i;
            for (i = 0; i < sides; i += 1) {
                var angle = -Math.PI / 2 + (Math.PI * 2 * i) / sides;
                points.push((cx + r * Math.cos(angle)).toFixed(2) + "," + (cy + r * Math.sin(angle)).toFixed(2));
            }
            poly.setAttribute("points", points.join(" "));
            /* 单位圆内接正 n 边形周长是 2n·sin(π/n)，除以直径 2，得到 π 的近似。 */
            var piApprox = sides * Math.sin(Math.PI / sides);
            document.getElementById("sideLabel").textContent = String(sides);
            sideText.textContent = "当前为正 " + sides + " 边形，内接周长估得 π ≈ " + piApprox.toFixed(6)
                + "，与圆周率相差 " + Math.abs(Math.PI - piApprox).toFixed(6) + "。";
        }

        sideRange.addEventListener("input", draw);
        document.getElementById("doubleSides").addEventListener("click", function () {
            sideRange.value = String(Math.min(96, Number(sideRange.value) * 2));
            draw();
        });
        draw();
    }

    var start = "gougu";
    var hash = (location.hash || "").replace(/^#/, "");
    if (classics[hash]) start = hash;
    buttons.forEach(function (button) {
        button.classList.toggle("active", button.dataset.classic === start);
    });
    loadClassic(start);

    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) return;
        SuanjingAPI.request("content?kind=exhibit&pageSize=20").then(function (data) {
            data.items.forEach(function (item) { remote[item.slug] = item; });
            var current = document.querySelector(".classic-btn.active");
            if (current) loadClassic(current.dataset.classic);
        }).catch(function () {});
    });
})();

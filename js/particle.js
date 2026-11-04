/**
 * 淡墨点只做气氛。画布盖在页面上，但关掉指针事件，
 * 否则会挡住华容道拖动和算盘拨珠。
 */
(function () {
    var canvas = document.createElement("canvas");
    canvas.id = "inkParticle";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var dots = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    var count = Math.min(46, Math.max(16, Math.floor(window.innerWidth / 32)));
    for (var i = 0; i < count; i += 1) {
        dots.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 2.1 + 0.6,
            v: Math.random() * 0.32 + 0.08
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(90, 60, 36, 0.15)";
        dots.forEach(function (dot) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
            ctx.fill();
            dot.y -= dot.v;
            if (dot.y < -4) dot.y = canvas.height + 4;
        });
        window.requestAnimationFrame(draw);
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        draw();
    }
})();

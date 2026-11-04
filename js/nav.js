/**
 * 窄屏时展开顶部菜单。
 * 当前页高亮写在各页 HTML 的 .active 上，不依赖脚本，没加载脚本时链接仍然可用。
 * 第二阶段若要显示“登录 / 退出”，可以在这个导航里追加链接。
 */
(function () {
    var toggle = document.querySelector(".nav-toggle");
    var header = document.querySelector(".navbar");
    if (!toggle || !header) return;

    toggle.addEventListener("click", function () {
        var open = header.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });

    header.querySelectorAll("nav a").forEach(function (link) {
        link.addEventListener("click", function () {
            header.classList.remove("nav-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "打开菜单");
        });
    });
})();

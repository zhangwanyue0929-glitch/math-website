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

    header.querySelector("nav").addEventListener("click", function (event) {
        if (!event.target.closest("a")) return;
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "打开菜单");
    });

    /* 登录状态由接口决定。静态页面没有服务器时，链接保持为“登录”。 */
    function paintAccount() {
        var slot = document.querySelector("[data-nav-account]");
        if (!slot || !window.SuanjingAPI) return;
        var existing = document.querySelector("[data-nav-admin]");
        if (existing) existing.parentNode.removeChild(existing);
        var user = SuanjingAPI.state.user;
        if (!user) {
            slot.textContent = "登录";
            slot.setAttribute("href", "login.html");
            return;
        }
        slot.textContent = user.username;
        slot.setAttribute("href", "profile.html");
        if (user.role === "ADMIN") {
            var admin = document.createElement("a");
            admin.href = "admin.html";
            admin.className = "nav-minor";
            admin.setAttribute("data-nav-admin", "1");
            admin.textContent = "后台";
            slot.parentNode.insertBefore(admin, slot.nextSibling);
        }
    }

    if (window.SuanjingAPI) SuanjingAPI.ready.then(paintAccount);
})();

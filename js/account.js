/**
 * 登录、注册、密保找回三个页面共用。
 * body 上的 data-page 决定显示哪一套检查。
 */
(function () {
    var page = document.body.getAttribute("data-page");
    var form = document.querySelector("form");
    var errorNode = document.getElementById("formError");
    if (!form || !window.SuanjingAPI) return;

    function say(message) {
        if (errorNode) errorNode.textContent = message || "";
    }

    function nextPage() {
        var raw = "";
        try { raw = new URLSearchParams(location.search).get("next") || ""; } catch (error) { raw = ""; }
        return /^[a-z0-9-]+\.html$/.test(raw) ? raw : "profile.html";
    }

    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) {
            say("服务器未连接。注册、登录和找回密码需要先在本机启动 Node 服务。页面本身没有坏。");
            Array.prototype.forEach.call(form.querySelectorAll("button"), function (button) {
                button.disabled = true;
            });
            return;
        }
        if (SuanjingAPI.state.user && page !== "forgot") {
            location.href = nextPage();
            return;
        }
        if (page === "login" && location.search.indexOf("reset=1") !== -1) {
            say("密码已更新，请用新密码登录。");
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        say("");
        if (!SuanjingAPI.state.online) {
            say("服务器未连接，暂时不能提交。");
            return;
        }
        var data = {};
        Array.prototype.forEach.call(form.elements, function (field) {
            if (field.name) data[field.name] = field.value.trim();
        });
        var path = page === "register" ? "auth/register" : "auth/login";
        if (page === "forgot") path = form.getAttribute("data-step") === "reset" ? "auth/forgot/reset" : "auth/forgot/question";
        SuanjingAPI.request(path, { method: "POST", body: data }).then(function (result) {
            if (page === "forgot" && form.getAttribute("data-step") !== "reset") {
                document.getElementById("questionText").textContent = result.question;
                document.getElementById("resetFields").hidden = false;
                form.setAttribute("data-step", "reset");
                say("请回答密保问题，并设置新密码。");
                return;
            }
            if (page === "forgot") {
                location.href = "login.html?reset=1";
                return;
            }
            location.href = nextPage();
        }).catch(function (error) {
            say(error.message);
        });
    });
})();

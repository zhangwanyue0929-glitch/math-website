/**
 * 留言板只公开已通过的留言。
 * 新留言先进入待审核，避免游客直接把内容写到首页上。
 */
(function () {
    var list = document.getElementById("messageList");
    var pager = document.getElementById("messagePager");
    var notice = document.getElementById("boardNotice");
    var form = document.getElementById("messageForm");
    var errorNode = document.getElementById("formError");
    if (!list) return;
    var page = 1;

    function load() {
        SuanjingAPI.request("messages?page=" + page + "&pageSize=5").then(function (data) {
            SuanjingUI.clear(list);
            if (!data.items.length) list.appendChild(SuanjingUI.el("p", "", "还没有公开的留言。"));
            data.items.forEach(function (item) {
                var card = SuanjingUI.el("article", "message-card");
                card.appendChild(SuanjingUI.el("h3", "", item.author));
                card.appendChild(SuanjingUI.el("p", "", item.content));
                if (item.reply) card.appendChild(SuanjingUI.el("p", "", "馆方回复：" + item.reply));
                card.appendChild(SuanjingUI.el("p", "help", SuanjingUI.formatTime(item.createdAt)));
                list.appendChild(card);
            });
            SuanjingUI.pager(pager, data.page, data.totalPages, function (next) {
                page = next;
                load();
            });
        }).catch(function (error) {
            SuanjingUI.offlineNotice(notice, error.message);
        });
    }

    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) {
            SuanjingUI.offlineNotice(notice, "留言板需要连接本馆服务器。当前没有后端，所以不能读取或发表留言。其他展陈页面仍可离线阅读。");
            if (form) form.hidden = true;
            return;
        }
        if (!SuanjingAPI.state.user) {
            SuanjingUI.offlineNotice(notice, "浏览留言不需要登录。发表留言请先登录，提交后由管理员审核。");
            if (form) form.hidden = true;
        } else {
            SuanjingUI.offlineNotice(notice, "你正在以 " + SuanjingAPI.state.user.username + " 的身份留言。公开前需要管理员通过。");
        }
        load();
    });

    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            errorNode.textContent = "";
            if (!SuanjingAPI.state.online) {
                errorNode.textContent = "服务器未连接，暂时不能留言。";
                return;
            }
            SuanjingAPI.request("messages", {
                method: "POST",
                body: { content: document.getElementById("messageContent").value.trim() }
            }).then(function (data) {
                form.reset();
                errorNode.textContent = data.notice || "已提交。";
            }).catch(function (error) {
                errorNode.textContent = error.message;
            });
        });
    }
})();

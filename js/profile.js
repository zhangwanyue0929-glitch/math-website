/**
 * 个人中心：收藏、自己的留言、浏览记录。
 * 三个列表都向服务器分页读取，不在浏览器里保存一份副本。
 */
(function () {
    var notice = document.getElementById("profileNotice");
    var panels = {
        fav: { path: "favourites", node: document.getElementById("panel-fav"), page: 1 },
        msg: { path: "me/messages", node: document.getElementById("panel-msg"), page: 1 },
        rec: { path: "records", node: document.getElementById("panel-rec"), page: 1 }
    };

    function show(name) {
        Object.keys(panels).forEach(function (key) {
            var panel = panels[key].node;
            if (panel) panel.hidden = key !== name;
            var tab = document.querySelector("[data-tab='" + key + "']");
            if (tab) tab.setAttribute("aria-selected", key === name ? "true" : "false");
        });
    }

    function draw(key, data) {
        var panel = panels[key].node;
        SuanjingUI.clear(panel);
        var list = SuanjingUI.el("div", "card-list");
        if (!data.items.length) list.appendChild(SuanjingUI.el("p", "", "这里还没有内容。"));
        data.items.forEach(function (item) {
            if (key === "msg") {
                var card = SuanjingUI.el("article", "message-card");
                card.appendChild(SuanjingUI.el("span", "tag", SuanjingUI.statusLabel[item.status] || item.status));
                card.appendChild(SuanjingUI.el("p", "", item.content));
                if (item.reply) card.appendChild(SuanjingUI.el("p", "", "馆方回复：" + item.reply));
                card.appendChild(SuanjingUI.el("p", "help", SuanjingUI.formatTime(item.createdAt)));
                list.appendChild(card);
                return;
            }
            var link = document.createElement("a");
            link.className = "record-card";
            link.href = item.pageUrl || "catalog.html";
            link.appendChild(SuanjingUI.el("span", "tag", SuanjingUI.kindLabel[item.kind] || ""));
            link.appendChild(SuanjingUI.el("h2", "", item.title));
            var when = key === "fav" ? item.favouredAt : item.visitedAt;
            link.appendChild(SuanjingUI.el("p", "help", SuanjingUI.formatTime(when)));
            list.appendChild(link);
        });
        panel.appendChild(list);
        var pager = SuanjingUI.el("div", "pager");
        SuanjingUI.pager(pager, data.page, data.totalPages, function (next) {
            panels[key].page = next;
            load(key);
        });
        panel.appendChild(pager);
    }

    function load(key) {
        var panel = panels[key];
        SuanjingAPI.request(panel.path + "?page=" + panel.page + "&pageSize=6").then(function (data) {
            draw(key, data);
        }).catch(function (error) {
            SuanjingUI.clear(panel.node);
            panel.node.appendChild(SuanjingUI.el("p", "", error.message));
        });
    }

    document.getElementById("profileTabs").addEventListener("click", function (event) {
        var tab = event.target.closest("[data-tab]");
        if (!tab) return;
        show(tab.getAttribute("data-tab"));
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
        SuanjingAPI.request("auth/logout", { method: "POST", body: {} }).then(function () {
            location.href = "index.html";
        }).catch(function (error) {
            SuanjingUI.offlineNotice(notice, error.message);
        });
    });

    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) {
            SuanjingUI.offlineNotice(notice, "个人中心需要连接本馆服务器。离线时没有收藏、留言和浏览记录可以读取。");
            return;
        }
        if (!SuanjingAPI.state.user) {
            location.href = "login.html?next=profile.html";
            return;
        }
        var user = SuanjingAPI.state.user;
        document.getElementById("who").textContent = user.username + " · " + (user.role === "ADMIN" ? "管理员" : "访客");
        if (user.role === "ADMIN") document.getElementById("adminLink").hidden = false;
        show("fav");
        load("fav");
        load("msg");
        load("rec");
    });
})();

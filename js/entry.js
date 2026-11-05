/**
 * 二级页面的同步。
 * 服务器开着：用数据库里的展签替换静态文字，并记录一次浏览。
 * 服务器没开：页面上已经写好的文字继续可读，收藏按钮会说明原因。
 */
(function () {
    var article = document.querySelector("[data-entry]");
    var status = document.getElementById("entryStatus");
    if (!article || !window.SuanjingAPI) return;

    function setText(field, value) {
        var node = article.querySelector("[data-field='" + field + "']");
        if (!node || value == null) return;
        if (node.getAttribute("data-multiline") === "1") {
            SuanjingUI.clear(node);
            String(value).split(/\n+/).forEach(function (part) {
                if (!part.trim()) return;
                node.appendChild(SuanjingUI.el("p", "", part.trim()));
            });
            return;
        }
        node.textContent = value;
    }

    function apply(item) {
        setText("title", item.title);
        setText("subtitle", item.subtitle);
        setText("summary", item.summary);
        setText("sourceNote", item.sourceNote);
        setText("sourceText", item.sourceText);
        setText("modernText", item.modernText);
        setText("demoNote", item.demoNote);
        setText("imageCaption", item.imageCaption);
        var image = article.querySelector("[data-field-src='imageUrl']");
        if (image && item.imageUrl) {
            image.setAttribute("src", item.imageUrl);
            image.setAttribute("alt", item.title || "");
        }
        var link = article.querySelector("[data-field-href='demoHref']");
        if (link && item.demoHref) link.setAttribute("href", item.demoHref);
        var list = article.querySelector("[data-field-list='points']");
        if (list && item.points) {
            SuanjingUI.clear(list);
            String(item.points).split(/\n/).forEach(function (part) {
                if (!part.trim()) return;
                list.appendChild(SuanjingUI.el("li", "", part.trim()));
            });
        }
    }

    function bindFavourite(online) {
        var button = document.getElementById("favBtn");
        if (!button) return;
        if (!online) {
            button.addEventListener("click", function () {
                SuanjingUI.offlineNotice(status, "收藏需要连接本馆服务器。当前显示的是随网页发布的静态展陈，阅读不受影响。");
            });
            return;
        }
        var kind = article.getAttribute("data-kind");
        var slug = article.getAttribute("data-slug");
        function paint(favoured) {
            button.textContent = favoured ? "已收藏" : "收藏此页";
            button.setAttribute("aria-pressed", favoured ? "true" : "false");
        }
        if (!SuanjingAPI.state.user) {
            button.addEventListener("click", function () {
                var file = location.pathname.split("/").pop() || "index.html";
                location.href = "login.html?next=" + encodeURIComponent(file);
            });
            return;
        }
        SuanjingAPI.request("favourites/check?kind=" + encodeURIComponent(kind) + "&slug=" + encodeURIComponent(slug))
            .then(function (data) { paint(data.favoured); })
            .catch(function () { paint(false); });
        button.addEventListener("click", function () {
            SuanjingAPI.request("favourites", { method: "POST", body: { kind: kind, slug: slug } })
                .then(function (data) { paint(data.favoured); })
                .catch(function (error) {
                    SuanjingUI.offlineNotice(status, error.message);
                });
        });
    }

    SuanjingAPI.ready.then(function () {
        bindFavourite(SuanjingAPI.state.online);
        if (!SuanjingAPI.state.online) {
            SuanjingUI.offlineNotice(status, "服务器未连接。本页展示随网站发布的静态展陈，阅读不受影响。");
            return;
        }
        var kind = article.getAttribute("data-kind");
        var slug = article.getAttribute("data-slug");
        SuanjingAPI.request("content/" + kind + "/" + slug).then(function (data) {
            apply(data.item);
            SuanjingUI.offlineNotice(status, "已连接服务器，展签以数据库中的文字为准。");
        }).catch(function () {
            SuanjingUI.offlineNotice(status, "数据库里没有这条已发布展项，仍显示页面上的静态文字。");
        });
        if (SuanjingAPI.state.user) {
            SuanjingAPI.request("records", { method: "POST", body: { kind: kind, slug: slug } }).catch(function () {});
        }
    });
})();

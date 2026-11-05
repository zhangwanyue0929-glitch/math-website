/**
 * 后台新建、还没有静态 html 的展项，从这里按编号打开。
 * 没有服务器时不编造内容，只说明原因。
 */
(function () {
    var article = document.getElementById("dynamicArticle");
    var status = document.getElementById("entryStatus");
    var params;
    try { params = new URLSearchParams(location.search); } catch (error) { params = null; }
    var kind = params ? (params.get("kind") || "") : "";
    var slug = params ? (params.get("slug") || "") : "";

    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) {
            SuanjingUI.offlineNotice(status, "这条展项要连接服务器才能打开。已经做好静态页面的专题，可以从馆藏目录进入。");
            return;
        }
        if (!/^[a-z]+$/.test(kind) || !/^[a-z0-9-]{1,40}$/.test(slug)) {
            SuanjingUI.offlineNotice(status, "链接不完整。");
            return;
        }
        SuanjingAPI.request("content/" + kind + "/" + slug).then(function (data) {
            var item = data.item;
            article.hidden = false;
            article.setAttribute("data-kind", kind);
            article.setAttribute("data-slug", slug);
            document.getElementById("d-title").textContent = item.title;
            document.getElementById("d-sub").textContent = item.subtitle;
            document.getElementById("d-summary").textContent = item.summary;
            document.getElementById("d-source-note").textContent = item.sourceNote;
            document.getElementById("d-source").textContent = item.sourceText;
            SuanjingUI.clear(document.getElementById("d-modern"));
            String(item.modernText || "").split(/\n+/).forEach(function (part) {
                if (part.trim()) document.getElementById("d-modern").appendChild(SuanjingUI.el("p", "", part.trim()));
            });
            document.getElementById("d-demo").textContent = item.demoNote;
            var list = document.getElementById("d-points");
            SuanjingUI.clear(list);
            String(item.points || "").split(/\n/).forEach(function (part) {
                if (part.trim()) list.appendChild(SuanjingUI.el("li", "", part.trim()));
            });
            var image = document.getElementById("d-image");
            if (item.imageUrl) {
                image.hidden = false;
                image.src = item.imageUrl;
                image.alt = item.title;
            }
            SuanjingUI.offlineNotice(status, "这条展项来自数据库。");
        }).catch(function (error) {
            SuanjingUI.offlineNotice(status, error.message);
        });
    });
})();

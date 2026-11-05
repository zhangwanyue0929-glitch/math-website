/**
 * 馆藏目录。
 * 服务器可用时按数据库分页；不可用时用 content-data.js 在浏览器里分页。
 * 两种做法的翻页按钮一样，方便对照“动态分页”和“静态保底”。
 */
(function () {
    var list = document.getElementById("catalogList");
    var pager = document.getElementById("catalogPager");
    var notice = document.getElementById("catalogNotice");
    var form = document.getElementById("catalogFilter");
    if (!list || !window.SUANJING_CONTENT) return;

    var page = 1;
    var pageSize = 6;
    var online = false;

    function kindName(kind) {
        return SuanjingUI.kindLabel[kind] || kind;
    }

    function card(item) {
        var link = document.createElement("a");
        link.className = "catalog-card";
        link.href = item.pageUrl || ("entry.html?kind=" + item.kind.toLowerCase() + "&slug=" + item.slug);
        link.appendChild(SuanjingUI.el("span", "tag", kindName(item.kind)));
        link.appendChild(SuanjingUI.el("h2", "", item.title));
        link.appendChild(SuanjingUI.el("p", "", item.summary));
        return link;
    }

    function render(items, totalPages) {
        SuanjingUI.clear(list);
        if (!items.length) {
            list.appendChild(SuanjingUI.el("p", "", "没有符合条件的展项。"));
        }
        items.forEach(function (item) { list.appendChild(card(item)); });
        SuanjingUI.pager(pager, page, totalPages, function (next) {
            page = next;
            load();
        });
    }

    function filters() {
        return {
            kind: document.getElementById("kindFilter").value,
            q: document.getElementById("qFilter").value.trim()
        };
    }

    function loadLocal() {
        var chosen = filters();
        var items = window.SUANJING_CONTENT.items.filter(function (item) {
            if (chosen.kind && item.kind !== chosen.kind) return false;
            if (chosen.q && item.title.indexOf(chosen.q) === -1) return false;
            return true;
        });
        var totalPages = Math.max(1, Math.ceil(items.length / pageSize));
        if (page > totalPages) page = totalPages;
        render(items.slice((page - 1) * pageSize, page * pageSize), totalPages);
    }

    function load() {
        if (!online) {
            loadLocal();
            return;
        }
        var chosen = filters();
        var path = "content?page=" + page + "&pageSize=" + pageSize;
        if (chosen.kind) path += "&kind=" + encodeURIComponent(chosen.kind.toLowerCase());
        if (chosen.q) path += "&q=" + encodeURIComponent(chosen.q);
        SuanjingAPI.request(path).then(function (data) {
            if (page > data.totalPages) {
                page = data.totalPages;
                load();
                return;
            }
            render(data.items, data.totalPages);
        }).catch(function () {
            online = false;
            SuanjingUI.offlineNotice(notice, "目录接口暂时不可用，已改回静态分页。");
            loadLocal();
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        page = 1;
        load();
    });

    SuanjingAPI.ready.then(function () {
        online = SuanjingAPI.state.online;
        SuanjingUI.offlineNotice(notice, online
            ? "当前按数据库分页。后台修改展项后，刷新即可看到新文字。"
            : "服务器未连接。下面按随网站发布的静态目录分页，阅读不受影响。");
        load();
    });
})();

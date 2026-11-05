/**
 * 几个页面都要用的小工具。
 * 插入文字一律用 textContent，留言和展项说明都不会被当成 HTML 执行。
 */
(function (global) {
    function clear(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function formatTime(value) {
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        function pad(number) { return number < 10 ? "0" + number : String(number); }
        return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
            + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
    }

    var kindLabel = {
        MATHEMATICIAN: "数学家",
        CLASSIC: "典籍",
        ERA: "分期",
        EXHIBIT: "互动展项"
    };

    var statusLabel = {
        PENDING: "待审核",
        APPROVED: "已公开",
        REJECTED: "未通过"
    };

    function pager(container, page, totalPages, onPage) {
        clear(container);
        var prev = el("button", "", "上一页");
        prev.type = "button";
        prev.disabled = page <= 1;
        prev.addEventListener("click", function () { onPage(page - 1); });
        var label = el("span", "", "第 " + page + " / " + totalPages + " 页");
        var next = el("button", "", "下一页");
        next.type = "button";
        next.disabled = page >= totalPages;
        next.addEventListener("click", function () { onPage(page + 1); });
        container.appendChild(prev);
        container.appendChild(label);
        container.appendChild(next);
    }

    function offlineNotice(node, message) {
        if (!node) return;
        node.hidden = false;
        node.textContent = message;
    }

    global.SuanjingUI = {
        clear: clear,
        el: el,
        formatTime: formatTime,
        kindLabel: kindLabel,
        statusLabel: statusLabel,
        pager: pager,
        offlineNotice: offlineNotice
    };
})(window);

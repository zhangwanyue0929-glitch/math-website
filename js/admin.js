/**
 * 四个后台页面共用。
 * 普通访客打不开数据；服务器没开时只显示说明，不出现空白报错。
 */
(function () {
    var page = document.body.getAttribute("data-admin");
    var notice = document.getElementById("adminNotice");
    if (!page) return;

    function guard() {
        if (!SuanjingAPI.state.online) {
            SuanjingUI.offlineNotice(notice, "后台需要连接本馆服务器。请先按运行说明启动 MySQL 和 Node。");
            return false;
        }
        if (!SuanjingAPI.state.user || SuanjingAPI.state.user.role !== "ADMIN") {
            SuanjingUI.offlineNotice(notice, "需要管理员账号。请用运行说明里的管理员登录。");
            return false;
        }
        return true;
    }

    function bootContent() {
        var pageNo = 1;
        var list = document.getElementById("contentTable");
        var form = document.getElementById("contentForm");
        var editing = document.getElementById("editingId");

        function fill(item) {
            editing.value = item ? String(item.id) : "";
            ["kind", "slug", "title", "subtitle", "summary", "sourceNote", "sourceText", "modernText", "demoNote", "imageUrl", "imageCaption", "demoHref", "pageUrl", "points", "diagram", "sortOrder"].forEach(function (name) {
                var field = form.elements[name];
                if (!field) return;
                if (!item) {
                    field.value = name === "kind" ? "exhibit" : "";
                    return;
                }
                field.value = name === "kind" ? item.kind.toLowerCase() : (item[name] == null ? "" : item[name]);
            });
            form.elements.published.checked = item ? item.published : true;
        }

        function load() {
            var kind = document.getElementById("adminKind").value;
            var path = "admin/content?page=" + pageNo + "&pageSize=6";
            if (kind) path += "&kind=" + encodeURIComponent(kind);
            SuanjingAPI.request(path).then(function (data) {
                var body = list.querySelector("tbody");
                SuanjingUI.clear(body);
                data.items.forEach(function (item) {
                    var row = document.createElement("tr");
                    [SuanjingUI.kindLabel[item.kind] || item.kind, item.title, item.published ? "公开" : "隐藏"].forEach(function (text) {
                        row.appendChild(SuanjingUI.el("td", "", text));
                    });
                    var cell = document.createElement("td");
                    var button = SuanjingUI.el("button", "small-btn", "编辑");
                    button.type = "button";
                    button.addEventListener("click", function () { fill(item); });
                    cell.appendChild(button);
                    row.appendChild(cell);
                    body.appendChild(row);
                });
                SuanjingUI.pager(document.getElementById("contentPager"), data.page, data.totalPages, function (next) {
                    pageNo = next;
                    load();
                });
            }).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
        }

        document.getElementById("adminKind").addEventListener("change", function () {
            pageNo = 1;
            load();
        });
        document.getElementById("newContent").addEventListener("click", function () { fill(null); });
        document.getElementById("uploadBtn").addEventListener("click", function () {
            var file = document.getElementById("imageFile").files[0];
            if (!file) return;
            var body = new FormData();
            body.append("file", file);
            fetch(SuanjingAPI.base + "/admin/upload", {
                method: "POST",
                headers: { "X-CSRF-Token": SuanjingAPI.state.csrf },
                body: body,
                credentials: "same-origin"
            }).then(function (res) {
                return res.json().then(function (data) {
                    if (!res.ok) throw new Error(data.error || "上传失败");
                    form.elements.imageUrl.value = data.url;
                });
            }).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
        });
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var payload = {};
            ["kind", "slug", "title", "subtitle", "summary", "sourceNote", "sourceText", "modernText", "demoNote", "imageUrl", "imageCaption", "demoHref", "pageUrl", "points", "diagram", "sortOrder"].forEach(function (name) {
                payload[name] = form.elements[name].value.trim();
            });
            payload.published = form.elements.published.checked;
            payload.sortOrder = Number(payload.sortOrder || 0);
            var id = editing.value;
            var path = id ? "admin/content/" + id : "admin/content";
            SuanjingAPI.request(path, { method: id ? "PUT" : "POST", body: payload }).then(function () {
                SuanjingUI.offlineNotice(notice, id ? "展项已保存。" : "展项已创建。");
                load();
            }).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
        });
        fill(null);
        load();
    }

    function bootMessages() {
        var pageNo = 1;
        function load() {
            var status = document.getElementById("messageStatus").value;
            var path = "admin/messages?page=" + pageNo + "&pageSize=6";
            if (status) path += "&status=" + encodeURIComponent(status);
            SuanjingAPI.request(path).then(function (data) {
                var box = document.getElementById("moderationList");
                SuanjingUI.clear(box);
                if (!data.items.length) box.appendChild(SuanjingUI.el("p", "", "这一页没有留言。"));
                data.items.forEach(function (item) {
                    var card = SuanjingUI.el("article", "message-card");
                    card.appendChild(SuanjingUI.el("span", "tag", (SuanjingUI.statusLabel[item.status] || item.status) + " · " + item.author));
                    card.appendChild(SuanjingUI.el("p", "", item.content));
                    var reply = document.createElement("textarea");
                    reply.value = item.reply || "";
                    reply.maxLength = 300;
                    card.appendChild(reply);
                    var actions = SuanjingUI.el("div", "inline-actions");
                    [["APPROVED", "通过"], ["REJECTED", "退回"], ["PENDING", "改回待审"]].forEach(function (pair) {
                        var button = SuanjingUI.el("button", "small-btn", pair[1]);
                        button.type = "button";
                        button.addEventListener("click", function () {
                            SuanjingAPI.request("admin/messages/" + item.id + "/moderate", {
                                method: "POST",
                                body: { status: pair[0], reply: reply.value.trim() }
                            }).then(load).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
                        });
                        actions.appendChild(button);
                    });
                    card.appendChild(actions);
                    box.appendChild(card);
                });
                SuanjingUI.pager(document.getElementById("messagePager"), data.page, data.totalPages, function (next) {
                    pageNo = next;
                    load();
                });
            }).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
        }
        document.getElementById("messageStatus").addEventListener("change", function () {
            pageNo = 1;
            load();
        });
        load();
    }

    function bootUsers() {
        var pageNo = 1;
        function load() {
            var q = document.getElementById("userQuery").value.trim();
            var path = "admin/users?page=" + pageNo + "&pageSize=8";
            if (q) path += "&q=" + encodeURIComponent(q);
            SuanjingAPI.request(path).then(function (data) {
                var body = document.querySelector("#userTable tbody");
                SuanjingUI.clear(body);
                data.items.forEach(function (user) {
                    var row = document.createElement("tr");
                    [user.username, user.email, user.role === "ADMIN" ? "管理员" : "用户", user.disabled ? "停用" : "正常"].forEach(function (text) {
                        row.appendChild(SuanjingUI.el("td", "", text));
                    });
                    var cell = document.createElement("td");
                    var actions = SuanjingUI.el("div", "inline-actions");
                    function act(label, payload) {
                        var button = SuanjingUI.el("button", "small-btn", label);
                        button.type = "button";
                        button.addEventListener("click", function () {
                            SuanjingAPI.request("admin/users/" + user.id, { method: "PATCH", body: payload })
                                .then(load)
                                .catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
                        });
                        actions.appendChild(button);
                    }
                    act(user.role === "ADMIN" ? "降为用户" : "设为管理员", { role: user.role === "ADMIN" ? "USER" : "ADMIN" });
                    act(user.disabled ? "启用" : "停用", { disabled: !user.disabled });
                    cell.appendChild(actions);
                    row.appendChild(cell);
                    body.appendChild(row);
                });
                SuanjingUI.pager(document.getElementById("userPager"), data.page, data.totalPages, function (next) {
                    pageNo = next;
                    load();
                });
            }).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
        }
        document.getElementById("userSearch").addEventListener("submit", function (event) {
            event.preventDefault();
            pageNo = 1;
            load();
        });
        load();
    }

    function bootSurvey() {
        SuanjingAPI.request("admin/survey").then(function (data) {
            var box = document.getElementById("surveyAdmin");
            SuanjingUI.clear(box);
            data.questions.forEach(function (question) {
                var card = SuanjingUI.el("article", "message-card");
                card.appendChild(SuanjingUI.el("h3", "", "第 " + question.id + " 题 · " + question.total + " 份回答"));
                var prompt = document.createElement("textarea");
                prompt.value = question.prompt;
                var options = document.createElement("textarea");
                options.value = question.options.join("\n");
                card.appendChild(prompt);
                card.appendChild(options);
                question.options.forEach(function (option) {
                    var count = question.counts[option] || 0;
                    card.appendChild(SuanjingUI.el("p", "", option + "：" + count));
                });
                var button = SuanjingUI.el("button", "btn", "保存题目");
                button.type = "button";
                button.addEventListener("click", function () {
                    SuanjingAPI.request("admin/survey/" + question.id, {
                        method: "PUT",
                        body: { prompt: prompt.value.trim(), options: options.value }
                    }).then(function () {
                        SuanjingUI.offlineNotice(notice, "题目已保存。已有答卷仍按原选项计数。");
                        bootSurvey();
                    }).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
                });
                card.appendChild(button);
                box.appendChild(card);
            });
        }).catch(function (error) { SuanjingUI.offlineNotice(notice, error.message); });
    }

    SuanjingAPI.ready.then(function () {
        if (!guard()) return;
        if (page === "content") bootContent();
        if (page === "messages") bootMessages();
        if (page === "users") bootUsers();
        if (page === "survey") bootSurvey();
    });
})();

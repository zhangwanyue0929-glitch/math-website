/**
 * 本地接口自测。先另开一个终端运行 npm start，再执行 node scripts/smoke.js。
 * 会注册一个临时用户，不删除数据库里的展项。
 */
const base = process.env.BASE || "http://127.0.0.1:3000";
let cookie = "";

function storeCookies(res) {
    const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    list.forEach(function (line) {
        const pair = line.split(";")[0];
        const name = pair.split("=")[0];
        const parts = cookie.split("; ").filter(Boolean).filter(function (item) {
            return item.slice(0, name.length + 1) !== name + "=";
        });
        parts.push(pair);
        cookie = parts.join("; ");
    });
}

async function api(path, options) {
    options = options || {};
    const headers = Object.assign({ Accept: "application/json" }, options.headers || {});
    if (cookie) headers.Cookie = cookie;
    if (options.body) headers["Content-Type"] = "application/json";
    if (options.csrf) headers["X-CSRF-Token"] = options.csrf;
    const res = await fetch(base + path, {
        method: options.method || "GET",
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    storeCookies(res);
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
        const error = new Error(path + " -> " + res.status + " " + (data.error || ""));
        error.status = res.status;
        error.data = data;
        throw error;
    }
    return data;
}

async function main() {
    const stamp = String(Date.now()).slice(-8);
    const username = "u" + stamp;
    const password = "Pass" + stamp + "a";
    const health = await api("/api/health");
    if (!health.ok) throw new Error("health");
    let csrf = (await api("/api/csrf")).csrfToken;

    await api("/api/auth/register", {
        method: "POST",
        csrf: csrf,
        body: {
            username: username,
            email: username + "@example.com",
            password: password,
            securityQuestion: "馆名是什么",
            securityAnswer: "算经千年"
        }
    }).then(function (data) { csrf = data.csrfToken; });

    const me = await api("/api/auth/me");
    if (!me.user || me.user.username !== username) throw new Error("登录状态没有保持");

    await api("/api/auth/logout", { method: "POST", csrf: csrf, body: {} });
    csrf = (await api("/api/csrf")).csrfToken;
    const question = await api("/api/auth/forgot/question", {
        method: "POST",
        csrf: csrf,
        body: { username: username }
    });
    if (!question.question) throw new Error("没有返回密保问题");
    const nextPassword = password + "9";
    await api("/api/auth/forgot/reset", {
        method: "POST",
        csrf: csrf,
        body: { username: username, answer: "算经千年", newPassword: nextPassword }
    });
    const login = await api("/api/auth/login", {
        method: "POST",
        csrf: csrf,
        body: { username: username, password: nextPassword }
    });
    csrf = login.csrfToken;

    const posted = await api("/api/messages", {
        method: "POST",
        csrf: csrf,
        body: { content: "<script>alert(1)</script>这条留言用来测试审核" }
    });
    if (posted.message.content.indexOf("<") !== -1) throw new Error("留言里仍有标签");

    const fav = await api("/api/favourites", {
        method: "POST",
        csrf: csrf,
        body: { kind: "mathematician", slug: "liuhui" }
    });
    if (!fav.favoured) throw new Error("收藏失败");
    await api("/api/records", { method: "POST", csrf: csrf, body: { kind: "classic", slug: "jiuzhang" } });

    const survey = await api("/api/survey");
    await api("/api/survey", {
        method: "POST",
        csrf: csrf,
        body: {
            answers: survey.questions.map(function (question) {
                return { questionId: question.id, choice: question.options[0] };
            })
        }
    });

    await api("/api/auth/logout", { method: "POST", csrf: csrf, body: {} });
    csrf = (await api("/api/csrf")).csrfToken;
    const admin = await api("/api/auth/login", {
        method: "POST",
        csrf: csrf,
        body: {
            username: process.env.SEED_ADMIN_USERNAME || "admin",
            password: process.env.SEED_ADMIN_PASSWORD || "Suanjing-Admin-2026"
        }
    });
    csrf = admin.csrfToken;
    if (admin.user.role !== "ADMIN") throw new Error("管理员角色不对");

    const pending = await api("/api/admin/messages?status=PENDING&pageSize=20");
    const mine = pending.items.filter(function (item) { return item.author === username; })[0];
    if (!mine) throw new Error("待审核留言不在后台");
    await api("/api/admin/messages/" + mine.id + "/moderate", {
        method: "POST",
        csrf: csrf,
        body: { status: "APPROVED", reply: "已收到。" }
    });
    const board = await api("/api/messages?pageSize=20");
    if (!board.items.some(function (item) { return item.author === username && item.reply === "已收到。"; })) {
        throw new Error("公开留言板没有这条已通过的留言");
    }

    const catalog = await api("/api/content?page=1&pageSize=6");
    if (catalog.total < 15 || catalog.totalPages < 2) throw new Error("分页数据不够");
    const page2 = await api("/api/content?page=2&pageSize=6");
    if (page2.items[0].id === catalog.items[0].id) throw new Error("两页内容没有分开");

    const editable = await api("/api/content/mathematician/liuhui");
    const original = editable.item.summary;
    await api("/api/admin/content/" + editable.item.id, {
        method: "PUT",
        csrf: csrf,
        body: Object.assign({}, editable.item, {
            kind: "mathematician",
            summary: original + "（自测标记）"
        })
    });
    const changed = await api("/api/content/mathematician/liuhui");
    if (changed.item.summary.indexOf("自测标记") === -1) throw new Error("展项没有更新");
    await api("/api/admin/content/" + editable.item.id, {
        method: "PUT",
        csrf: csrf,
        body: Object.assign({}, editable.item, { kind: "mathematician", summary: original })
    });

    const users = await api("/api/admin/users?q=" + username);
    if (!users.items.some(function (item) { return item.username === username; })) throw new Error("用户列表没有新用户");

    let rejected = false;
    try {
        await api("/api/auth/register", {
            method: "POST",
            csrf: csrf,
            body: { username: "' OR 1=1 --", email: "a@b.c", password: "abcdefg1", securityQuestion: "问题一", securityAnswer: "答案" }
        });
    } catch (error) {
        rejected = error.status === 400;
    }
    if (!rejected) throw new Error("非法用户名没有被拒绝");

    console.log("自测通过。临时用户：" + username);
}

main().catch(function (error) {
    console.error(error);
    process.exit(1);
});

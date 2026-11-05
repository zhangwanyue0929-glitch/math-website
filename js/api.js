/**
 * 和本馆服务器说话的唯一入口。
 * 地址用相对路径 api/...，这样：
 *   Node 打开 http://localhost:3000 时，请求打到本机接口；
 *   GitHub Pages 打开子路径时，请求打到 Pages 上并不存在的 api，失败后改用静态内容。
 * 需要登录的页面要自己提示“服务器未连接”，不要把按钮点成报错。
 */
(function (global) {
    var meta = document.querySelector("meta[name='suanjing-api']");
    var base = (meta && meta.getAttribute("content")) || "api";
    var state = {
        online: false,
        checked: false,
        user: null,
        csrf: ""
    };

    function applySession(data) {
        if (data && data.csrfToken !== undefined) state.csrf = data.csrfToken;
        if (data && data.user !== undefined) state.user = data.user;
        return data;
    }

    function request(path, options) {
        options = options || {};
        var headers = { Accept: "application/json" };
        var method = options.method || "GET";
        var body;
        if (options.body !== undefined) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(options.body);
        }
        if (method !== "GET" && method !== "HEAD" && state.csrf) {
            headers["X-CSRF-Token"] = state.csrf;
        }
        return fetch(base + "/" + path, {
            method: method,
            headers: headers,
            body: body,
            credentials: "same-origin"
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) {
                    var error = new Error(data.error || "请求失败");
                    error.status = res.status;
                    error.data = data;
                    throw error;
                }
                return applySession(data);
            });
        });
    }

    function shouldTryApi() {
        var host = location.hostname || "";
        // 直接打开文件，或挂在 GitHub Pages 上时，不发探测请求。
        // 其他静态服务器会读到仓库里的 api/health，内容是 ok:false，也不会出现 404。
        if (location.protocol === "file:") return false;
        if (/\.github\.io$/.test(host) || host === "github.io") return false;
        return true;
    }

    function detect() {
        if (!shouldTryApi()) {
            state.online = false;
            state.checked = true;
            return Promise.resolve(state);
        }
        return fetch(base + "/health", { credentials: "same-origin" })
            .then(function (res) {
                if (!res.ok) throw new Error("offline");
                return res.json();
            })
            .then(function (data) {
                if (!data || data.ok !== true) throw new Error("offline");
                state.online = true;
                return request("csrf");
            })
            .then(function () {
                return request("auth/me").catch(function () {
                    state.user = null;
                });
            })
            .then(function () {
                state.checked = true;
                return state;
            })
            .catch(function () {
                state.online = false;
                state.checked = true;
                state.user = null;
                return state;
            });
    }

    global.SuanjingAPI = {
        base: base,
        state: state,
        request: request,
        ready: detect()
    };
})(window);

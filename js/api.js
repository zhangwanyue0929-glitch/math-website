/**
 * 数据接口预留。
 * 开题报告的第二阶段会接入 Node.js、Express 和 MySQL，
 * 做注册登录（含密码找回）、用户管理、留言板、问卷，以及内容分页。
 * 现在六个页面都读各自脚本里的静态数据，页面结构按“以后换成请求”来组织。
 * 网站会挂在 GitHub Pages 的子路径下，所以这里不要写以 / 开头的地址。
 */
(function (global) {
    global.SuanjingAPI = {
        base: "api",
        /**
         * 第二阶段在这里改成 fetch(this.base + "/" + path)。
         * 当前没有后端，调用会明确失败，页面不要在加载时调用它。
         */
        get: function (path) {
            return Promise.reject(new Error("后端尚未接入：" + path));
        }
    };
})(window);

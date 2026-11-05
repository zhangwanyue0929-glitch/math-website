require("./load-env");

if (!process.env.DATABASE_URL) {
    console.error("缺少 DATABASE_URL。请把 server/.env.example 复制为 server/.env。");
    process.exit(1);
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    console.error("SESSION_SECRET 至少需要 16 个字符。请查看 server/.env.example。");
    process.exit(1);
}

const { createApp } = require("./app");
const port = Number(process.env.PORT || 3000);
createApp().listen(port, function () {
    console.log("算经千年已启动： http://localhost:" + port);
});

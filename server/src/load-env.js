/**
 * 读取 server/.env。
 * 不额外依赖 dotenv，是为了让 Windows 上少装一个包，答辩时也少解释一个依赖。
 * 已经存在的环境变量优先，避免把系统里配好的数据库地址盖掉。
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", ".env");
if (fs.existsSync(file)) {
    fs.readFileSync(file, "utf8").split(/\r?\n/).forEach(function (line) {
        const text = line.trim();
        if (!text || text.startsWith("#")) return;
        const index = text.indexOf("=");
        if (index <= 0) return;
        const key = text.slice(0, index).trim();
        let value = text.slice(index + 1).trim();
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = value;
    });
}

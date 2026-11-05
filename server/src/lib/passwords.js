const bcrypt = require("bcryptjs");

const ROUNDS = 10;
// 用户不存在时也做一次比对，避免“有没有这个人”从响应速度里看出来。
const DUMMY_HASH = bcrypt.hashSync("not-a-real-answer", ROUNDS);

function hashText(value) {
    return bcrypt.hash(value, ROUNDS);
}

function checkText(value, hash) {
    return bcrypt.compare(value, hash);
}

module.exports = {
    hashText: hashText,
    checkText: checkText,
    DUMMY_HASH: DUMMY_HASH
};

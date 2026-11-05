/**
 * 用 Prisma 把 express-session 存进 MySQL 的 sessions 表。
 * 这样不另开一条 mysql2 连接，会话和业务数据走同一个库。
 * 接口是 express-session 规定的回调形式，所以这里没有改成 async。
 */
const { Store } = require("express-session");
const { prisma } = require("./db");

function expiresOf(sess) {
    const raw = sess && sess.cookie && sess.cookie.expires;
    const date = raw ? new Date(raw) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
    return Number.isNaN(date.getTime()) ? new Date(Date.now() + 7 * 24 * 3600 * 1000) : date;
}

class PrismaSessionStore extends Store {
    get(sid, callback) {
        prisma.session.findUnique({ where: { sid: sid } })
            .then(function (row) {
                if (!row) return callback(null, null);
                if (row.expiresAt.getTime() <= Date.now()) {
                    prisma.session.delete({ where: { sid: sid } }).catch(function () {});
                    return callback(null, null);
                }
                callback(null, JSON.parse(row.data));
            })
            .catch(callback);
    }

    set(sid, sess, callback) {
        const data = JSON.stringify(sess);
        const expiresAt = expiresOf(sess);
        prisma.session.upsert({
            where: { sid: sid },
            update: { data: data, expiresAt: expiresAt },
            create: { sid: sid, data: data, expiresAt: expiresAt }
        }).then(function () {
            callback(null);
        }).catch(callback);
    }

    destroy(sid, callback) {
        prisma.session.delete({ where: { sid: sid } })
            .catch(function () {})
            .then(function () {
                callback(null);
            });
    }

    touch(sid, sess, callback) {
        this.set(sid, sess, callback);
    }
}

module.exports = { PrismaSessionStore };

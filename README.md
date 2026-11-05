# 算经千年

中国古代数学文化数字博物馆。题目是「基于 HTML5 + Node.js 的中国古代数学文化数字博物馆设计与实现」。

仓库里同时有两套跑法：

- 只有网页文件时，用浏览器或 GitHub Pages 打开，展陈、算盘和华容道仍能使用。
- 本机装好 MySQL 和 Node 之后，注册登录、留言、调查、收藏和后台修改才可用。

## 页面一览

一级页面 6 个，沿用原来的效果图：首页、发展史、数学家、数学经典、算盘、华容道。

二级和业务页面继续增加，合计超过 15 个：

| 文件 | 作用 |
| --- | --- |
| `person-*.html` | 祖冲之、刘徽、杨辉、秦九韶、朱世杰、李冶 |
| `era-*.html` | 夏商周、汉代、魏晋、南北朝、宋元 |
| `classic-*.html` | 周髀算经、九章算术、海岛算经、数书九章、四元玉鉴 |
| `catalog.html` | 馆藏目录，每页 6 条 |
| `entry.html` | 后台新建、还没有静态页的展项 |
| `login.html` `register.html` `forgot.html` | 登录、注册、密保找回 |
| `profile.html` | 收藏、我的留言、浏览记录 |
| `board.html` | 留言板 |
| `survey.html` | 参观调查 |
| `admin.html` | 改展项文字和图片 |
| `admin-messages.html` | 审核留言 |
| `admin-users.html` | 用户和角色 |
| `admin-survey.html` | 调查汇总，也可改题目 |

每条展项都分成三块，不要混写：

- **史料原文**：传世文献里的句子，并写出处。书已失传、原文不宜编造时，直接说明边界。
- **现代释义**：用今天的话解释，并标明这不是古人的表述。
- **辅助演示**：算盘、华容道、SVG 图和滑块。这些是本馆做的，不是古籍插图。

李冶没有可靠写真，专题页用印章，不放一张想象出来的画像。华容道写明它是滑块游戏，不是算经题目。

## 目录

```text
index.html 等页面          浏览器直接打开的页面
css/  js/  assets/        样式、脚本和图片
js/content-data.js        静态底稿，GitHub Pages 用它保底
js/api.js                 探测服务器；连不上就走静态内容
server/src                Express 路由和会话
server/prisma             表结构、迁移和种子
server/uploads            后台上传的图片，数据库只存 media/文件名
server/.env.example       环境变量样本，真正的 .env 不要提交
```

前端不用 Vue、React 或其他打包框架。数学图形用 SVG，杨辉三角用页面上的数表，算盘和华容道用页面元素。后端是 Node.js 和 Express。数据在 MySQL 8，访问用 Prisma 5.22.0。登录状态放在 MySQL 的 `sessions` 表里，不放在浏览器的 localStorage。

## 在 Windows 上运行

下面以 Windows 10 或 11 为例。命令在「命令提示符」或 PowerShell 里执行。

### 1. 安装 Node.js

安装 Node.js 18 或更高版本。安装后新开一个终端，确认：

```bat
node -v
npm -v
```

### 2. 安装 MySQL 8

安装 MySQL Community Server 8.0，安装时记住 root 密码。服务要处于正在运行。用 MySQL 自带的命令行客户端，或 MySQL Workbench，执行：

```sql
CREATE DATABASE suanjing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'suanjing'@'localhost' IDENTIFIED BY 'suanjing_local';
GRANT ALL PRIVILEGES ON suanjing.* TO 'suanjing'@'localhost';
FLUSH PRIVILEGES;
```

如果自己改了数据库密码，后面 `.env` 里的 `DATABASE_URL` 要一起改。密码中若有 `@`、`#` 等符号，放进地址前要做 URL 编码。

### 3. 配置环境变量

在项目的 `server` 目录：

```bat
cd server
copy .env.example .env
```

`.env.example` 里的口令只给本机演示。公开部署前要改 `SESSION_SECRET`、数据库密码和 `SEED_ADMIN_PASSWORD`。`.env` 已在 `.gitignore` 里，不要提交。

### 4. 安装依赖、建表、写入初始数据

仍在 `server` 目录：

```bat
npm install
npx prisma migrate deploy
npm run seed
npm start
```

`npm install` 会生成 Prisma Client。`migrate deploy` 按 `prisma/migrations` 建表。`seed` 写入展项、五道调查题，以及下面这名管理员（仅当该用户名还不存在）。

看到「算经千年已启动： http://localhost:3000」后，用浏览器打开这个地址。

再次执行 `npm run seed` 不会盖掉已经改过的展项，也不会重置管理员密码。想恢复初始文字时，不要靠反复 seed；可以在后台改回去，或清空 `content_items` 后再 seed。

### 5. 本机默认管理员

| 项目 | 值 |
| --- | --- |
| 用户名 | `admin` |
| 密码 | `Suanjing-Admin-2026` |
| 邮箱 | `admin@suanjing.local` |
| 密保问题 | 本馆的馆名是什么 |
| 密保答案 | 算经千年 |

这是课程演示账号，不是可以放到公网上的密码。

普通访客从「注册」自己建账号。注册时要留密保。忘记密码时打开「找回密码」，回答密保后设置新密码。本系统不发邮件，因为实验室不一定有邮箱服务器。

### 6. 可选自测

服务已经启动时，另开一个终端：

```bat
cd server
node scripts/smoke.js
```

脚本会注册临时用户，并走一遍找回密码、留言审核、调查、收藏、分页和展项修改。

改完 `js/content-data.js` 后，如果还想重做静态二级页面：

```bat
cd server
npm run render-pages
```

已经写进数据库的文字不会因为这一步改变。

## 没有服务器时

GitHub Pages 地址是 `https://zhangwanyue0929-glitch.github.io/math-website/`。那里没有 Node，也没有 MySQL。

- 首页、发展史、人物、典籍、算盘、华容道和各二级页面仍可阅读。文字来自页面本身和 `js/content-data.js`。
- 登录、留言、调查、收藏、个人中心和后台会提示需要服务器，按钮不会把页面弄乱。
- 接口地址写成相对路径 `api/...`。不要改成以 `/` 开头的地址，否则项目站点的子路径会对错地方。
- 仓库里的 `api/health` 内容是 `{"ok":false}`。没有 Node 时，页面读到它就继续用静态文字，控制台也不会因为找不到接口而报错。Node 启动后，真正的健康检查优先返回 `ok: true`。GitHub Pages 的域名还会直接跳过探测。

本地想模拟这种状态，可以用任意静态文件服务器打开仓库根目录，不要启动 `npm start`。

## 安全上做了什么

答辩时可以按这几条讲，不必背框架名词：

- 密码和密保答案只存 bcrypt 摘要，数据库里看不到原文。
- 登录成功后更换会话编号。Cookie 是 HttpOnly，脚本读不到。
- 修改数据的请求要带会话里的 CSRF 令牌，放在请求头里。
- 查询通过 Prisma 传参数，不把用户输入拼进 SQL。用户名还有格式限制，`' OR 1=1` 这种字符串过不了检查。
- 留言和展项说明去掉标签，页面用 `textContent` 显示，不把用户的字当成 HTML。
- 互动演示的 SVG 结构写在前端文件里。后台只能改说明和图片地址，不能把一段 HTML 存进数据库再执行。
- 上传图片会看文件头，只收 jpg、png、gif、webp，最大 2MB，文件放在 `server/uploads`，页面通过 `/media/文件名` 访问。
- 管理接口先检查角色。不能停用最后一名管理员。
- 登录和注册有次数限制。密保答错多次会暂时拒绝。

## 浏览器

页面使用 HTML5、CSS Flexbox、Grid、媒体查询、SVG 和 `fetch`。这些是当前 Chrome、Firefox、Edge、Safari 都支持的写法，没有使用某一家浏览器的私有接口，也没有使用需要编译的前端框架。窄屏下导航收进菜单，算盘可以横向滑动。移动端至少看过首页、发展史、数学家、经典馆、算盘、留言和登录。

## 数据表

| 表 | 内容 |
| --- | --- |
| `users` | 账号、角色、密码摘要、密保摘要 |
| `sessions` | 服务端会话 |
| `content_items` | 展项文字、图片地址、是否公开 |
| `messages` | 留言和审核状态 |
| `survey_questions` `survey_answers` | 调查题目和每人一次的选择 |
| `favourites` | 收藏 |
| `visit_records` | 登录用户打开专题页的记录 |

图片文件不进这些表，表里只留相对路径。

/**
 * 发展史五个时间节点。
 * 文案集中在这个数组里，第二阶段可以改成请求 SuanjingAPI.get("eras")，
 * 下面的渲染函数不用改。
 */
(function () {
    var eras = {
        xia: {
            title: "夏商周",
            text: "商周时期已经用算筹记数，十进位值制开始萌芽。甲骨文和金文中的数字、历法推算，是中国数学的早期形态，也为后来的测量和历算准备了记数方法。"
        },
        han: {
            title: "汉代",
            text: "汉代《九章算术》形成，用方田、粟米、衰分、少广、商功、均输、盈不足、方程、勾股九类问题，把中国古代数学体系逐渐完善。《周髀算经》也在这一时期流传，勾股测量进入成书的传统。"
        },
        wei: {
            title: "魏晋",
            text: "刘徽为《九章算术》作注，用出入相补说明面积和体积，并提出割圆术：圆内接正多边形边数越多，周长就越接近圆周。数学开始从算法步骤走向可以复核的论证。"
        },
        nanbei: {
            title: "南北朝",
            text: "祖冲之在割圆术的基础上，算出圆周率在 3.1415926 与 3.1415927 之间，并撰《缀术》。他又编订《大明历》，把数学推进到历法计算里。祖暅还提出幂势既同则积不容异，后来称为祖暅原理。"
        },
        songyuan: {
            title: "宋元",
            text: "宋元是算法传统的高峰。秦九韶著《数书九章》，论述大衍求一术和高次方程数值解；杨辉整理乘除捷法和三角数表；李冶、朱世杰把天元术推广到四元术。算盘也在日用计算里普及开来。"
        }
    };

    var detail = document.getElementById("historyDetail");
    var cards = document.querySelectorAll(".history-card");

    cards.forEach(function (card) {
        card.addEventListener("click", function () {
            var era = eras[card.dataset.era];
            cards.forEach(function (item) {
                item.classList.remove("is-selected");
                item.setAttribute("aria-pressed", "false");
            });
            card.classList.add("is-selected");
            card.setAttribute("aria-pressed", "true");
            detail.innerHTML = "";
            var heading = document.createElement("h2");
            heading.textContent = era.title;
            var paragraph = document.createElement("p");
            paragraph.textContent = era.text;
            var link = document.createElement("a");
            link.className = "history-more";
            link.href = "era-" + card.dataset.era + ".html";
            link.textContent = "阅读本期详情";
            detail.appendChild(heading);
            detail.appendChild(paragraph);
            detail.appendChild(link);
        });
    });

    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) return;
        SuanjingAPI.request("content?kind=era&pageSize=20").then(function (data) {
            data.items.forEach(function (item) {
                if (eras[item.slug]) {
                    eras[item.slug].title = item.title;
                    eras[item.slug].text = item.summary;
                }
            });
            var selected = document.querySelector(".history-card.is-selected");
            if (selected) selected.click();
        }).catch(function () {});
    });
})();

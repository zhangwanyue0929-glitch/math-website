/**
 * 数学家专题馆的静态条目。
 * 第二阶段接入数据库后，把 people 换成接口返回的数组，
 * render() 仍然负责左侧按钮和右侧图文，页面骨架可以保留。
 */
(function () {
    var people = {
        zuchongzhi: {
            name: "祖冲之",
            image: "assets/images/mathematicians/zuchongzhi.jpg",
            text: "南北朝数学家、天文学家。史书记载他把圆周率夹在 3.1415926 与 3.1415927 之间，并给出密率 355/113、约率 22/7。",
            achievements: ["盈朒二限：3.1415926 < π < 3.1415927", "密率 355/113，约率 22/7", "《缀术》已佚"]
        },
        liuhui: {
            name: "刘徽",
            image: "assets/images/mathematicians/liuhui.jpg",
            text: "魏晋数学家，为《九章算术》作注，提出割圆术，用“割之弥细，所失弥少”说明以多边形逼近圆。",
            achievements: ["割圆术", "《九章算术注》", "出入相补"]
        },
        yanghui: {
            name: "杨辉",
            image: "assets/images/mathematicians/yanghui.jpg",
            text: "南宋数学家，在《详解九章算法》中记载三角数表，后世称为杨辉三角，也整理了不少乘除捷法。",
            achievements: ["杨辉三角", "乘除捷法", "《详解九章算法》"]
        },
        qinjiushao: {
            name: "秦九韶",
            image: "assets/images/mathematicians/qinjiushao.jpg",
            text: "南宋数学家，著《数书九章》，系统论述一次同余式组的大衍求一术，以及高次方程的数值解法。",
            achievements: ["大衍求一术", "正负开方术", "《数书九章》"]
        },
        zhushijie: {
            name: "朱世杰",
            image: "assets/images/mathematicians/zhushijie.jpg",
            text: "元代数学家，著《四元玉鉴》和《算学启蒙》，把天元术推广为可以联立多个未知数的四元术。",
            achievements: ["四元术", "《四元玉鉴》", "《算学启蒙》"]
        }
    };

    var buttons = document.querySelectorAll(".person-btn");
    var nameEl = document.getElementById("person-name");
    var textEl = document.getElementById("person-text");
    var imageEl = document.getElementById("person-image");
    var achievementEl = document.getElementById("person-achievement");

    function render(key) {
        var person = people[key];
        nameEl.textContent = person.name;
        textEl.textContent = person.text;
        imageEl.src = person.image;
        imageEl.alt = person.name;
        achievementEl.innerHTML = "";
        var heading = document.createElement("h3");
        heading.textContent = "代表成就";
        var list = document.createElement("ul");
        person.achievements.forEach(function (item) {
            var li = document.createElement("li");
            li.textContent = item;
            list.appendChild(li);
        });
        achievementEl.appendChild(heading);
        achievementEl.appendChild(list);
        var more = document.getElementById("person-more");
        if (more) more.setAttribute("href", "person-" + key + ".html");
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            buttons.forEach(function (item) { item.classList.remove("active"); });
            button.classList.add("active");
            render(button.dataset.person);
        });
    });

    render("zuchongzhi");

    /* 服务器开着时，用数据库里的摘要替换这五位的静态介绍。多出来的人物不塞进画像栏。 */
    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) return;
        SuanjingAPI.request("content?kind=mathematician&pageSize=20").then(function (data) {
            data.items.forEach(function (item) {
                if (!people[item.slug]) return;
                people[item.slug].name = item.title;
                people[item.slug].text = item.summary;
                if (item.imageUrl) people[item.slug].image = item.imageUrl;
                if (item.points) {
                    people[item.slug].achievements = item.points.split("\n").filter(function (line) {
                        return line.trim();
                    });
                }
            });
            var active = document.querySelector(".person-btn.active");
            render(active ? active.dataset.person : "zuchongzhi");
        }).catch(function () {});
    });
})();

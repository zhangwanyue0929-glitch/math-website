
const data={
zuchongzhi:["祖冲之","assets/images/mathematicians/zuchongzhi.jpg","南北朝数学家，精确计算圆周率。","圆周率、缀术、大明历"],
liuhui:["刘徽","assets/images/mathematicians/liuhui.jpg","魏晋数学家，提出割圆术。","割圆术、《九章算术注》"],
yanghui:["杨辉","assets/images/mathematicians/yanghui.jpg","宋代数学家，发现杨辉三角。","杨辉三角、乘方开方算法"],
qinjiushao:["秦九韶","assets/images/mathematicians/qinjiushao.jpg","宋元数学家，《数书九章》作者。","大衍求一术、高次方程"],
zhushijie:["朱世杰","assets/images/mathematicians/zhushijie.jpg","元代数学家，著有《四元玉鉴》。","四元术、数学教育"]
};
document.querySelectorAll(".person-btn").forEach(b=>b.onclick=()=>{
 let d=data[b.dataset.person];document.querySelectorAll(".person-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 document.querySelector("#person-name").innerText=d[0];
 document.querySelector("#person-image").src=d[1];
 document.querySelector("#person-text").innerText=d[2];
 document.querySelector("#person-achievement").innerHTML="<h3>代表成就</h3><ul><li>"+d[3].replaceAll("、","</li><li>")+"</li></ul>";
});

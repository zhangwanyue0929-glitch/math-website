
const c=document.createElement("canvas");c.id="inkParticle";document.body.appendChild(c);
const ctx=c.getContext("2d");let ps=[];
function resize(){c.width=innerWidth;c.height=innerHeight}resize();addEventListener("resize",resize);
for(let i=0;i<70;i++)ps.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*3+1,v:Math.random()*.4+.1});
function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle="rgba(80,55,35,.18)";ps.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();p.y-=p.v;if(p.y<0)p.y=c.height});requestAnimationFrame(draw)}draw();

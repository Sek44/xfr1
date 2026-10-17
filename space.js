"use strict";
(()=>{
const $=id=>document.getElementById(id),game=new SpaceGame();
let running=false,paused=false,answer="",last=0,saved=false,message="Résous le calcul d’un alien.";
const sprites=new Map();
// Independent visual randomness keeps the sky irregular without affecting gameplay.
const starfield=$("stars");
for(let i=0;i<90;i++){
  const star=document.createElement("span"),bright=i%19===0,near=i%5===0;
  star.className="star"+(bright?" radiant":"");
  star.style.left=(Math.random()*100)+"%";star.style.top=(Math.random()*100)+"%";
  star.style.setProperty("--size",(bright?2.4:near?1.5+Math.random()*.7:.7+Math.random()*.7)+"px");
  star.style.setProperty("--light",bright?.85:near?.6:.2+Math.random()*.25);
  star.style.setProperty("--duration",(4+Math.random()*7)+"s");
  star.style.setProperty("--delay",(-Math.random()*12)+"s");
  star.style.setProperty("--tint",i%7===0?"#b9caff":i%11===0?"#ffe5c0":"#e4f1ff");
  starfield.append(star);
}
function sync(){
  $("points").textContent=game.score;$("level").textContent=game.level;$("lives").textContent="♥ ".repeat(game.lives).trim()||"—";$("lives").setAttribute("aria-label",game.lives+" vies");$("bomb-count").textContent=game.bombs;$("answer").textContent=answer||"?";$("feedback").textContent=message;
  const disabled=!running||paused||game.over;for(const key of $("keypad").children)key.disabled=disabled;$("bomb").disabled=disabled||!game.bombs;$("pause").disabled=!running||game.over;$("pause").textContent=paused?"▶":"Ⅱ";$("pause").setAttribute("aria-label",paused?"Reprendre":"Mettre en pause");
}
function edit(value){if(!running||paused||game.over)return;if(value==="clear")answer="";else if(value==="erase")answer=answer.slice(0,-1);else if(answer.length<3)answer+=value;message="Résous le calcul d’un alien.";if(answer&&game.shoot(answer)){answer="";message="Missile lancé !"}sync()}
for(const value of ["1","2","3","4","5","6","7","8","9","C","0","⌫"]){const key=document.createElement("button");key.type="button";key.textContent=value;if(value==="C"||value==="⌫")key.className="erase";if(value==="C")key.setAttribute("aria-label","Tout effacer");if(value==="⌫")key.setAttribute("aria-label","Effacer le dernier chiffre");key.onclick=()=>edit(value==="C"?"clear":value==="⌫"?"erase":value);$("keypad").append(key)}
function bomb(){if(!running||paused)return;if(game.bomb()){message="Bombe ! Aucun point marqué.";answer="";sync()}}
function start(){game.reset();running=true;paused=false;saved=false;answer="";last=0;message="Résous le calcul d’un alien.";$("overlay").hidden=true;sync()}
function pause(){if(!running||game.over)return;paused=!paused;last=0;$("overlay").hidden=!paused;if(paused){$("overlay-title").textContent="Petite pause";$("instructions").textContent="La galaxie peut attendre. Reprends quand tu es prêt !";$("bomb-help").hidden=true;$("result").textContent="";$("start").textContent="Reprendre"}sync()}
function finish(){if(saved)return;saved=true;running=false;ExerciseScores.save({tab:"space",category:"Mission calcul",score:game.score,total:1,mode:"arcade"});$("overlay-title").textContent="Mission terminée !";$("instructions").textContent=game.score>=10?"Fantastique, tu es un as du calcul !":"Bien joué ! Chaque mission te fait progresser.";$("bomb-help").hidden=true;$("result").textContent=game.score+" point"+(game.score===1?"":"s");$("start").textContent="Rejouer 🚀";$("overlay").hidden=false;sync()}
$("start").onclick=()=>paused?pause():start();$("bomb").onclick=bomb;$("pause").onclick=pause;
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running&&!paused)pause()});window.addEventListener("blur",()=>{if(running&&!paused)pause()});
document.addEventListener("keydown",e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.target.closest("a"))return;if(e.code==="Escape"){e.preventDefault();pause();return}if(!running||paused||game.over)return;if(/^\d$/.test(e.key)){e.preventDefault();edit(e.key)}else if(e.key==="Backspace"){e.preventDefault();edit("erase")}else if(e.key==="Delete"){e.preventDefault();edit("clear")}});
// SVG and CSS render without a canvas context or resize-dependent backing buffer.

function draw(){
  const active=new Set();
  function sprite(key,type,x,y){
    active.add(key);let node=sprites.get(key);
    if(!node){node=document.createElement("div");node.className=type;$("sprites").append(node);sprites.set(key,node)}
    node.style.left=(x*100)+"%";node.style.top=(y*100)+"%";return node;
  }
  for(const e of game.enemies){
    const node=sprite("enemy-"+e.id,"alien",e.x,e.y);
    if(!node.firstChild){const visual=SpaceEnemies.visual(e.level||1);node.innerHTML=visual.svg;node.style.setProperty("--enemy-color",visual.color);node.style.setProperty("--enemy-armor",visual.armor);const label=document.createElement("span");label.className="calculus";label.textContent=e.a+" + "+e.b;node.append(label);if(e.bomb){const badge=document.createElement("span");badge.className="bomb-badge";badge.textContent="💣";node.append(badge)}}
    node.classList.toggle("carrier",e.bomb);
  }
  for(const m of game.missiles)sprite("missile-"+m.target,"missile",m.x,m.y);
  for(const e of game.effects){
    const node=sprite("effect-"+e.id,"explosion",e.x,e.y);
    if(!node.firstChild){
      const ring=document.createElement("span");ring.className="blast-ring";node.append(ring);node.ring=ring;node.fragments=[];
      const count=10+Math.floor(Math.random()*6);
      for(let i=0;i<count;i++){
        const shard=document.createElement("span"),angle=(i+Math.random())/count*Math.PI*2,speed=35+Math.random()*85;
        shard.className="debris";shard.style.width=(2+Math.random()*4)+"px";shard.style.height=(1.5+Math.random()*3)+"px";
        shard.style.background=i%3===0?"#f4faff":i%3===1?e.color:"#8295af";
        node.append(shard);node.fragments.push({shard,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,spin:(Math.random()-.5)*900,angle:Math.random()*360});
      }
    }
    const t=e.age;
    node.style.color=e.color;node.ring.style.opacity=Math.max(0,1-t/.5);node.ring.style.transform="translate(-50%,-50%) scale("+(.2+t*4)+")";
    for(const f of node.fragments){f.shard.style.opacity=Math.max(0,1-t/.85);f.shard.style.transform="translate("+(f.vx*t)+"px,"+(f.vy*t+35*t*t)+"px) rotate("+(f.angle+f.spin*t)+"deg)"}
  }
  for(const [key,node] of sprites){if(!active.has(key)){node.remove();sprites.delete(key)}}
}
function frame(now){if(running&&!paused){const dt=last?Math.min((now-last)/1000,.05):0;game.step(dt);sync();if(game.over)finish()}last=now;draw();requestAnimationFrame(frame)}sync();requestAnimationFrame(frame);
})();

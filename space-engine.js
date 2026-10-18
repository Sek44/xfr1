"use strict";
// Pure simulation: normalized coordinates keep gameplay identical on every screen.
(function(root){
  class SpaceGame {
    constructor(random=Math.random){this.random=random;this.reset()}
    reset(){this.lives=3;this.bombs=2;this.score=0;this.enemies=[];this.missiles=[];this.effects=[];this.time=0;this.spawnIn=.6;this.over=false;this.nextId=0;this.nextEffectId=0;this.playerX=.5;this.shots=[];this.alignment=null}
    get level(){return 1+Math.floor(this.score/5)}
    operation(){
      const int=(min,max)=>min+Math.floor(this.random()*(max-min+1));
      const level=this.level;
      let a,b;
      if(level===1){a=int(1,8);b=int(1,10-a)}
      else if(level===2){a=int(10,18);b=int(1,9-a%10)}
      else if(level===3){a=int(2,4)*10+int(1,9);b=int(10-a%10,9)}
      else if(level===4){a=int(5,9)*10+int(1,9);b=int(10-a%10,9)}
      else{const hundreds=Math.min(9,level-4);a=int(hundreds*100,hundreds*100+90);b=int(1,9)}
      return {a,b};
    }
    spawn(){
      if(this.enemies.length>=8)return;
      const answers=new Set(this.enemies.map(e=>e.answer));let a,b;
      for(let i=0;i<100;i++){({a,b}=this.operation());if(!answers.has(a+b))break}
      if(answers.has(a+b))return;
      const lanes=[.16,.5,.84];const free=lanes.filter(x=>!this.enemies.some(e=>Math.abs(e.x-x)<.2&&e.y<.24));if(!free.length)return;
      this.enemies.push({id:++this.nextId,level:this.level,a,b,answer:a+b,x:free[Math.floor(this.random()*free.length)],y:-.08,speed:.026+Math.min(this.score,60)*.0006,bomb:this.random()<.08,targeted:false});
    }
    shoot(answer){
      if(this.over||!/^\d+$/.test(answer))return false;
      const target=this.enemies.filter(e=>!e.targeted&&e.answer===Number(answer)).sort((a,b)=>b.y-a.y)[0];if(!target)return false;
      target.targeted=true;this.shots.push(target.id);this.alignNext();return true;
    }
    alignNext(){
      if(this.alignment)return;
      while(this.shots.length){
        const id=this.shots.shift(),target=this.enemies.find(e=>e.id===id);
        if(target){this.alignment={target:target.id,fromX:this.playerX,elapsed:0,duration:.08};return}
      }
    }
    moveAndLaunch(dt){
      let remaining=dt;this.alignNext();
      while(this.alignment&&remaining>0){
        const a=this.alignment,target=this.enemies.find(e=>e.id===a.target&&!e.dead);
        if(!target){this.alignment=null;this.alignNext();continue}
        const used=Math.min(remaining,a.duration-a.elapsed);a.elapsed+=used;remaining-=used;
        const t=Math.min(1,a.elapsed/a.duration),ease=t*t*(3-2*t);
        this.playerX=a.fromX+(target.x-a.fromX)*ease;
        if(t<1)break;
        this.playerX=target.x;
        this.missiles.push({target:target.id,x:target.x,y:.915});
        this.alignment=null;this.alignNext();
      }
    }
    explode(e,color){this.effects.push({id:++this.nextEffectId,x:e.x,y:e.y,age:0,color})}
    bomb(){if(this.over||this.bombs===0||!this.enemies.length)return false;this.bombs--;for(const e of this.enemies)this.explode(e,"#fbbf24");this.enemies=[];this.missiles=[];this.shots=[];this.alignment=null;return true}
    step(dt){
      if(this.over)return;dt=Math.min(dt,.05);this.time+=dt;
      for(const e of this.enemies)e.y+=e.speed*dt;
      this.moveAndLaunch(dt);
      for(const m of this.missiles){const target=this.enemies.find(e=>e.id===m.target);if(!target){m.done=true;continue}const move=4*dt;if(m.y-target.y<=move){m.done=true;target.dead=true;this.score++;if(target.bomb)this.bombs++;this.explode(target,target.bomb?"#fbbf24":"#67e8f9")}else m.y-=move}

      for(const e of this.enemies){if(!e.dead&&e.y>=.9){e.dead=true;this.lives=Math.max(0,this.lives-1);this.explode({...e,y:.9},"#fb7185")}}
      this.enemies=this.enemies.filter(e=>!e.dead);this.missiles=this.missiles.filter(m=>!m.done&&this.enemies.some(e=>e.id===m.target));
      for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<.85);
      if(this.lives===0){this.over=true;return}
      this.spawnIn-=dt;if(this.spawnIn<=0){this.spawn();this.spawnIn=Math.max(2.5,5-this.score*.04)}
    }
  }
  root.SpaceGame=SpaceGame;
})(typeof module!=="undefined"?module.exports:window);


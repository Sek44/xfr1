"use strict";
window.ExerciseGame=(()=>{
  const DELAY_MS=3000;
  function create({onChange,onFinish}){
    let index=0,score=0,failed=false,correct=false,total=10,timer=null;
    function cancel(){if(timer!==null){clearTimeout(timer);timer=null}}
    function reset(count=10){cancel();index=0;score=0;failed=false;correct=false;total=count;onChange()}
    function validate(isRight){if(correct)return;if(isRight){correct=true;if(!failed)score++;cancel();timer=setTimeout(next,DELAY_MS)}else failed=true;onChange()}
    function next(){if(!correct)return;cancel();index++;failed=false;correct=false;if(index===total)onFinish({score,total});onChange()}
    function progress(container,noun){container.replaceChildren();const left=document.createElement("span");left.className="progress-label";left.textContent=index===total?"Terminé":noun+" "+(index+1)+" / "+total;const right=document.createElement("strong");right.textContent=score+" / "+total;container.append(left,right)}
    function finish(container,restart){container.replaceChildren();const heading=document.createElement("h2");heading.textContent="Exercice terminé !";const result=document.createElement("p");result.textContent="Score : "+score+" / "+total+".";const message=document.createElement("p");message.className="encouragement";message.textContent=ExerciseScores.encourage(score,total);const button=document.createElement("button");button.className="primary";button.textContent="Recommencer";button.onclick=restart;container.append(heading,result,message,button)}
    function actionButton(){const button=document.createElement("button");button.className="primary";button.textContent=correct?(index===total-1?"Voir mon score maintenant":"Suivant →"):"Vérifier";return button}
    return {reset,validate,next,cancel,progress,finish,actionButton,get index(){return index},get score(){return score},get failed(){return failed},get correct(){return correct},get total(){return total}};
  }
  return {create};
})();
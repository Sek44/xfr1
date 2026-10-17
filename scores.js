"use strict";
window.ExerciseScores=(()=>{
  const KEY="exercices_francais_scores";
  const encouragements={
    perfect:["Incroyable ! Un sans-faute, tu es une vraie star !","Fantastique ! 10 sur 10, quel champion !","Bravo ! Tu as tout réussi, c'est exceptionnel !"],
    high:["Excellent travail ! Continue comme ça !","Super résultat ! Tu progresses à toute vitesse !","Très bien joué ! Tu peux être fier de toi !"],
    middle:["Bien joué ! Chaque exercice te fait progresser !","C'est un bon début ! Continue à t'entraîner !","Tu es sur la bonne voie, persévère !"],
    low:["Ne te décourage pas, tu vas y arriver !","Chaque essai te rend plus fort. Continue !","Courage ! Le plus important, c'est d'essayer et de progresser !"]
  };
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v.filter(r=>r&&Number.isFinite(Number(r.score))&&Number(r.total)>0):[]}catch{return []}}
  function save(record){try{localStorage.setItem(KEY,JSON.stringify([{...record,date:new Date().toISOString()},...read()].slice(0,200)))}catch{}}
  function label(record){if(record.tab==="math")return record.category||"Additions";if(record.tab==="g")return"Français · g / gu / ge";if(record.tab==="c")return"Français · c / ç";return String(record.category||record.tab||"Exercice")}
  function encourage(score,total){const ratio=score/total;const group=ratio===1?"perfect":ratio>=.8?"high":ratio>=.5?"middle":"low";const choices=encouragements[group];return choices[Math.floor(Math.random()*choices.length)]}
  function render(container,game=null){
    container.replaceChildren();
    const records=read().filter(r=>game===null||(game==="math"?r.tab==="math":r.tab==="g"||r.tab==="c"));
    const title=document.createElement("h2");title.textContent=game===null?"Tous mes résultats":game==="math"?"Mes résultats en calcul":"Mes résultats en français";container.append(title);
    if(!records.length){const p=document.createElement("p");p.textContent="Aucun exercice terminé pour le moment.";container.append(p);return}
    const summary=document.createElement("p");summary.className="history-summary";const points=records.reduce((n,r)=>n+Number(r.score),0),total=records.reduce((n,r)=>n+Number(r.total),0);summary.textContent=records.length+" session(s) · "+Math.round(points/total*100)+" % de réussite";container.append(summary);
    const scroll=document.createElement("div");scroll.className="history-scroll";const table=document.createElement("table");table.className="history-table";
    const head=document.createElement("thead"),hr=document.createElement("tr");for(const name of ["Date","Exercice","Score"]){const th=document.createElement("th");th.textContent=name;hr.append(th)}head.append(hr);table.append(head);
    const body=document.createElement("tbody");for(const r of records){const tr=document.createElement("tr");const date=new Date(r.date);for(const value of [Number.isNaN(date.getTime())?"—":date.toLocaleDateString("fr-FR"),label(r),r.score+" / "+r.total]){const td=document.createElement("td");td.textContent=value;tr.append(td)}body.append(tr)}table.append(body);scroll.append(table);container.append(scroll);
  }
  return {read,save,render,encourage};
})();
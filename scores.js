"use strict";
window.ExerciseScores=(()=>{
  const KEY="exercices_francais_scores";
  const origins=new WeakMap();
  const encouragements={
    perfect:["Incroyable ! Un sans-faute, tu es une vraie star !","Fantastique ! 10 sur 10, quel champion !","Bravo ! Tu as tout réussi, c'est exceptionnel !"],
    high:["Excellent travail ! Continue comme ça !","Super résultat ! Tu progresses à toute vitesse !","Très bien joué ! Tu peux être fier de toi !"],
    middle:["Bien joué ! Chaque exercice te fait progresser !","C'est un bon début ! Continue à t'entraîner !","Tu es sur la bonne voie, persévère !"],
    low:["Ne te décourage pas, tu vas y arriver !","Chaque essai te rend plus fort. Continue !","Courage ! Le plus important, c'est d'essayer et de progresser !"]
  };
  function raw(){const value=JSON.parse(localStorage.getItem(KEY)||"[]");if(!Array.isArray(value))throw new Error("Invalid score history");return value}
  function read(){try{const records=raw(),snapshot=JSON.stringify(records);return records.filter((record,index)=>{if(!record||typeof record!=="object")return false;origins.set(record,{index,snapshot});return true})}catch{return []}}
  function remove(record){try{const origin=origins.get(record),records=raw();if(!origin||JSON.stringify(records)!==origin.snapshot)return false;records.splice(origin.index,1);localStorage.setItem(KEY,JSON.stringify(records));return true}catch{return false}}
  function save(record){try{const previous=raw(),now=new Date();localStorage.setItem(KEY,JSON.stringify([{...record,date:now.toISOString(),time:now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",hour12:false})},...previous]));return true}catch{return false}}
  function time(record){
    if(typeof record.time==="string"&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(record.time))return record.time;
    if(typeof record.date==="string"&&/T\d{2}:\d{2}/.test(record.date)){const date=new Date(record.date);if(!Number.isNaN(date.getTime()))return date.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",hour12:false})}
    return "00:00";
  }
  function label(record){if(record.tab==="space")return "Mission calcul";if(record.tab==="math")return record.category||"Additions";if(record.tab==="g")return"Français · g / gu / ge";if(record.tab==="c")return"Français · c / ç";return String(record.category||record.tab||"Exercice")}
  function encourage(score,total){const ratio=score/total;const group=ratio===1?"perfect":ratio>=.8?"high":ratio>=.5?"middle":"low";const choices=encouragements[group];return choices[Math.floor(Math.random()*choices.length)]}
  function render(container,game=null){
    container.replaceChildren();
    const records=read().filter(r=>game===null||(game==="math"?r.tab==="math":game==="space"?r.tab==="space":r.tab==="g"||r.tab==="c"));
    const title=document.createElement("h2");title.textContent=game===null?"Tous mes résultats":game==="math"?"Mes résultats en calcul":game==="space"?"Mes missions spatiales":"Mes résultats en français";container.append(title);
    if(!records.length){const p=document.createElement("p");p.textContent="Aucun exercice terminé pour le moment.";container.append(p);return}
    const summary=document.createElement("p");summary.className="history-summary";const exercises=records.filter(r=>r.mode!=="arcade"&&Number.isFinite(Number(r.score))&&Number(r.total)>0);const points=exercises.reduce((n,r)=>n+Number(r.score),0),total=exercises.reduce((n,r)=>n+Number(r.total),0);summary.textContent=records.length+" session(s) · "+(exercises.length?Math.round(points/total*100)+" % de réussite":"Record : "+Math.max(0,...records.map(r=>Number(r.score)||0))+" points");container.append(summary);
    const hint=document.createElement("p");hint.className="history-hint";hint.textContent="Appui long sur un résultat pour le supprimer.";container.append(hint);
    async function askDelete(record){
      const confirmed=await AppConfirm.ask({title:"Supprimer ce score ?",message:label(record)+" · "+(record.score??"—")+" point(s) · "+time(record),confirmText:"Supprimer",cancelText:"Conserver"});
      if(!confirmed)return;
      const removed=remove(record);render(container,game);
      if(!removed){const error=document.createElement("p");error.className="history-error";error.setAttribute("role","status");error.textContent="Le score n’a pas été supprimé. La liste a été actualisée : réessaie.";container.append(error)}
    }
    function longPress(row,record){
      let timer=null,x=0,y=0;
      function cancel(){if(timer!==null)clearTimeout(timer);timer=null;row.classList.remove("holding")}
      row.tabIndex=0;row.setAttribute("aria-label",label(record)+". Appui long ou touche Suppr pour supprimer.");
      row.addEventListener("pointerdown",event=>{if(event.button!==0||event.isPrimary===false)return;cancel();x=event.clientX;y=event.clientY;row.classList.add("holding");timer=setTimeout(()=>{cancel();askDelete(record)},600)});
      row.addEventListener("pointermove",event=>{if(Math.hypot(event.clientX-x,event.clientY-y)>10)cancel()});
      for(const event of ["pointerup","pointercancel","pointerleave"])row.addEventListener(event,cancel);
      row.addEventListener("contextmenu",event=>event.preventDefault());
      row.addEventListener("keydown",event=>{if(event.key==="Delete"||event.key==="Enter"){event.preventDefault();askDelete(record)}});
    }
    const scroll=document.createElement("div");scroll.className="history-scroll";const table=document.createElement("table");table.className="history-table";
    const head=document.createElement("thead"),hr=document.createElement("tr");for(const name of ["Date","Heure","Exercice","Score"]){const th=document.createElement("th");th.textContent=name;hr.append(th)}head.append(hr);table.append(head);
    const body=document.createElement("tbody");for(const r of records){const tr=document.createElement("tr");const date=new Date(r.date);for(const value of [Number.isNaN(date.getTime())?"—":date.toLocaleDateString("fr-FR"),time(r),label(r),r.score==null?"—":r.mode==="arcade"?r.score+" points":r.score+" / "+(r.total??"—")]){const td=document.createElement("td");td.textContent=value;tr.append(td)}longPress(tr,r);body.append(tr)}table.append(body);scroll.append(table);container.append(scroll);
  }
  return {read,save,render,encourage,time,remove};
})();


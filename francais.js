"use strict";
(() => {
  const sets = {
    g: {
      name: "g / gu / ge",
      options: ["g", "gu", "ge"],
      items: [
        ["Le garçon man", "e une pomme.", "g"],
        ["La ", "enon saute dans le pré.", "gu"],
        ["Le ", "épard court très vite.", "gu"],
        ["Papa ran", "e la voiture.", "g"],
        ["Le pi", "on vole.", "ge"],
        ["La ", "irafe a un long cou.", "g"],
        ["Le ", "ide montre le chemin.", "gu"],
        ["Le boulan", "er prépare du pain.", "g"],
        ["Le ", "errier porte une épée.", "gu"],
        ["Nous man", "ons à la cantine.", "ge"],
        ["Le sin", "e grimpe aux arbres.", "g"],
        ["La ba", "e est en or.", "gu"],
        ["Le ", "énie sort de la lampe.", "g"],
        ["Le ma", "icien fait un tour.", "g"],
        ["Le ", "épard dort.", "gu"],
        ["La va", "e arrive sur le sable.", "gu"],
        ["Le ", "âteau est délicieux.", "g"],
        ["Il joue de la ", "itare.", "gu"],
        ["La nei", "e tombe.", "g"],
        ["Le ", "éant porte un chapeau.", "g"],
        ["Le pi", "on nage dans l'eau.", "ge"],
        ["Nous ran", "ons nos affaires.", "ge"],
        ["L'oran", "ade est fraîche.", "ge"],
        ["Le dra", "on crache du feu.", "g"],
        ["Le ", "arçon porte un manteau.", "g"],
        ["La ", "itare est dans sa housse.", "gu"],
        ["Une ", "êpe vole près de la fenêtre.", "gu"],
        ["Le ", "âteau au chocolat est prêt.", "g"],
        ["La ", "ymnastique commence demain.", "g"],
        ["Le ", "épard court dans la savane.", "gu"],
        ["Nous man", "ons une salade.", "ge"],
        ["Les enfants ran", "ent leurs jouets.", "g"],
        ["Tu parta", "es ton goûter.", "g"],
        ["Le rou", "e est ma couleur préférée.", "g"],
        ["La bou", "ie éclaire la table.", "g"],
        ["Le villa", "e est entouré de montagnes.", "g"],
        ["Le ", "ardien ferme la porte.", "g"],
        ["Une lon", "e route traverse la forêt.", "gu"],
        ["Il ", "arde son cartable près de lui.", "g"],
        ["La ba", "arre éclate dans la cour.", "g"],
        ["Le ", "épard se cache dans les herbes.", "gu"],
        ["La ", "irouette tourne avec le vent.", "g"],
        ["Le ", "éridon est près du canapé.", "gu"],
        ["Le ", "ide explique le parcours.", "gu"],
        ["Le ", "enou est protégé par une genouillère.", "g"],
        ["Nous navi", "ons sur le lac.", "gu"],
        ["La ", "erre est enfin terminée.", "gu"],
        ["Il faut ran", "er les crayons.", "g"],
        ["Nous parta", "ons le gâteau.", "ge"],
        ["Vous man", "ez à midi.", "g"],
        ["Il man", "ait une pomme.", "ge"],
        ["Le ", "ichet ouvre à neuf heures.", "gu"],
        ["La ", "enon grimpe dans l'arbre.", "gu"],
        ["Le ", "arage est derrière la maison.", "g"],
        ["Les va", "es frappent les rochers.", "gu"],
        ["Le ", "ilet est accroché au portemanteau.", "g"],
        ["Un ", "âteau flotte sur la rivière.", "g"],
        ["Le dra", "on protège son trésor.", "g"],
        ["La ", "irafe mange des feuilles.", "g"],
        ["Le pi", "on picore des graines.", "ge"],
        ["La ", "irlande décore la salle.", "gu"],
        ["Le ", "épard observe sa proie.", "gu"],
        ["Elle bou", "e les bras.", "g"],
        ["Nous chan", "ons de place.", "ge"],
      ],
    },
    c: {
      name: "c / ç",
      options: ["c", "ç"],
      items: [
        ["Le gar", "on joue dehors.", "ç"],
        ["La le", "on est facile.", "ç"],
        ["Il a re", "u une lettre.", "ç"],
        ["Je lan", "e le ballon.", "c"],
        ["Nous avan", "ons doucement.", "ç"],
        ["Le ", "itron est jaune.", "c"],
        ["La fa", "ade est blanche.", "ç"],
        ["Le ", "ygne nage.", "c"],
        ["Un gla", "on flotte.", "ç"],
        ["La ", "erise est rouge.", "c"],
        ["Nous tra", "ons un cercle.", "ç"],
        ["Le ", "iel est bleu.", "c"],
        ["Le ", "adeau est emballé.", "c"],
        ["La balan", "oire bouge.", "ç"],
        ["Elle ", "ommence à lire.", "c"],
        ["Le ma", "on construit un mur.", "ç"],
        ["Je pla", "e mon livre ici.", "c"],
        ["Le ", "entre est ouvert.", "c"],
        ["Nous effa", "ons le tableau.", "ç"],
        ["Le ", "afé est chaud.", "c"],
        ["Une pu", "e se cache dans ses cheveux.", "c"],
        ["Une rempla", "ante arrive aujourd'hui.", "ç"],
        ["Un ", "oude relie les deux tuyaux.", "c"],
        ["Le ", "adeau est sur la table.", "c"],
        ["Il a de la chan", "e aujourd’hui.", "c"],
        ["Son regard est per", "ant.", "ç"],
        ["Tu dois re", "evoir une lettre.", "c"],
        ["La poli", "e recherche le voleur.", "c"],
        ["Le ma", "on répare la cheminée.", "ç"],
        ["Elle a été aga", "ée par le bruit.", "c"],
        ["Le chauffeur avan", "e doucement.", "c"],
        ["Le ", "ommerce ouvre tôt.", "c"],
        ["Le ", "ygne déploie ses ailes.", "c"],
        ["Le gar", "on joue au ballon.", "ç"],
        ["J'ai re", "u une invitation.", "ç"],
        ["Cette fa", "on de faire est amusante.", "ç"],
        ["Le gla", "on fond dans le verre.", "ç"],
        ["Nous lan", "ons des cailloux dans l'eau.", "ç"],
        ["Le ", "itron est très acide.", "c"],
        ["La le", "on commence bientôt.", "ç"],
        ["La ", "ourse dure cinq kilomètres.", "c"],
        ["Je tra", "e une ligne droite.", "c"],
        ["Le ", "erf traverse la forêt.", "c"],
        ["Le ", "afé est servi dans une tasse.", "c"],
        ["Nous pla", "ons les chaises en cercle.", "ç"],
        ["Une ", "igogne construit son nid.", "c"],
        ["Il a une belle ", "einture.", "c"],
        ["Le ", "ollier est en argent.", "c"],
        ["La balan", "oire grince un peu.", "ç"],
        ["Elle dé", "oit ses amis.", "ç"],
        ["Nous aper", "evons le sommet.", "c"],
        ["La ", "uisine sent bon.", "c"],
        ["Le ", "amion transporte du sable.", "c"],
        ["Un ", "irque s'installe en ville.", "c"],
        ["Nous re", "evons des nouvelles.", "c"],
        ["Il lan", "a le ballon très loin.", "ç"],
        ["Elle avan", "ait sans bruit.", "ç"],
        ["Le ", "alendrier est accroché au mur.", "c"],
        ["Le ", "ochon dort dans la paille.", "c"],
        ["Le ", "anard nage dans l'étang.", "c"],
      ],
    },
  };
  const SESSION_SIZE = 10;
  let tab = "g",
    selected = null,
    lastQuestionIndex = 0;
  let questions = shuffleSession(tab);
  const storedGame = GameState.create("francais");
  const game = ExerciseGame.create({
    onChange: () => {
      if (game.index !== lastQuestionIndex) {
        selected = null;
        lastQuestionIndex = game.index;
      }
      render();
      persist();
    },
    onFinish: ({ score, total }) => {
      storedGame.clear();
      ExerciseScores.save({ tab, score, total });
    },
  });
  const make = GameUI.element;
  function persist() {
    if (game.index === game.total) {
      storedGame.clear();
      return;
    }
    storedGame.save({ tab, questions, selected, progress: game.snapshot() });
  }
  function restore() {
    const state = storedGame.load();
    if (
      !state ||
      !Object.hasOwn(sets, state.tab) ||
      !Array.isArray(state.questions) ||
      state.questions.length !== SESSION_SIZE ||
      !state.questions.every(
        (item) =>
          Array.isArray(item) &&
          item.length === 3 &&
          item.every((part) => typeof part === "string") &&
          sets[state.tab].options.includes(item[2]),
      ) ||
      (state.selected !== null &&
        !sets[state.tab].options.includes(state.selected)) ||
      state.progress?.total !== state.questions.length
    )
      return false;
    tab = state.tab;
    questions = state.questions;
    selected = state.selected;
    lastQuestionIndex = state.progress.index;
    return game.restore(state.progress);
  }

  function shuffleSession(t) {
    const shuffled = sets[t].items.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, SESSION_SIZE);
  }
  function switchTab(t) {
    tab = t;
    selected = null;
    questions = shuffleSession(t);
    game.reset(questions.length);
  }
  function select(v) {
    if (!game.correct) {
      selected = v;
      render();
      persist();
    }
  }
  function verify() {
    if (selected !== null && !game.correct)
      game.validate(selected === questions[game.index][2]);
  }
  function advance() {
    selected = null;
    game.next();
  }
  function render() {
    const tabs = document.getElementById("tabs"),
      panel = document.getElementById("panel"),
      scoreCard = document.getElementById("score-card");
    tabs.replaceChildren();
    panel.replaceChildren();
    scoreCard.replaceChildren();
    scoreCard.hidden = false;
    for (const [key, entry] of Object.entries(sets)) {
      const b = make("button", tab === key ? "active" : "", entry.name);
      b.onclick = () => switchTab(key);
      tabs.append(b);
    }

    const data = sets[tab],
      total = questions.length;
    game.progress(scoreCard, "Phrase");
    if (game.index === total) {
      game.finish(panel, () => switchTab(tab));
      return;
    }
    const [before, after] = questions[game.index],
      sentence = make("div", "sentence");
    const match = before.match(/^(.*?)([^\s]*)$/s),
      prefix = match[1],
      fragment = match[2];
    sentence.append(document.createTextNode(prefix));
    const word = make("span", "word");
    word.append(document.createTextNode(fragment));
    const hole = make(
      "span",
      "hole",
      selected === null
        ? "\u00a0"
        : prefix === "" && fragment === ""
          ? selected.toUpperCase()
          : selected,
    );
    word.append(hole);
    const suffix = after.match(/^[^\s]*/)[0];
    word.append(document.createTextNode(suffix));
    sentence.append(word, document.createTextNode(after.slice(suffix.length)));
    panel.append(sentence);
    const options = make("div", "choices");
    for (const value of data.options) {
      const b = make("button", selected === value ? "selected" : "", value);
      b.disabled = game.correct;
      b.onclick = () => select(value);
      options.append(b);
    }
    panel.append(options);
    const message = game.feedback({
      correction: "Bonne correction ! Pas de point pour cette phrase.",
      retry: "Essaie encore ! Tu peux changer ta réponse.",
    });
    panel.append(message);
    const actions = make("div", "actions"),
      button = game.actionButton();
    button.disabled = !game.correct && selected === null;
    button.onclick = game.correct ? advance : verify;
    actions.append(button);
    panel.append(actions);
  }
  if (!restore()) game.reset(questions.length);

  ScoreView.bind({
    suspend: () => {
      game.suspend();
      persist();
    },
    resume: () => game.resume(),
  });
  window.addEventListener("pagehide", () => {
    game.suspend();
    persist();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) game.resume();
  });
})();

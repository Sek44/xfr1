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
        ["Le ti","re dort dans la jungle.","g"],
        ["Une épon","e flotte dans la baignoire.","g"],
        ["La monta","ne touche les nuages.","g"],
        ["Ce lé","me est mûr.","gu"],
        ["Un nua","e cache le soleil.","g"],
        ["Le froma","e sent très bon.","g"],
        ["La pa","e du livre est déchirée.","g"],
        ["Le visa","e du clown est maquillé.","g"],
        ["Le voya","e commence demain.","g"],
        ["Un passa","er monte dans le train.","g"],
        ["La ca","e du hamster est propre.","g"],
        ["Un ora","e éclate cette nuit.","g"],
        ["Le ména","e est terminé.","g"],
        ["Un baga","e attend dans le couloir.","g"],
        ["Le plon","eur saute dans l'eau.","g"],
        ["Le manè","e tourne sur la place.","g"],
        ["Le collè","e ouvre ses portes.","g"],
        ["La ma","ie amuse les enfants.","g"],
        ["Un éleva","e de moutons occupe la ferme.","g"],
        ["Le coquilla","e repose sur le sable.","g"],
        ["Le camoufla","e cache le soldat.","g"],
        ["Le paysa","e est magnifique.","g"],
        ["Le personna","e entre en scène.","g"],
        ["Un messa","e arrive ce matin.","g"],
        ["Le parta","e rend tout le monde heureux.","g"],
        ["Le lava","e des mains est important.","g"],
        ["Un vira","e arrive après le pont.","g"],
        ["Le repassa","e prend du temps.","g"],
        ["Le jardina","e plaît à ma grand-mère.","g"],
        ["Le gara","iste répare notre voiture.","g"],
        ["Le ga","nant remporte la course.","g"],
        ["La fi","e tombe du figuier.","gu"],
        ["Le lo","ement est lumineux.","g"],
        ["La si","nature est au bas de la page.","g"],
        ["La fati","e se fait sentir.","gu"],
        ["Un dialo","e commence entre les amis.","gu"],
        ["La lan","e française est belle.","gu"],
        ["La dé","station commence à midi.","gu"],
        ["Le re","ard est très attentif.","g"],
        ["La mar","uerite pousse dans le jardin.","gu"],
        ["La ba","ette magique brille.","gu"],
        ["Une ai","uille tombe dans la boîte.","gu"],
        ["Une ba","ue brille à son doigt.","gu"],
        ["La bla","ue fait rire tout le monde.","gu"],
        ["Nous distin","ons les couleurs.","gu"],
        ["Nous fati","ons nos jambes en courant.","gu"],
        ["Nous intri","ons le détective.","gu"],
        ["Nous conju","ons les verbes.","gu"],
        ["Nous délé","ons cette mission.","gu"],
        ["Nous dialo","ons calmement.","gu"],
        ["La ","imauve fond dans le chocolat.","gu"],
        ["Le ","idon du vélo est rouge.","gu"],
        ["La ","érilla se termine enfin.","gu"],
        ["Nous zigza","ons entre les arbres.","gu"],
        ["Nous proté","ons la nature.","ge"],
        ["Nous mélan","ons la pâte.","ge"],
        ["Nous plon","ons dans la piscine.","ge"],
        ["Nous voya","ons en train.","ge"],
        ["Nous échan","ons nos idées.","ge"],
        ["Nous corri","ons nos erreurs.","ge"],
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
  const WORD_COUNTS_KEY = "entrainement_francais_word_counts_v1";
  const SENTENCE_COUNTS_KEY = "entrainement_francais_sentence_counts_v1";

  function readCounts(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function wordKey(category, item) {
    const before = item[0].match(/[\p{L}]+$/u)?.[0] || "";
    const after = item[1].match(/^[\p{L}]+/u)?.[0] || "";
    return JSON.stringify([category, (before + item[2] + after).toLocaleLowerCase("fr")]);
  }

  function loadWordCounts() {
    if (localStorage.getItem(WORD_COUNTS_KEY) !== null) return readCounts(WORD_COUNTS_KEY);
    const counts = {};
    for (const [key, count] of Object.entries(readCounts(SENTENCE_COUNTS_KEY))) {
      if (!Number.isSafeInteger(count) || count < 0) continue;
      try {
        const [category, ...item] = JSON.parse(key);
        if (!Object.hasOwn(sets, category) || item.length !== 3) continue;
        const word = wordKey(category, item);
        counts[word] = Math.min(Number.MAX_SAFE_INTEGER, (counts[word] || 0) + count);
      } catch {
        // Ignore malformed old entries.
      }
    }
    try {
      localStorage.setItem(WORD_COUNTS_KEY, JSON.stringify(counts));
    } catch {
      // The exercise still works without storage.
    }
    return counts;
  }
  const wordCounts = loadWordCounts();

  function appearanceCount(category, item) {
    const count = wordCounts[wordKey(category, item)];
    return Number.isSafeInteger(count) && count >= 0 ? count : 0;
  }
  function recordAppearance(category, item) {
    const key = wordKey(category, item);
    wordCounts[key] = Math.min(Number.MAX_SAFE_INTEGER, appearanceCount(category, item) + 1);
    try {
      localStorage.setItem(WORD_COUNTS_KEY, JSON.stringify(wordCounts));
    } catch {
      // The exercise remains usable when storage is unavailable.
    }
  }

  let tab = "g",
    selected = null,
    lastQuestionIndex = 0,
    countedThrough = -1;
  let questions = shuffleSession(tab);
  const storedGame = GameState.create("francais");
  const game = ExerciseGame.create({
    onChange: () => {
      if (game.index !== lastQuestionIndex) {
        selected = null;
        lastQuestionIndex = game.index;
      }
      if (game.index < questions.length && game.index > countedThrough) {
        recordAppearance(tab, questions[game.index]);
        countedThrough = game.index;
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
    storedGame.save({
      tab, questions, selected, countedThrough, progress: game.snapshot(),
    });
  }
  // Correct questions saved by older versions so refreshing fixes active sessions too.
  const correctedQuestions = new Map([
    [["Ce lé","ume est mûr.","g"], ["Ce lé","me est mûr.","gu"]],
    [["La fi","ue tombe du figuier.","g"], ["La fi","e tombe du figuier.","gu"]],
    [["La fati","ue se fait sentir.","g"], ["La fati","e se fait sentir.","gu"]],
    [["Un dialo","ue commence entre les amis.","g"], ["Un dialo","e commence entre les amis.","gu"]],
    [["La lan","ue française est belle.","g"], ["La lan","e française est belle.","gu"]],
    [["La dé","ustation commence à midi.","g"], ["La dé","station commence à midi.","gu"]],
  ].map(([before, after]) => [JSON.stringify(before), after]));

  function restore() {
    const state = storedGame.load();
    if (Array.isArray(state?.questions)) {
      state.questions = state.questions.map(
        (item) => correctedQuestions.get(JSON.stringify(item)) || item,
      );
    }
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
    // Legacy sessions count the current word once when first restored.
    countedThrough = Number.isInteger(state.countedThrough)
      ? Math.min(state.progress.index, Math.max(-1, state.countedThrough))
      : state.progress.index - 1;
    return game.restore(state.progress);
  }

  function shuffleSession(t) {
    // Sample words, not sentences: many example sentences for a word
    // must not increase that word's chance of appearing.
    const sentencesByWord = new Map();
    for (const item of sets[t].items) {
      const key = wordKey(t, item);
      if (!sentencesByWord.has(key)) sentencesByWord.set(key, []);
      sentencesByWord.get(key).push(item);
    }
    const words = [...sentencesByWord.keys()];
    const session = [];
    while (words.length && session.length < SESSION_SIZE) {
      const weights = words.map((key) => {
        const count = wordCounts[key];
        const appearances = Number.isSafeInteger(count) && count >= 0 ? count : 0;
        return 1 / ((appearances + 1) ** 2);
      });
      let draw = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
      let index = words.length - 1;
      for (let i = 0; i < words.length; i++) {
        draw -= weights[i];
        if (draw < 0) {
          index = i;
          break;
        }
      }
      const key = words.splice(index, 1)[0];
      const variants = sentencesByWord.get(key);
      session.push(variants[Math.floor(Math.random() * variants.length)]);
    }
    return session;
  }
  function switchTab(t) {
    tab = t;
    selected = null;
    countedThrough = -1;
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

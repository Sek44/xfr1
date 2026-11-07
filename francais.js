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

        ["Ce lé", "ume est mûr.", "g"],
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

        ["La fi","e tombe du figuier.","gu"],
        ["Le lo","ement est lumineux.","g"],

        ["La fati","e se fait sentir.","gu"],
        ["Un dialo","e commence entre les amis.","gu"],
        ["La lan","e française est belle.","gu"],
        ["La dé", "ustation commence à midi.", "g"],
        ["Le re","ard est très attentif.","g"],
        ["La mar","erite pousse dans le jardin.","gu"],
        ["La ba","ette magique brille.","gu"],
        ["Une ai","ille tombe dans la boîte.","gu"],
        ["Une ba","e brille à son doigt.","gu"],
        ["La bla","e fait rire tout le monde.","gu"],
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
    s: {
      name: "s / ss",
      options: ["s", "ss"],
      items: [
        ["Le poi", "on peut être très dangereux.", "s"],
        ["Mon cou", "in vient jouer chez moi.", "s"],
        ["Il coche une ca", "e dans le tableau.", "s"],
        ["La ba", "e du château est en pierre.", "s"],
        ["Le la", "er projette un point rouge sur le mur.", "s"],
        ["La mai", "on a un toit rouge.", "s"],
        ["L'oi", "eau chante dans l'arbre.", "s"],
        ["Le rai", "in mûrit sur la vigne.", "s"],
        ["Je mange une frai", "e bien rouge.", "s"],
        ["La chai", "e est près de la table.", "s"],
        ["Une ro", "e pousse dans le jardin.", "s"],
        ["Le va", "e contient des fleurs.", "s"],
        ["Le voi", "in nous dit bonjour.", "s"],
        ["La mu", "ique accompagne la danse.", "s"],
        ["Nous allons vi", "iter le musée.", "s"],
        ["Son vi", "age est couvert de peinture.", "s"],
        ["La cui", "ine sent le gâteau chaud.", "s"],
        ["L'u", "ine fabrique des jouets.", "s"],
        ["Quel plai", "ir de jouer ensemble !", "s"],
        ["Une surpri", "e nous attend à la maison.", "s"],
        ["Une bri", "e fraîche souffle ce matin.", "s"],
        ["Sa ru", "e a trompé le dragon.", "s"],
        ["Le dé", "ert est très sec.", "s"],
        ["La fu", "ée décolle vers les étoiles.", "s"],
        ["Le pay", "age est couvert de neige.", "s"],
        ["Il faut pe", "er les pommes.", "s"],
        ["Tu dois arro", "er les plantes.", "s"],
        ["Je vais écra", "er la banane.", "s"],
        ["La ca", "erne des pompiers est ouverte.", "s"],
        ["La sai", "on des pluies commence.", "s"],
        ["Le tré", "or est caché sous le sable.", "s"],
        ["La pri", "on est entourée de murs.", "s"],
        ["Le ha", "ard lui a porté chance.", "s"],
        ["Je propo", "e un nouveau jeu.", "s"],
        ["Ce livre est po", "é sur l'étagère.", "s"],
        ["Le joueur doit vi", "er la cible.", "s"],
        ["Elle va choi", "ir un livre.", "s"],
        ["Les enfants s'amu", "ent dans le parc.", "s"],
        ["Il ra", "e sa barbe devant le miroir.", "s"],
        ["Je dépo", "e mon cartable dans l'entrée.", "s"],
        ["La banqui", "e flotte au loin.", "s"],
        ["Il po", "e une question au professeur.", "s"],
        ["J'ai une vi", "ion du futur.", "s"],
        ["C'est une occa", "ion spéciale.", "s"],
        ["Il refu", "e de manger ses légumes.", "s"],
        ["La me", "ure est juste.", "s"],
        ["Le poi", "on de cette plante ne doit pas être touché.", "s"],
        ["Ce cou", "in habite loin de chez nous.", "s"],
        ["La ro", "e est une jolie fleur.", "s"],
        ["Le voi", "in promène son chien.", "s"],
        ["Le poi", "on nage près du bateau.", "ss"],
        ["Ce cou", "in est très moelleux.", "ss"],
        ["Il ca", "e une branche en deux.", "ss"],
        ["Une note ba", "e résonne au piano.", "ss"],
        ["Ce bruit va finir par me la", "er.", "ss"],
        ["Le de", "ert arrive après le repas.", "ss"],
        ["La ta", "e est remplie de lait.", "ss"],
        ["Notre cla", "e part en sortie.", "ss"],
        ["L'a", "iette est propre.", "ss"],
        ["Ma chau", "ure est mouillée.", "ss"],
        ["Ce ti", "u est très doux.", "ss"],
        ["La bro", "e démêle les cheveux.", "ss"],
        ["Un bui", "on cache le lapin.", "ss"],
        ["Le pou", "in sort de son œuf.", "ss"],
        ["La mou", "e flotte sur l'eau.", "ss"],
        ["La vite", "e du train augmente.", "ss"],
        ["Sa réu", "ite rend ses parents heureux.", "ss"],
        ["Je pa", "e devant l'école.", "ss"],
        ["Il faut ca", "er les noix.", "ss"],
        ["Une cha", "e au trésor commence.", "ss"],
        ["Il rama", "e les feuilles mortes.", "ss"],
        ["Le vélo gli", "e sur la glace.", "ss"],
        ["Je de", "ine un dragon.", "ss"],
        ["Son me", "age est arrivé.", "ss"],
        ["Le pa", "age piéton est devant l'école.", "ss"],
        ["Une boi", "on fraîche est sur la table.", "ss"],
        ["Il ra", "ure son petit frère.", "ss"],
        ["La mi", "ion commence à l'aube.", "ss"],
        ["Sa pa", "ion est de construire des châteaux.", "ss"],
        ["Elle e", "aie son nouveau vélo.", "ss"],
        ["Le de", "in est accroché au mur.", "ss"],
        ["La le", "ive sèche dehors.", "ss"],
        ["La bou", "ole indique le nord.", "ss"],
        ["La ca", "erole chauffe sur le feu.", "ss"],
        ["Un vai", "eau spatial approche.", "ss"],
        ["Le pa", "ager attend le train.", "ss"],
        ["Le do", "ier est dans le tiroir.", "ss"],
        ["Un croi", "ant sort du four.", "ss"],
        ["La gro", "e valise est lourde.", "ss"],
        ["Le ma", "if montagneux est enneigé.", "ss"],
        ["Un profe", "eur nous accueille.", "ss"],
        ["L'impa", "e est barrée par un mur.", "ss"],
        ["Le cai", "ier sert les clients.", "ss"],
        ["Elle se pre", "e pour ne pas rater le bus.", "ss"],
        ["Ce livre est pa", "ionnant.", "ss"],
        ["La fo", "e aux lions est profonde.", "ss"],
        ["La ma", "e de la pierre est importante.", "ss"],
        ["Le ba", "in est rempli d'eau.", "ss"],
        ["Il vi", "e une vis dans le bois.", "ss"],
        ["Le proce", "us est très long.", "ss"],
        ["Cette po", "ibilité me plaît.", "ss"],
        ["Le poi", "on rouge tourne dans son bocal.", "ss"],
        ["Le cou", "in est posé sur le canapé.", "ss"],
      ],
    },
  };
  const TABS = [
    ["g", sets.g.name],
    ["c", sets.c.name],
    ["s", sets.s.name],
    ["all", "Tout"],
  ];
  // Disjoint answer alphabets identify the original family even in saved
  // mixed sessions, without adding fields to existing question triplets.
  function categoryFor(item) {
    if (sets.c.options.includes(item[2])) return "c";
    if (sets.s.options.includes(item[2])) return "s";
    return "g";
  }
  // Missing g/gu/ge must precede a vowel; s/ss questions illustrate
  // the contrast between vowels ([z] with s, [s] with ss).
  function isValidQuestion(category, item) {
    if (category === "s")
      return /[aeiouyàâäéèêëîïôöùûüÿ]$/iu.test(item[0]) &&
        /^[aeiouyàâäéèêëîïôöùûüÿ]/iu.test(item[1]);
    if (category !== "g") return true;
    return /^[aeiouyàâäéèêëîïôöùûüÿ]/iu.test(item[1]);
  }

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
  const WORD_ERRORS_KEY = "entrainement_francais_word_errors_v1";
  const wordCounts = loadWordCounts();
  const wordErrors = readCounts(WORD_ERRORS_KEY);
  const VOWEL_U_RESET_KEY = "entrainement_francais_vowel_u_reset_v1";

  // Corrected words start with fresh weighting, only once per browser.
  function resetCorrectedWordWeights() {
    try {
      if (localStorage.getItem(VOWEL_U_RESET_KEY) === "1") return;
      for (const word of ["légume", "dégustation"]) {
        const key = JSON.stringify(["g", word]);
        delete wordCounts[key];
        delete wordErrors[key];
      }
      localStorage.setItem(WORD_COUNTS_KEY, JSON.stringify(wordCounts));
      localStorage.setItem(WORD_ERRORS_KEY, JSON.stringify(wordErrors));
      localStorage.setItem(VOWEL_U_RESET_KEY, "1");
    } catch {
      // Retry on a future visit if storage is unavailable.
    }
  }
  resetCorrectedWordWeights();

  const weighting = ExerciseWeighting.create({
    appearancesKey: WORD_COUNTS_KEY,
    errorsKey: WORD_ERRORS_KEY,
    appearances: wordCounts,
    errors: wordErrors,
  });
  function recordError(category, item) {
    weighting.error(wordKey(category, item));
  }
  function recordAppearance(category, item) {
    weighting.appearance(wordKey(category, item));
  }

  let tab = "g",
    selected = null,
    lastQuestionIndex = 0,
    countedThrough = -1,
    showRetry = false;
  let questions = shuffleSession(tab);
  const storedGame = GameState.create("francais");
  const game = ExerciseGame.create({
    onChange: () => {
      if (game.index !== lastQuestionIndex) {
        selected = null;
        showRetry = false;
        lastQuestionIndex = game.index;
      }
      if (game.index < questions.length && game.index > countedThrough) {
        recordAppearance(categoryFor(questions[game.index]), questions[game.index]);
        countedThrough = game.index;
      }
      render();
      persist();
    },
    onFinish: ({ score, total }) => {
      storedGame.clear();
      ExerciseScores.save({ tab, score, total });
      window.DailyExercises?.award("francais");
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
    [["Ce lé", "me est mûr.", "gu"], ["Ce lé", "ume est mûr.", "g"]],
    [["La dé", "station commence à midi.", "gu"], ["La dé", "ustation commence à midi.", "g"]],
    [["La fi","ue tombe du figuier.","g"], ["La fi","e tombe du figuier.","gu"]],
    [["La fati","ue se fait sentir.","g"], ["La fati","e se fait sentir.","gu"]],
    [["Un dialo","ue commence entre les amis.","g"], ["Un dialo","e commence entre les amis.","gu"]],
    [["La lan","ue française est belle.","g"], ["La lan","e française est belle.","gu"]],
    [["La mar","uerite pousse dans le jardin.","gu"], ["La mar","erite pousse dans le jardin.","gu"]],
    [["Une ai","uille tombe dans la boîte.","gu"], ["Une ai","ille tombe dans la boîte.","gu"]],
    [["Une ba","ue brille à son doigt.","gu"], ["Une ba","e brille à son doigt.","gu"]],
    [["La bla","ue fait rire tout le monde.","gu"], ["La bla","e fait rire tout le monde.","gu"]],
  ].map(([before, after]) => [JSON.stringify(before), after]));

  function restore() {
    const state = storedGame.load();
    if (Array.isArray(state?.questions)) {
      let correctedCurrentAnswer = false;
      state.questions = state.questions.map((item, index) => {
        const replacement = correctedQuestions.get(JSON.stringify(item));
        if (
          replacement &&
          index === state.progress?.index &&
          replacement[2] !== item[2]
        ) {
          correctedCurrentAnswer = true;
        }
        return replacement || item;
      });
      if (correctedCurrentAnswer && state.progress) {
        // Replay an active question whose previously expected answer changed.
        state.selected = null;
        state.progress = {
          ...state.progress,
          score: Math.max(
            0,
            state.progress.score -
              (state.progress.correct && !state.progress.failed ? 1 : 0),
          ),
          correct: false,
          failed: false,
          remaining: null,
        };
      }
    }
    // Replace obsolete questions in saved sessions without losing progress.
    if (Array.isArray(state?.questions) && state.tab === "g") {
      const used = new Set(state.questions.filter((item) => isValidQuestion("g", item))
        .map((item) => wordKey("g", item)));
      const available = sets.g.items.filter((item) => !used.has(wordKey("g", item)));
      state.questions = state.questions.map((item, index) => {
        if (isValidQuestion("g", item)) return item;
        const replacement = available.shift();
        if (!replacement) return item;
        used.add(wordKey("g", replacement));
        if (index === state.progress?.index && state.progress) {
          state.selected = null;
          state.progress = {
            ...state.progress,
            score: Math.max(0, state.progress.score -
              (state.progress.correct && !state.progress.failed ? 1 : 0)),
            correct: false,
            failed: false,
            remaining: null,
          };
        }
        return replacement;
      });
    }
    if (
      !state ||
      !TABS.some(([key]) => key === state.tab) ||
      !Array.isArray(state.questions) ||
      state.questions.length !== SESSION_SIZE ||
      !state.questions.every(
        (item) =>
          Array.isArray(item) &&
          item.length === 3 &&
          item.every((part) => typeof part === "string") &&
          (state.tab === "all" || categoryFor(item) === state.tab) &&
          sets[categoryFor(item)].options.includes(item[2]) &&
          isValidQuestion(categoryFor(item), item),
      ) ||
      (state.selected !== null &&
        !sets[categoryFor(state.questions[state.progress?.index] || state.questions[0])].options.includes(state.selected)) ||
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
    // Select unique word keys from the selected family, or all in Tout.
    // Using the original family keys shares one weight history across tabs.
    const sentencesByWord = new Map();
    for (const [category, collection] of Object.entries(sets)) {
      if (t !== "all" && t !== category) continue;
      for (const item of collection.items) {
        if (!isValidQuestion(category, item)) continue;
        const key = wordKey(category, item);
        if (!sentencesByWord.has(key)) sentencesByWord.set(key, []);
        sentencesByWord.get(key).push(item);
      }
    }
    return weighting.choose(sentencesByWord, SESSION_SIZE);
  }
  function restart() {
    selected = null;
    showRetry = false;
    lastQuestionIndex = 0;
    countedThrough = -1;
    questions = shuffleSession(tab);
    game.reset(questions.length);
  }
  function switchTab(t) {
    if (!TABS.some(([key]) => key === t) || t === tab) return;
    void game.changeSettings(
      game.index > 0 || game.failed || game.correct || selected !== null,
      () => {
        tab = t;
        restart();
      },
    );
  }
  function select(v) {
    if (!game.correct) {
      if (selected !== v) showRetry = false;
      selected = v;
      render();
      persist();
    }
  }
  function verify() {
    if (selected !== null && !game.correct) {
      const isCorrect = selected === questions[game.index][2];
      showRetry = !isCorrect;
      if (!isCorrect && !game.failed) recordError(categoryFor(questions[game.index]), questions[game.index]);
      game.validate(isCorrect);
    }
  }
  function advance() {
    selected = null;
    showRetry = false;
    game.next();
  }
  // Rebuild line positions when the viewport or font metrics change.
  // A line layout based on the longest spelling is independent of the chosen answer.
  window.addEventListener("resize", () => render());
  document.fonts?.ready?.then(() => render());
  function render() {
    const tabs = document.getElementById("tabs"),
      panel = document.getElementById("panel"),
      scoreCard = document.getElementById("score-card");
    panel.replaceChildren();
    scoreCard.replaceChildren();
    scoreCard.hidden = false;
    panel.classList.toggle("academy-playing", game.index !== game.total);
    GameUI.tabs(tabs, TABS, tab, switchTab);

    const total = questions.length;
    game.progress(scoreCard, "Phrase");
    if (game.index === total) {
      game.finish(panel, restart);
      return;
    }
    const data = sets[categoryFor(questions[game.index])];
    const [before, after] = questions[game.index];
    const match = before.match(/^(.*?)([^\s]*)$/s),
      prefix = match[1],
      fragment = match[2],
      suffix = after.match(/^[^\s]*/)[0],
      remainder = after.slice(suffix.length),
      capitalize = prefix === "" && fragment === "";
    function spelling(answer, hidden) {
      const variant = make("span", hidden ? "word-reserve" : "word-visible");
      if (hidden) variant.setAttribute("aria-hidden", "true");
      variant.append(document.createTextNode(fragment));
      const value = answer === null
        ? "\u00a0"
        : capitalize ? answer.toUpperCase() : answer;
      variant.append(
        make("span", hidden ? "hole-measure" : answer === null ? "hole hole-empty" : "hole", value),
        document.createTextNode(suffix),
      );
      return variant;
    }
    // Measure normal line wrapping with the longest possible spelling.
    // Every visible spelling then uses those same line breaks, and the
    // difference in width becomes empty space at the right end of its line.
    const tokens = [];
    function tokenize(text) {
      for (const value of text.match(/\s+|\S+/gu) || [])
        tokens.push({ type: /^\s+$/u.test(value) ? "space" : "text", value });
    }
    tokenize(prefix);
    tokens.push({ type: "word" });
    tokenize(remainder);
    const reference = make("div", "sentence sentence-measure");
    reference.setAttribute("aria-hidden", "true");
    const referenceWord = make("span", "word");
    for (const option of data.options) referenceWord.append(spelling(option, true));
    referenceWord.append(spelling(selected, false));
    for (const token of tokens) {
      if (token.type === "space") {
        reference.append(document.createTextNode(token.value));
      } else {
        token.node = token.type === "word"
          ? referenceWord : make("span", "sentence-token", token.value);
        reference.append(token.node);
      }
    }
    const questionFrame = make("div", "question-frame");
    questionFrame.append(reference);
    panel.append(questionFrame);
    const controls = make("div", "keyboard-panel");
    const options = make("div", "choices");
    for (const value of data.options) {
      const b = make("button", "academy-key" + (selected === value ? " selected" : ""), value);
      b.type = "button";
      b.disabled = game.correct;
      b.onclick = () => select(value);
      options.append(b);
    }
    controls.append(options);
    const actions = make("div", "actions"),
      button = game.actionButton();
    button.disabled = !game.correct && selected === null;
    button.classList.toggle("feedback-success", game.correct);
    button.classList.toggle("feedback-retry", !game.correct && showRetry);
    button.textContent = game.correct
      ? game.index === game.total - 1
        ? "Bravo ! Voir mon score"
        : game.failed ? "Bien corrigé ! Suivant" : "Bravo ! Suivant"
      : showRetry ? "Incorrect · Réessaie" : "Vérifier";
    // Dispatch against the current state, not the state when the handler was assigned.
    button.onclick = () => game.correct ? advance() : verify();
    actions.append(button);
    controls.append(actions);
    panel.append(controls);
    // DOM test fixtures lack geometry; in that case the reference sentence
    // remains as a normal visible fallback.
    const firstToken = tokens.find((token) => token.node);
    if (typeof firstToken?.node.getBoundingClientRect !== "function") {
      reference.className = "sentence";
      reference.removeAttribute?.("aria-hidden");
      return;
    }
    const computed = window.getComputedStyle(reference);
    const lineHeight = Number.parseFloat(computed.lineHeight) ||
      Number.parseFloat(computed.fontSize) * 1.25 || 44;
    const threshold = lineHeight * .38;
    const lines = [];
    let whitespace = "";
    for (const token of tokens) {
      if (token.type === "space") {
        whitespace += token.value;
        continue;
      }
      const rect = token.node.getBoundingClientRect();
      const center = (rect.top + rect.bottom) / 2;
      let line = lines.at(-1);
      if (!line || Math.abs(center - line.center) > threshold) {
        line = { center, left: rect.left, right: rect.right, entries: [] };
        lines.push(line);
      }
      line.entries.push({ token, space: line.entries.length ? whitespace : "" });
      line.right = rect.right;
      whitespace = "";
    }
    const sentence = make("div", "sentence");
    for (const line of lines) {
      const row = make("span", "sentence-line");
      row.style.width = Math.ceil(line.right - line.left + 1) + "px";
      for (const { token, space } of line.entries) {
        if (space) row.append(document.createTextNode(space));
        if (token.type === "word") {
          const word = make("span", "word");
          word.append(spelling(selected, false));
          row.append(word);
        } else {
          row.append(document.createTextNode(token.value));
        }
      }
      sentence.append(row);
    }
    reference.replaceWith(sentence);
  }
  document.getElementById("restart-series").onclick = game.restartButton(restart).onclick;
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

"use strict";
(() => {
  const sets = FrancaisData.sets;
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
  // Missing g/gu/ge must precede a vowel. « ss » denotes [s] between
  // vowels; « s » also occurs beside consonants or at word boundaries.
  function isValidQuestion(category, item) {
    if (category === "s" && item[2] === "ss")
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
  const result = ExerciseGame.resultTracker(
    "francais", storedGame, ({ score, total }) => ({ tab, score, total }),
  );
  const rewardCategory = (index) => window.RewardRules
    ? RewardRules.key("francais", categoryFor(questions[index])) : "francais:base";
  function configureRewards() {
    result.configure?.(questions.map((_, index) => rewardCategory(index)));
  }
  configureRewards();
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
    categoryForQuestion: rewardCategory,
    onAttempt: () => result.begin?.() !== false,
    onFinish: (outcome) => result.save(outcome),
  });
  const make = GameUI.element;
  function persist() {
    if (game.index === game.total && !result.pending) {
      storedGame.clear();
      return;
    }
    storedGame.save({
      tab, questions, selected, countedThrough, progress: game.snapshot(),
      ...result.snapshot(),
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
      state.progress?.total !== state.questions.length ||
      (state.progress?.index === state.progress?.total &&
       state.pendingResult !== true) ||
      !result.restore(state)
    )
      return false;
    tab = state.tab;
    questions = state.questions;
    configureRewards();
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
    result.fresh();
    selected = null;
    showRetry = false;
    lastQuestionIndex = 0;
    countedThrough = -1;
    questions = shuffleSession(tab);
    configureRewards();
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
      game.finish(panel, restart, result.pending ? {
        message: result.message,
        retry: () => {
          result.save({ score: game.score, total: game.total, answers: game.answers });
          render();
          persist();
        },
      } : null, result.reward?.());
      return;
    }
    if (result.allowed?.() === false) {
      panel.append(GameUI.element("p", "academy-reward-unavailable",
        "Cet exercice a atteint sa limite quotidienne, ou le stockage des récompenses est indisponible."));
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
    subcategory: () => tab,
  });
  window.addEventListener("pagehide", () => {
    game.suspend();
    persist();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) game.resume();
  });
})();

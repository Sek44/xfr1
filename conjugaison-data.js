"use strict";
// Infinitive + complement pairs. Every complement works with all nine grammatical subjects.
window.ConjugaisonData = (() => {
  const groups = {
    er: [
      ["chanter", "une chanson."],
      ["jouer", "dans le jardin."],
      ["regarder", "le ciel."],
      ["dessiner", "un animal."],
      ["travailler", "dans la classe."],
      ["écouter", "une histoire."],
    ],
    ger: [
      ["manger", "une pomme."],
      ["ranger", "les jouets."],
      ["partager", "un gâteau."],
      ["nager", "dans la piscine."],
      ["voyager", "en train."],
      ["bouger", "lentement."],
    ],
    cer: [
      ["lancer", "un ballon."],
      ["placer", "un livre."],
      ["avancer", "doucement."],
      ["commencer", "le travail."],
      ["tracer", "un cercle."],
      ["effacer", "le tableau."],
    ],
    guer: [
      ["conjuguer", "un verbe."],
      ["naviguer", "sur le lac."],
      ["distinguer", "les couleurs."],
      ["fatiguer", "après la course."],
      ["intriguer", "ses camarades."],
      ["dialoguer", "calmement."],
    ],
    yer: [
      ["nettoyer", "la table."],
      ["essuyer", "la vaisselle."],
      ["employer", "un nouveau mot."],
      ["appuyer", "sur le bouton."],
      ["envoyer", "une lettre."],
      ["tutoyer", "ses amis."],
    ],
    grave: [
      ["lever", "la main."],
      ["acheter", "du pain."],
      ["mener", "la danse."],
      ["peser", "les fruits."],
      ["promener", "le chien."],
      ["geler", "dans le froid."],
    ],
    ir: [
      ["finir", "mes devoirs."],
      ["choisir", "un livre."],
      ["réussir", "cet exercice."],
      ["grandir", "chaque année."],
      ["rougir", "de timidité."],
      ["remplir", "un verre d’eau."],
      ["réfléchir", "à la réponse."],
      ["obéir", "aux consignes."],
      ["applaudir", "les artistes."],
      ["ralentir", "avant le virage."],
      ["bondir", "de joie."],
      ["bâtir", "une cabane."],
      ["avertir", "les voisins."],
      ["réunir", "le groupe."],
      ["atterrir", "en douceur."],
      ["agir", "avec prudence."],
      ["réagir", "rapidement."],
      ["saisir", "une occasion."],
      ["salir", "le tapis."],
      ["guérir", "rapidement."],
      ["nourrir", "les oiseaux."],
      ["franchir", "la ligne d’arrivée."],
    ],
  };
  // Personal pronouns and equivalent explicit subjects; never infer a 1st-person
  // singular from a nominal subject, since that is not grammatical French.
  const subjects = {
    je: ["Je"],
    tu: ["Tu"],
    il: ["Il", "Paul", "Le garçon"],
    elle: ["Elle", "Julie", "La fille"],
    on: ["On"],
    nous: ["Nous", "Paul et moi", "Julie et moi"],
    vous: ["Vous", "Paul et toi", "Julie et toi"],
    ils: ["Ils", "Paul et Julie", "Les enfants", "Mes amis"],
    elles: ["Elles", "Julie et Léa", "Les filles", "Mes amies"],
  };
  const personEndings = {
    je: "e", tu: "es", il: "e", elle: "e", on: "e",
    nous: "ons", vous: "ez", ils: "ent", elles: "ent",
  };

  const secondGroupEndings = {
    je: "is", tu: "is", il: "it", elle: "it", on: "it",
    nous: "issons", vous: "issez", ils: "issent", elles: "issent",
  };
  function conjugate(type, verb, person) {
    if (!Object.hasOwn(groups, type) ||
        !groups[type].some((entry) => entry[0] === verb) ||
        !Object.hasOwn(personEndings, person)) return null;
    if (type === "ir") return verb.slice(0, -2) + secondGroupEndings[person];
    let stem = verb.slice(0, -2);
    if (person === "nous" && type === "ger") stem += "e";
    if (person === "nous" && type === "cer") stem = stem.slice(0, -1) + "ç";
    if (person !== "nous" && person !== "vous") {
      if (type === "yer") stem = stem.slice(0, -1) + "i";
      if (type === "grave") stem = stem.replace(/e([^e]*)$/, "è$1");
    }
    return stem + personEndings[person];
  }
  // Ignore accidental whitespace around an answer while keeping French
  // spelling, accents and the grammatical person strict.
  function matchesAnswer(question, submitted) {
    if (!question || typeof submitted !== "string") return false;
    const expected = conjugate(question.type, question.verb, question.person);
    return expected !== null &&
      submitted.trim().normalize("NFC").toLocaleLowerCase("fr") === expected;
  }
  function key(question) {
    return JSON.stringify([question.type, question.verb, question.person]);
  }
  function prefix(subject, answer) {
    // Elision is required only with the personal pronoun je.
    return subject === "Je" && /^[aeiouyéèêëàâäîïôöùûü]/i.test(answer)
      ? "J’"
      : subject + " ";
  }
  function possibleQuestions(mode = "present-1") {
    const grouped = new Map();
    for (const [type, entries] of Object.entries(groups)) {
      if (mode !== "all" && (type === "ir") !== (mode === "present-2")) continue;
      for (const [verb, complement] of entries)
        for (const [person, variants] of Object.entries(subjects)) {
          const answer = conjugate(type, verb, person);
          const questions = variants.map((subject) => ({
            type, verb, person, subject, complement, answer,
          }));
          grouped.set(key(questions[0]), questions);
        }
    }
    return grouped;
  }
  function valid(question) {
    if (!question || typeof question !== "object" ||
        !Object.hasOwn(subjects, question.person) ||
        !subjects[question.person].includes(question.subject)) return false;
    const entry = groups[question.type]?.find((item) => item[0] === question.verb);
    return Boolean(entry && entry[1] === question.complement &&
      conjugate(question.type, question.verb, question.person) === question.answer);
  }
  return { groups, subjects, conjugate, matchesAnswer, key, prefix, possibleQuestions, valid };
})();

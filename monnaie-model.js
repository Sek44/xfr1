"use strict";
(function (root) {
  // Store every monetary amount as integer euro cents.
  const COINS = Object.freeze([
    { cents: 1, label: "1c", name: "1 centime", size: 40 },
    { cents: 2, label: "2c", name: "2 centimes", size: 43 },
    { cents: 5, label: "5c", name: "5 centimes", size: 46 },
    { cents: 10, label: "10c", name: "10 centimes", size: 43 },
    { cents: 20, label: "20c", name: "20 centimes", size: 47 },
    { cents: 50, label: "50c", name: "50 centimes", size: 49 },
    { cents: 100, label: "1€", name: "1 euro", size: 49 },
    { cents: 200, label: "2€", name: "2 euros", size: 53 },
  ]);
  const NOTES = Object.freeze([
    { cents: 500, label: "5€", name: "5 euros", width: 120, height: 62 },
    { cents: 1000, label: "10€", name: "10 euros", width: 127, height: 67 },
    { cents: 2000, label: "20€", name: "20 euros", width: 133, height: 72 },
    { cents: 5000, label: "50€", name: "50 euros", width: 140, height: 77 },
    { cents: 10000, label: "100€", name: "100 euros", width: 147, height: 82 },
    { cents: 20000, label: "200€", name: "200 euros", width: 153, height: 82 },
  ]);
  const denominations = new Map([...COINS, ...NOTES].map((item) => [item.cents, item]));
  const MAX_PIECES = 200;

  function randomInt(min, max, random) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
      throw new RangeError("Random must return a number in [0, 1).");
    return min + Math.floor(sample * (max - min + 1));
  }

  function makeQuestion(random = Math.random) {
    const paid = NOTES[randomInt(0, NOTES.length - 1, random)].cents;
    // Always require a non-zero change; a 200-euro note can pay up to 199.99.
    const price = randomInt(100, Math.min(19999, paid - 1), random);
    return { price, paid };
  }

  function validQuestion(question) {
    return !!question &&
      Number.isInteger(question.price) &&
      Number.isInteger(question.paid) &&
      NOTES.some((note) => note.cents === question.paid) &&
      question.price >= 100 &&
      question.price <= 19999 &&
      question.price < question.paid;
  }

  function generateQuestions(count = 10, random = Math.random) {
    if (!Number.isInteger(count) || count < 1 || count > 100)
      throw new RangeError("Invalid question count.");
    const questions = [];
    const seen = new Set();
    function append(question) {
      const key = question.paid + ":" + question.price;
      if (seen.has(key)) return;
      seen.add(key);
      questions.push(question);
    }
    for (let attempt = 0; questions.length < count && attempt < count * 80; attempt++)
      append(makeQuestion(random));
    // A deterministic fallback also supports fixed RNGs in tests.
    for (const note of NOTES) {
      for (let price = 100; questions.length < count && price < note.cents; price++)
        append({ price, paid: note.cents });
      if (questions.length === count) break;
    }
    return questions;
  }

  function validSelection(selection) {
    return Array.isArray(selection) &&
      selection.length <= MAX_PIECES &&
      selection.every((value) => Number.isInteger(value) && denominations.has(value));
  }

  function add(selection, value) {
    if (!validSelection(selection) || !denominations.has(value) ||
        selection.length >= MAX_PIECES) return selection;
    return [...selection, value];
  }

  function sortSelection(selection) {
    // Pure ordering helper: additions do not change a previously saved value.
    return [...selection].sort((a, b) => a - b);
  }

  function remove(selection, index) {
    if (!validSelection(selection) || !Number.isInteger(index) ||
        index < 0 || index >= selection.length) return selection;
    return selection.filter((_, i) => i !== index);
  }

  function sum(selection) {
    return validSelection(selection)
      ? selection.reduce((total, value) => total + value, 0)
      : null;
  }

  function isCorrect(question, selection) {
    return validQuestion(question) && validSelection(selection) &&
      selection.length > 0 && sum(selection) === question.paid - question.price;
  }

  // A humorous comment from the customer, tailored to the direction
  // of the mistake without revealing the correct change.
  function customerRemark(question, selection) {
    if (!validQuestion(question) || !validSelection(selection) || !selection.length)
      return "";
    const difference = sum(selection) - (question.paid - question.price);
    if (difference === 0) return "";
    const tooMuch = [
      "Oh, vous êtes généreux !",
      "Tout ça pour moi ? Quelle chance !",
      "Vous êtes sûr ? C'est trop !",
    ];
    const tooLittle = [
      "Ah mais il en manque !",
      "Vous voulez me voler ?",
      "Hé, il manque des pièces !",
    ];
    const choices = difference > 0 ? tooMuch : tooLittle;
    return choices[(question.price + selection.length) % choices.length];
  }

  // The compliment varies between questions but is stable while the
  // same validated answer is displayed or restored after a reload.
  function customerThanks(question) {
    if (!validQuestion(question)) return "";
    const choices = [
      "Le compte est bon, merci !",
      "Parfait, merci beaucoup !",
      "Tout est juste, merci !",
      "Impeccable, bonne journée !",
      "C'est exactement ça, bravo !",
      "Merci, vous avez l'œil !",
      "Super, il ne manque rien !",
    ];
    const hash = (Math.imul(question.price, 16777619) ^
      Math.imul(question.paid, 3266489917)) >>> 0;
    return choices[hash % choices.length];
  }

  function format(cents) {
    return (cents / 100).toFixed(2).replace(".", ",") + " €";
  }

  const api = Object.freeze({
    COINS, NOTES, MAX_PIECES, makeQuestion, validQuestion,
    generateQuestions, validSelection, add, sortSelection, remove, sum, isCorrect, customerRemark, customerThanks, format,
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MonnaieModel = api;
})(typeof window !== "undefined" ? window : null);

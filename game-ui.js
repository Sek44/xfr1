"use strict";
// Shared controls; each game retains its own rules and input limits.
window.GameUI = (() => {
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function editNumber(answer, command, maxLength) {
    if (command === "clear") return "";
    if (command === "erase") return answer.slice(0, -1);
    return /^\d$/.test(command) && answer.length < maxLength
      ? answer + command
      : answer;
  }

  function keypad(
    container,
    onInput,
    { clearLabel = "Effacer", disabled = false } = {},
  ) {
    container.replaceChildren();
    const keys = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "clear",
      "0",
      "erase",
    ];
    for (const command of keys) {
      const editing = command === "clear" || command === "erase";
      const label =
        command === "clear" ? clearLabel : command === "erase" ? "⌫" : command;
      const button = element("button", editing ? "erase" : "", label);
      button.type = "button";
      button.disabled = disabled;
      if (editing)
        button.setAttribute(
          "aria-label",
          command === "clear" ? "Tout effacer" : "Effacer le dernier chiffre",
        );
      button.onclick = () => onInput(command);
      container.append(button);
    }
    return container;
  }

  // A shared AZERTY input for spelling exercises, with essential French accents.
  function editWord(answer, command, maxLength = 24) {
    if (command === "clear") return "";
    if (command === "erase") return answer.slice(0, -1);
    if (command === "space") return answer.length < maxLength ? answer + " " : answer;
    return /^[a-zàâäéèêëîïôöùûüÿçœæ]$/i.test(command) &&
      answer.length < maxLength
      ? answer + command.toLocaleLowerCase("fr")
      : answer;
  }
  // Reusable mobile-style AZERTY. Rows mirror the physical letter positions.
  // Accent keys follow the corresponding vowel order: a, e, u, i, o, then ç.
  function azertyKeyboard(
    container,
    onInput,
    { disabled = false, clearLabel = "Tout effacer" } = {},
  ) {
    container.replaceChildren();
    const rows = [
      { name: "accents", keys: ["à", "é", "è", "ê", "ù", "û", "î", "ï", "ô", "ç"] },
      { name: "upper", keys: [..."azertyuiop"] },
      { name: "middle", keys: [..."qsdfghjklm"] },
      { name: "lower", keys: [..."wxcvbn"] },
    ];
    for (const { name, keys } of rows) {
      const row = element("div", "keyboard-row keyboard-row--" + name);
      row.style.setProperty("--keys", keys.length);
      for (const character of keys) {
        const button = element("button", "keyboard-key", character);
        button.type = "button";
        button.disabled = disabled;
        button.setAttribute("aria-label", character);
        button.onclick = () => onInput(character);
        row.append(button);
      }
      container.append(row);
    }
    const controls = element("div", "keyboard-row keyboard-row--controls");
    const actions = [
      ["clear", clearLabel, "keyboard-key--clear", "Tout effacer"],
      ["space", "Espace", "keyboard-key--space", "Insérer un espace"],
      ["erase", "⌫", "keyboard-key--erase", "Effacer la dernière lettre"],
    ];
    for (const [command, label, className, accessibleName] of actions) {
      const button = element("button", "keyboard-key " + className, label);
      button.type = "button";
      button.disabled = disabled;
      button.setAttribute("aria-label", accessibleName);
      button.onclick = () => onInput(command);
      controls.append(button);
    }
    container.append(controls);
    return container;
  }

  return { element, editNumber, keypad, editWord, azertyKeyboard };
})();

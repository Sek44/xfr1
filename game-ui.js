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
    return /^[a-zàâäéèêëîïôöùûüÿçœæ]$/i.test(command) &&
      answer.length < maxLength
      ? answer + command.toLocaleLowerCase("fr")
      : answer;
  }
  function azertyKeyboard(container, onInput, { disabled = false } = {}) {
    container.replaceChildren();
    const rows = ["azertyuiop", "qsdfghjklm", "wxcvbn", "éèêàçùûïô"];
    for (const characters of rows) {
      const row = element("div", "keyboard-row");
      row.style.setProperty("--keys", characters.length);
      for (const character of characters) {
        const button = element("button", "", character);
        button.type = "button";
        button.disabled = disabled;
        button.onclick = () => onInput(character);
        row.append(button);
      }
      container.append(row);
    }
    const controls = element("div", "keyboard-row controls");
    for (const [command, label] of [["clear", "Tout effacer"], ["erase", "⌫"]]) {
      const button = element("button", "", label);
      button.type = "button";
      button.disabled = disabled;
      button.setAttribute("aria-label", command === "erase" ? "Effacer la dernière lettre" : label);
      button.onclick = () => onInput(command);
      controls.append(button);
    }
    container.append(controls);
    return container;
  }

  return { element, editNumber, keypad, editWord, azertyKeyboard };
})();

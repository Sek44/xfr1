"use strict";
// Shared controls; each game retains its own rules and input limits.
window.GameUI = (() => {
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // The same ornate tab is used for static Conjugaison labels and
  // interactive exercise families (e.g. Français).
  function tabs(container, entries, selected, onSelect) {
    container.replaceChildren();
    for (const [value, label] of entries) {
      const active = value === selected;
      const button = element("button", "academy-tab" + (active ? " active" : ""));
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(active));
      const text = element("span", "tab-label", label);
      button.append(text);
      button.onclick = () => onSelect(value);
      container.append(button);
    }
    return container;
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
      const button = element("button", "academy-key" + (editing ? " erase" : ""), label);
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

  // Reusable AZERTY with accents, one-shot Shift and a numbers/symbols mode.
  const WORD_SYMBOLS = new Set([
    "@", "#", "€", "%", "&", "-", "+", "(", ")", "/", "*", '"', "'",
    ":", ";", "!", "?", "_", "=", ".", ",", "[", "]", "{", "}", "<", ">",
  ]);
  function wordCharacter(character) {
    return typeof character === "string" &&
      (/^[a-zàâäéèêëîïôöùûüÿçœæ0-9]$/i.test(character) ||
        WORD_SYMBOLS.has(character));
  }
  function validWordAnswer(answer, maxLength = 24) {
    return typeof answer === "string" && answer.length <= maxLength &&
      [...answer].every((character) => character === " " || wordCharacter(character));
  }
  function editWord(answer, command, maxLength = 24) {
    if (command === "clear") return "";
    if (command === "erase") return answer.slice(0, -1);
    if (command === "space") return answer.length < maxLength ? answer + " " : answer;
    return wordCharacter(command) && answer.length < maxLength ? answer + command : answer;
  }

  // Accent keys follow vowels a, e, u, i, o, then ç. Shift affects one letter.
  function azertyKeyboard(
    container,
    onInput,
    { disabled = false, clearLabel = "Tout effacer" } = {},
  ) {
    let shifted = false;
    let symbols = false;
    function render() {
      container.replaceChildren();
      const rows = symbols
        ? [
            { name: "numbers", keys: [..."1234567890"] },
            { name: "upper", keys: ["@", "#", "€", "%", "&", "-", "+", "(", ")", "/"] },
            { name: "middle", keys: ["*", '"', "'", ":", ";", "!", "?", "_", "=", "."] },
            { name: "lower", keys: [",", "[", "]", "{", "}", "<", ">", "erase"] },
          ]
        : [
            { name: "accents", keys: ["à", "é", "è", "ê", "ù", "û", "î", "ï", "ô", "ç"] },
            { name: "upper", keys: [..."azertyuiop"] },
            { name: "middle", keys: [..."qsdfghjklm"] },
            { name: "lower", keys: ["shift", ..."wxcvbn", "erase"] },
          ];

      for (const { name, keys } of rows) {
        const row = element("div", "keyboard-row keyboard-row--" + name);
        row.style.setProperty("--keys", keys.length);
        for (const character of keys) {
          const special = character === "shift" || character === "erase";
          const label = shifted && !special
            ? character.toLocaleUpperCase("fr")
            : character;
          const button = element(
            "button",
            "keyboard-key" + (special ? " keyboard-key--" + character : ""),
            character === "shift" ? undefined : character === "erase" ? "⌫" : label,
          );
          button.type = "button";
          button.disabled = disabled;
          if (character === "shift") {
            button.innerHTML =
              '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
              '<path d="M12 3 3 12h5v9h8v-9h5L12 3Z"/></svg>';
            button.setAttribute("aria-label", "Majuscule");
            button.setAttribute("aria-pressed", String(shifted));
            button.onclick = () => {
              shifted = !shifted;
              render();
            };
          } else if (character === "erase") {
            button.setAttribute("aria-label", "Effacer la dernière lettre");
            button.onclick = () => onInput("erase");
          } else {
            button.setAttribute("aria-label", label);
            button.onclick = () => {
              onInput(label);
              if (shifted) {
                shifted = false;
                render();
              }
            };
          }
          row.append(button);
        }
        container.append(row);
      }

      const controls = element("div", "keyboard-row keyboard-row--controls");
      const actions = [
        ["clear", clearLabel, "keyboard-key--clear", "Tout effacer"],
        ["space", "Espace", "keyboard-key--space", "Insérer un espace"],
        ["mode", symbols ? "ABC" : "?123", "keyboard-key--mode",
          symbols ? "Afficher les lettres" : "Afficher les chiffres et symboles"],
      ];
      for (const [command, label, className, accessibleName] of actions) {
        const button = element("button", "keyboard-key " + className, label);
        button.type = "button";
        button.disabled = disabled;
        button.setAttribute("aria-label", accessibleName);
        button.onclick = () => {
          if (command === "mode") {
            symbols = !symbols;
            shifted = false;
            render();
          } else {
            onInput(command);
          }
        };
        controls.append(button);
      }
      container.append(controls);
    }
    render();
    return container;
  }

  return { element, tabs, editNumber, keypad, editWord, validWordAnswer, azertyKeyboard };
})();

"use strict";
window.AppConfirm = (() => {
  let active = false;
  function ask({
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    theme = "light",
  }) {
    if (active) return Promise.resolve(false);
    active = true;
    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className =
        "app-confirm" + (theme === "dark" ? " app-confirm-dark" : "");
      dialog.setAttribute("aria-labelledby", "app-confirm-title");
      dialog.setAttribute("aria-describedby", "app-confirm-message");
      const heading = document.createElement("h2");
      heading.id = "app-confirm-title";
      heading.textContent = title;
      const description = document.createElement("p");
      description.id = "app-confirm-message";
      description.textContent = message;
      const actions = document.createElement("div");
      actions.className = "confirm-actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = cancelText;
      cancel.autofocus = true;
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "confirm-accept";
      confirm.textContent = confirmText;
      cancel.onclick = () => dialog.close("cancel");
      confirm.onclick = () => dialog.close("confirm");
      actions.append(cancel, confirm);
      dialog.append(heading, description, actions);
      document.body.append(dialog);
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        dialog.close("cancel");
      });
      dialog.addEventListener(
        "close",
        () => {
          const accepted = dialog.returnValue === "confirm";
          dialog.remove();
          active = false;
          resolve(accepted);
        },
        { once: true },
      );
      dialog.showModal();
    });
  }
  return { ask };
})();

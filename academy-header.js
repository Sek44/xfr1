/* Shared navigation for the classic Entraînement pages.
 * Kept separate from gameplay: callers retain their existing IDs and URLs.
 * Use a script before the page controller, after the <nav data-academy-header>.
 */
(() => {
  "use strict";

  function mount(nav) {
    const title = nav.dataset.title || "";
    const game = nav.dataset.game || "";
    const restart = nav.dataset.restart === "true";
    const scores = nav.dataset.scores === "true";
    const backId = nav.dataset.backId || "";
    const home = nav.dataset.home === "true";
    if (!title && !home) return;

    nav.replaceChildren();
    if (!home) {
    const back = document.createElement("a");
    back.className = "nav-link nav-icon academy-nav-button academy-nav-back";
    back.href = "./";
    back.setAttribute("aria-label", "Retour à l’accueil");
    back.title = "Accueil";
    if (backId) back.id = backId;

    const heading = document.createElement("h1");
    heading.className = "page-title";
    const artwork = document.createElement("span");
    artwork.className = "academy-title-art academy-title-art--" + (nav.dataset.icon || "scores");
    artwork.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = title;
    heading.append(artwork, label);
    nav.append(back, heading);
    }

    if (restart) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = "restart-series";
      button.className = "nav-link nav-icon restart-header academy-nav-button academy-nav-restart";
      button.setAttribute("aria-label", "Recommencer la série");
      button.title = "Recommencer la série";
      nav.append(button);
    }
    if (scores) {
      const link = document.createElement("a");
      link.className = "nav-link nav-icon academy-nav-button academy-nav-scores";
      link.href = home
        ? "./scores.html?from=home"
        : "./scores.html?game=" + encodeURIComponent(game) + "&from=" + encodeURIComponent(game);
      link.setAttribute("aria-label", "Voir les scores");
      link.title = "Mes scores";
      nav.append(link);
    } else if (!restart) {
      const spacer = document.createElement("span");
      spacer.className = "banner-spacer";
      spacer.setAttribute("aria-hidden", "true");
      nav.append(spacer);
    }
  }

  for (const nav of document.querySelectorAll("[data-academy-header]")) mount(nav);
  window.AcademyHeader = Object.freeze({ mount });
})();

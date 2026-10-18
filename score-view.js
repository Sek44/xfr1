"use strict";
// Keep the game alive so its exact state survives a scores visit.
window.ScoreView = (() => {
  function bind({ suspend = () => {}, resume = () => {} } = {}) {
    let frame = null,
      animations = [];
    function hide() {
      if (!frame) return;
      frame.remove();
      frame = null;
      for (const a of animations) a.play();
      animations = [];
      resume();
    }
    function show(url) {
      if (frame) return;
      suspend();
      animations = document
        .getAnimations()
        .filter((a) => a.playState === "running");
      for (const a of animations) a.pause();
      frame = document.createElement("iframe");
      frame.title = "Mes scores";
      frame.className = "scores-view";
      frame.src = url;
      document.body.append(frame);
      frame.focus();
    }
    document.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        !url.pathname.endsWith("/scores.html")
      )
        return;
      event.preventDefault();
      history.pushState(
        { ...history.state, exerciseScores: url.href },
        "",
        url.href,
      );
      show(url.href);
    });
    window.addEventListener("popstate", () => {
      if (history.state?.exerciseScores) show(history.state.exerciseScores);
      else hide();
    });
    window.addEventListener("message", (event) => {
      if (
        frame &&
        event.origin === location.origin &&
        event.source === frame.contentWindow &&
        event.data?.type === "exercise-scores-back"
      ) {
        if (history.state?.exerciseScores) history.back();
        else hide();
      }
    });
    return {
      get open() {
        return !!frame;
      },
    };
  }
  return { bind };
})();

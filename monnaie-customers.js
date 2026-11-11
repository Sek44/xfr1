"use strict";
window.MonnaieCustomers = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const PEOPLE = Object.freeze([
    { id: "bob", skin: "#e9b88f", hair: "#583d37", top: "#548ba5", back: "#dceaf4", style: "bob" },
    { id: "swept", skin: "#ba805e", hair: "#272b40", top: "#c16b5b", back: "#f4dfcf", style: "swept", glasses: true },
    { id: "curls", skin: "#80523e", hair: "#25202e", top: "#e2a84b", back: "#dfe8d7", style: "curls" },
    { id: "bun", skin: "#f2caab", hair: "#9c623d", top: "#8678b5", back: "#f2e3ed", style: "bun" },
    { id: "cap", skin: "#d6a17a", hair: "#40302e", top: "#5f967b", back: "#dbece6", style: "cap" },
    { id: "short", skin: "#c69069", hair: "#755b4a", top: "#477cba", back: "#e5e5f3", style: "short", beard: true },
  ]);

  function node(tag, attributes = {}) {
    const item = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes))
      item.setAttribute(key, String(value));
    return item;
  }
  function path(d, fill, other = {}) {
    return node("path", { d, fill, ...other });
  }
  function circle(cx, cy, r, fill, other = {}) {
    return node("circle", { cx, cy, r, fill, ...other });
  }
  function ellipse(cx, cy, rx, ry, fill, other = {}) {
    return node("ellipse", { cx, cy, rx, ry, fill, ...other });
  }

  // Question values already come from random generation. Hashing them keeps
  // each customer's look stable on redraw, score visits and page reloads.
  function choose(question) {
    const hash = (Math.imul(question.price, 2654435761) ^
      Math.imul(question.paid, 2246822519)) >>> 0;
    return PEOPLE[hash % PEOPLE.length];
  }

  function create(question) {
    const person = choose(question);
    const portrait = node("svg", {
      viewBox: "0 0 64 64", class: "money-customer-svg",
      "aria-hidden": "true", focusable: "false",
    });
    portrait.append(
      circle(32, 32, 30, person.back, { stroke: "#faf2df", "stroke-width": 2 }),
      path("M8 62Q10 46 27 45H37Q54 46 56 62Z", person.top,
        { stroke: "#45546d", "stroke-width": 1.2 }),
      path("M27 44L32 51L37 44", "#fff5e6"),
      node("rect", { x: 28, y: 40, width: 8, height: 9, rx: 3, fill: person.skin }),
    );
    if (person.style === "bun")
      portrait.append(circle(45, 16, 10, person.hair));
    if (person.style === "bob")
      portrait.append(ellipse(32, 30, 18, 24, person.hair));
    portrait.append(
      ellipse(19, 30, 3.2, 5, person.skin),
      ellipse(45, 30, 3.2, 5, person.skin),
      ellipse(32, 29, 13.7, 17.4, person.skin),
      ellipse(27, 31, 1.45, 1.75, "#3d3536"),
      ellipse(37, 31, 1.45, 1.75, "#3d3536"),
      path("M29 39Q32 41.5 35 39", "none",
        { stroke: "#8c5348", "stroke-width": 1.5, "stroke-linecap": "round" }),
    );

    switch (person.style) {
      case "bob":
        portrait.append(path("M18 31Q16 9 33 11Q51 10 46 34L43 24Q32 20 21 27Z", person.hair));
        break;
      case "swept":
        portrait.append(path("M18 27Q17 10 32 11Q44 9 48 22Q37 17 26 23L19 32Z", person.hair));
        break;
      case "curls":
        portrait.append(
          circle(20, 21, 7, person.hair),
          circle(26, 15, 7, person.hair),
          circle(35, 14, 7, person.hair),
          circle(43, 20, 7, person.hair),
          circle(47, 26, 5, person.hair),
        );
        break;
      case "bun":
        portrait.append(path("M19 29Q16 12 30 12Q44 10 46 28Q34 22 25 25L20 33Z", person.hair));
        break;
      case "cap":
        portrait.append(
          path("M18 24Q17 10 32 10Q47 10 47 24Z", "#427d78"),
          path("M17 23Q33 18 51 24Q41 29 18 26Z", "#346b67"),
        );
        break;
      default:
        portrait.append(path("M18 26Q18 12 32 12Q46 12 46 26Q36 20 28 23L19 29Z", person.hair));
        break;
    }
    if (person.glasses)
      portrait.append(path("M21 29h11v7H21zM33 29h11v7H33zM32 31h1",
        "none", { stroke: "#39414c", "stroke-width": 1.5, "stroke-linejoin": "round" }));
    if (person.beard)
      portrait.append(path("M21 35Q22 47 32 47Q42 47 43 35Q38 43 32 43Q26 43 21 35Z",
        person.hair, { "fill-opacity": ".7" }));
    return portrait;
  }

  return Object.freeze({ choose, create });
})();

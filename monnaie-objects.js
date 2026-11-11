"use strict";
window.MonnaieObjects = (() => {
  const NS = "http://www.w3.org/2000/svg";
  // Rough everyday shop prices in euro cents. These are illustrative,
  // not price quotations; the chosen item stays stable across reloads.
  const ITEMS = Object.freeze([
    { id: "apple", name: "une pomme", min: 100, max: 499 },
    { id: "bread", name: "une baguette", min: 100, max: 499 },
    { id: "pencil", name: "un crayon", min: 100, max: 650 },
    { id: "notebook", name: "un cahier", min: 300, max: 1299 },
    { id: "mug", name: "une tasse", min: 500, max: 1999 },
    { id: "plant", name: "une plante", min: 500, max: 2500 },
    { id: "book", name: "un livre", min: 1000, max: 3500 },
    { id: "ball", name: "un ballon", min: 1200, max: 3500 },
    { id: "teddy", name: "une peluche", min: 1200, max: 4000 },
    { id: "backpack", name: "un sac à dos", min: 2500, max: 9000 },
    { id: "sneaker", name: "une chaussure", min: 3500, max: 13000 },
    { id: "headphones", name: "un casque audio", min: 4000, max: 17000 },
    { id: "tablet", name: "une tablette", min: 9000, max: 19999 },
    { id: "camera", name: "un appareil photo", min: 9000, max: 19999 },
  ]);

  function choose(question) {
    const price = question.price;
    const matches = ITEMS.filter((item) => price >= item.min && price <= item.max);
    if (!matches.length) throw new RangeError("No matching shop object.");
    // Both inputs are generated randomly as part of the exercise. A
    // deterministic choice avoids changing the image on page refresh.
    const hash = (Math.imul(price, 2654435761) ^
      Math.imul(question.paid, 2246822519)) >>> 0;
    return matches[hash % matches.length];
  }

  function node(tag, attributes = {}) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes))
      element.setAttribute(key, String(value));
    return element;
  }
  const rect = (x, y, w, h, fill, more = {}) =>
    node("rect", { x, y, width: w, height: h, fill, ...more });
  const circle = (cx, cy, r, fill, more = {}) =>
    node("circle", { cx, cy, r, fill, ...more });
  const ellipse = (cx, cy, rx, ry, fill, more = {}) =>
    node("ellipse", { cx, cy, rx, ry, fill, ...more });
  const path = (d, fill, more = {}) =>
    node("path", { d, fill, ...more });
  const line = (x1, y1, x2, y2, stroke, more = {}) =>
    node("line", { x1, y1, x2, y2, stroke, ...more });
  const polygon = (points, fill, more = {}) =>
    node("polygon", { points, fill, ...more });

  function create(item) {
    const svg = node("svg", {
      viewBox: "0 0 72 72", class: "money-object-svg",
      role: "img", "aria-label": item.name, focusable: "false",
    });
    // Soft cast shadow ties the set of simple illustrations together.
    svg.append(ellipse(36, 64, 25, 3, "#5a4535", { "fill-opacity": ".14" }));
    const add = (...shapes) => svg.append(...shapes);
    switch (item.id) {
      case "apple":
        add(
          path("M36 27C20 17 11 33 17 48S29 61 36 58C43 61 54 61 58 47S51 18 36 27Z", "#e85049", { stroke: "#ab363b", "stroke-width": 2 }),
          ellipse(27, 37, 5, 8, "#ffada0", { "fill-opacity": ".75", transform: "rotate(30 27 37)" }),
          path("M36 27Q36 18 41 12", "none", { stroke: "#6d4a2c", "stroke-width": 3, "stroke-linecap": "round" }),
          path("M40 20Q53 11 58 20Q51 29 40 20", "#6ca850", { stroke: "#4c823f", "stroke-width": 1 }),
        ); break;
      case "bread":
        add(
          path("M11 48Q5 38 16 26Q34 12 57 15Q65 18 60 32Q45 54 19 55Q13 55 11 48Z", "#e8ac58", { stroke: "#af6f30", "stroke-width": 2 }),
          path("M13 43Q26 26 54 18", "none", { stroke: "#f8d18b", "stroke-width": 7, "stroke-linecap": "round" }),
          path("M24 29L29 40M37 21L43 32M49 18L56 25", "none", { stroke: "#ad6c32", "stroke-width": 2.5, "stroke-linecap": "round" }),
        ); break;
      case "pencil":
        add(
          polygon("12,53 44,12 57,21 24,61", "#f5c944", { stroke: "#bf882a", "stroke-width": 1.5 }),
          polygon("12,53 24,61 10,65", "#ecc39a", { stroke: "#bb8660", "stroke-width": 1 }),
          polygon("10,65 12,56 18,62", "#474652"),
          polygon("44,12 51,5 64,14 57,21", "#ec7d88", { stroke: "#b75767", "stroke-width": 1.5 }),
          line(21, 52, 52, 15, "#fff3b1", { "stroke-width": 2 }),
        ); break;
      case "notebook":
        add(
          rect(18, 11, 40, 51, "#82add7", { rx: 3, stroke: "#3f6eaa", "stroke-width": 2 }),
          rect(24, 15, 30, 42, "#e6f5ff", { rx: 2 }),
          line(30, 27, 48, 27, "#82add7", { "stroke-width": 2 }),
          line(30, 34, 48, 34, "#82add7", { "stroke-width": 2 }),
          line(30, 41, 44, 41, "#82add7", { "stroke-width": 2 }),
          rect(18, 11, 6, 51, "#4e83b6", { rx: 1 }),
          ...[17, 27, 37, 47, 57].map((y) => circle(20, y, 1.8, "#f3d9a0")),
        ); break;
      case "mug":
        add(
          path("M24 27V48Q24 58 38 58T52 48V27Z", "#f7a9aa", { stroke: "#ba666f", "stroke-width": 2 }),
          path("M50 31Q66 28 64 43T52 49", "none", { stroke: "#ba666f", "stroke-width": 5, "stroke-linecap": "round" }),
          ellipse(38, 27, 14, 4, "#f3f1dc", { stroke: "#ba666f", "stroke-width": 1.5 }),
          path("M32 19Q27 14 33 9M43 19Q39 14 44 8", "none", { stroke: "#a8a3a2", "stroke-width": 2, "stroke-linecap": "round" }),
          circle(38, 42, 5, "#fff8e9"),
        ); break;
      case "plant":
        add(
          line(36, 46, 36, 16, "#477f49", { "stroke-width": 3 }),
          path("M36 31Q11 32 17 15Q31 13 36 31Z", "#6cb770", { stroke: "#387949", "stroke-width": 1.2 }),
          path("M36 25Q53 6 62 17Q58 34 36 25Z", "#75c17d", { stroke: "#387949", "stroke-width": 1.2 }),
          path("M35 40Q14 46 14 30Q29 25 35 40Z", "#6ebd61"),
          path("M36 40Q56 25 61 39Q54 50 36 40Z", "#4e9f66"),
          polygon("22,46 51,46 46,61 27,61", "#d98c69", { stroke: "#a8624d", "stroke-width": 1.5 }),
          rect(21, 44, 31, 5, "#e9a181", { rx: 1 }),
        ); break;
      case "book":
        add(
          path("M13 19Q23 13 35 20Q45 13 59 19V57Q46 52 35 59Q22 52 13 57Z", "#347bb2", { stroke: "#25517d", "stroke-width": 2 }),
          path("M17 21Q27 18 35 25V54Q25 47 17 51Z", "#f7eed9"),
          path("M35 25Q46 18 55 21V51Q45 47 35 54Z", "#fff8e9"),
          line(35, 25, 35, 58, "#25517d", { "stroke-width": 2 }),
          line(21, 30, 31, 32, "#a6a5b3", { "stroke-width": 1.5 }),
          line(39, 32, 51, 30, "#a6a5b3", { "stroke-width": 1.5 }),
        ); break;
      case "ball":
        add(
          circle(36, 36, 26, "#fffaf0", { stroke: "#555f70", "stroke-width": 2 }),
          polygon("36,23 47,31 43,44 29,44 25,31", "#414a5f"),
          path("M25 31L13 26M47 31L58 26M29 44L22 56M43 44L50 56M36 23V10", "none", { stroke: "#555f70", "stroke-width": 2 }),
          path("M12 32L19 41M60 32L53 41", "none", { stroke: "#7c8393", "stroke-width": 1.5 }),
        ); break;
      case "teddy":
        add(
          circle(22, 18, 10, "#ba8b61", { stroke: "#885c43", "stroke-width": 1.4 }),
          circle(50, 18, 10, "#ba8b61", { stroke: "#885c43", "stroke-width": 1.4 }),
          ellipse(36, 46, 22, 18, "#ba8b61", { stroke: "#885c43", "stroke-width": 1.5 }),
          circle(36, 29, 22, "#c99b71", { stroke: "#885c43", "stroke-width": 1.5 }),
          circle(29, 26, 2.7, "#3e3431"),
          circle(44, 26, 2.7, "#3e3431"),
          ellipse(36, 36, 10, 8, "#f2d6b8"),
          ellipse(36, 33, 4, 3, "#4c3831"),
          path("M32 40Q36 44 40 40", "none", { stroke: "#654637", "stroke-width": 1.6, "stroke-linecap": "round" }),
          ellipse(36, 53, 10, 7, "#e7c3a0"),
        ); break;
      case "backpack":
        add(
          path("M21 30V19Q21 8 36 8T51 19V30", "none", { stroke: "#6f4374", "stroke-width": 5, "stroke-linecap": "round" }),
          path("M17 30Q17 15 36 15T55 30V59H17Z", "#9d68b4", { stroke: "#674275", "stroke-width": 2 }),
          rect(22, 40, 28, 19, "#bc8bc9", { rx: 5, stroke: "#674275", "stroke-width": 1.5 }),
          rect(27, 25, 18, 8, "#8e5aa9", { rx: 3 }),
          line(28, 47, 44, 47, "#ead3ef", { "stroke-width": 2 }),
          circle(36, 33, 2, "#ffe1a6"),
        ); break;
      case "sneaker":
        add(
          path("M10 42Q18 39 23 25Q30 24 37 39L56 44Q63 46 64 53V58H9V48Q9 44 10 42Z", "#61abc2", { stroke: "#316b86", "stroke-width": 2 }),
          path("M9 54H64V59Q42 65 9 59Z", "#f9f9f3", { stroke: "#80939a", "stroke-width": 1.5 }),
          path("M27 35L39 39M25 40L37 44M23 45L34 49", "none", { stroke: "#f4f9f9", "stroke-width": 2.2, "stroke-linecap": "round" }),
          path("M45 47Q51 48 56 46", "none", { stroke: "#e1f5ff", "stroke-width": 3 }),
        ); break;
      case "headphones":
        add(
          path("M15 43V33Q15 11 36 11T57 33V43", "none", { stroke: "#3c5e8e", "stroke-width": 9, "stroke-linecap": "round" }),
          path("M15 43V33Q15 11 36 11T57 33V43", "none", { stroke: "#8cb8df", "stroke-width": 4, "stroke-linecap": "round" }),
          rect(8, 38, 15, 20, "#4f83b7", { rx: 6, stroke: "#294f7b", "stroke-width": 2 }),
          rect(49, 38, 15, 20, "#4f83b7", { rx: 6, stroke: "#294f7b", "stroke-width": 2 }),
          rect(18, 40, 6, 15, "#b2d3e9", { rx: 2 }),
          rect(48, 40, 6, 15, "#b2d3e9", { rx: 2 }),
        ); break;
      case "tablet":
        add(
          rect(12, 8, 48, 56, "#333c53", { rx: 5, stroke: "#1d2635", "stroke-width": 2 }),
          rect(16, 13, 40, 44, "#8bd3ea", { rx: 2 }),
          path("M16 42Q25 25 36 33T56 23V57H16Z", "#69bda0"),
          circle(43, 23, 7, "#ffe2a0"),
          rect(21, 45, 13, 8, "#f4b9a9", { rx: 2 }),
          circle(36, 60, 1.7, "#f4f5e9"),
        ); break;
      case "camera":
        add(
          rect(10, 24, 52, 34, "#586479", { rx: 5, stroke: "#333a4a", "stroke-width": 2 }),
          rect(20, 17, 20, 9, "#8c98a7", { rx: 2 }),
          rect(47, 19, 8, 5, "#dfb975", { rx: 1 }),
          circle(36, 41, 15, "#d3e1e7", { stroke: "#384353", "stroke-width": 3 }),
          circle(36, 41, 10, "#557eac", { stroke: "#344968", "stroke-width": 2 }),
          circle(36, 41, 5, "#a5ddeb"),
          circle(39, 38, 2, "#f3ffff"),
          circle(17, 30, 2, "#ffdb8a"),
        ); break;
      default:
        throw new RangeError("Unknown shop object: " + item.id);
    }
    return svg;
  }

  return Object.freeze({ ITEMS, choose, create });
})();

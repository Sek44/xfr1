"use strict";
window.MonnaieArt = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const notes = {
    500: ["#aeb6bd", "#606b78"],
    1000: ["#d97a7e", "#8e3d50"],
    2000: ["#6f9ed6", "#31588b"],
    5000: ["#efb269", "#a35c2b"],
    10000: ["#7fbd98", "#35714e"],
    20000: ["#d3ca82", "#77713e"],
  };

  function node(tag, attributes, text) {
    const element = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attributes))
      element.setAttribute(name, String(value));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function coin(item) {
    const value = item.cents;
    const palette = value <= 5
      ? ["#b66d3d", "#e0a272", "#7c482f", "#563324"]
      : value <= 50
        ? ["#c59c46", "#edd07e", "#916e2e", "#614920"]
        : value === 100
          ? ["#d7b35b", "#cbd5d8", "#95752e", "#43565d"]
          : ["#b6c7d0", "#ebcb72", "#6e858d", "#674e25"];
    const svg = node("svg", {
      viewBox: "0 0 100 100", class: "money-svg money-svg--coin",
      "aria-hidden": "true", focusable: "false",
    });
    svg.append(
      node("circle", { cx: 50, cy: 50, r: 47, fill: palette[0], stroke: palette[2], "stroke-width": 3 }),
      node("circle", { cx: 50, cy: 50, r: 43, fill: "none", stroke: "#fff7d0", "stroke-opacity": ".57", "stroke-width": 2, "stroke-dasharray": "2 2.8" }),
      node("circle", { cx: 50, cy: 50, r: 36, fill: palette[1], stroke: palette[2], "stroke-width": 1.8 }),
      node("circle", { cx: 50, cy: 50, r: 31.5, fill: "none", stroke: "#fff", "stroke-opacity": ".35", "stroke-width": 1 }),
      node("path", { d: "M26 68Q40 77 57 72", fill: "none", stroke: "#fff", "stroke-opacity": ".32", "stroke-width": 2, "stroke-linecap": "round" }),
      node("text", {
        x: 50, y: 59, "text-anchor": "middle",
        "font-family": "Arial, sans-serif", "font-weight": 800,
        "font-size": value >= 10 && value < 100 ? 31 : 35,
        "letter-spacing": "-1", fill: palette[3],
      }, item.label),
    );
    return svg;
  }

  function note(item) {
    const [paper, ink] = notes[item.cents];
    const width = item.width;
    const height = item.height;
    const middle = (width + 4) / 2;
    const svg = node("svg", {
      viewBox: "0 0 " + (width + 4) + " " + (height + 4),
      class: "money-svg money-svg--note",
      "aria-hidden": "true", focusable: "false",
    });
    svg.append(
      node("rect", { x: 2, y: 2, width, height, rx: 7, fill: paper, stroke: ink, "stroke-width": 2.5 }),
      node("rect", { x: 7, y: 7, width: width - 10, height: height - 10, rx: 4, fill: "#fff", "fill-opacity": ".16", stroke: "#fff", "stroke-opacity": ".6", "stroke-width": 1 }),
      node("path", { d: "M14 " + (height - 14) + "V23Q14 17 21 17H38Q45 17 45 23V" + (height - 14) + "M20 " + (height - 14) + "V29Q20 24 27 24H33Q40 24 40 29V" + (height - 14) + "M21 42H39", fill: "none", stroke: ink, "stroke-opacity": ".5", "stroke-width": 3, "stroke-linecap": "round" }),
      node("path", { d: "M" + (width - 35) + " 17h20v" + (height - 33) + "h-20zM" + (width - 31) + " 22h12v" + (height - 43) + "h-12z", fill: "none", stroke: ink, "stroke-opacity": ".48", "stroke-width": 1.6 }),
      node("path", { d: "M51 14h" + (width - 94) + "M51 " + (height - 12) + "h" + (width - 94), stroke: "#fff", "stroke-opacity": ".6", "stroke-width": 2, "stroke-linecap": "round" }),
      node("text", {
        x: middle, y: height / 2 + 12, "text-anchor": "middle",
        "font-family": "Arial, sans-serif", "font-weight": 800,
        "font-size": item.cents >= 10000 ? 30 : 34,
        "letter-spacing": "-1.5", fill: ink,
        stroke: "#fff", "stroke-opacity": ".26", "stroke-width": ".7", "paint-order": "stroke",
      }, item.label),
    );
    return svg;
  }

  function create(item) {
    return item.cents <= 200 ? coin(item) : note(item);
  }
  return Object.freeze({ create });
})();

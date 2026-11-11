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
    const cent = value < 100;
    const palette = value <= 5
      ? ["#b66d3d", "#e8b183", "#8f5935", "#5a3520"]
      : value <= 50
        ? ["#c59c46", "#f0d78d", "#967430", "#5f491f"]
        : value === 100
          ? ["#d9b966", "#cfd7da", "#9d7e33", "#3f545d"]
          : ["#bccbd2", "#efcf78", "#738890", "#604920"];
    const svg = node("svg", {
      viewBox: "0 0 100 100", class: "money-svg money-svg--coin",
      "aria-hidden": "true", focusable: "false",
    });
    svg.append(
      // Centimes have more delicate edges; euro pieces retain a thicker ring.
      node("circle", {
        cx: 50, cy: 50, r: 47, fill: palette[0], stroke: palette[2],
        "stroke-width": cent ? 1.6 : 3,
      }),
      node("circle", {
        cx: 50, cy: 50, r: 43, fill: "none", stroke: "#fff7d0",
        "stroke-opacity": ".53", "stroke-width": cent ? 1 : 1.6,
        "stroke-dasharray": "2 2.8",
      }),
      node("circle", {
        cx: 50, cy: 50, r: 36, fill: palette[1], stroke: palette[2],
        "stroke-width": cent ? 1.1 : 1.8,
      }),
      node("circle", {
        cx: 50, cy: 50, r: 31.5, fill: "none", stroke: "#fff",
        "stroke-opacity": ".28", "stroke-width": .9,
      }),
      node("path", {
        d: "M26 68Q40 77 57 72", fill: "none", stroke: "#fff",
        "stroke-opacity": ".3", "stroke-width": 1.7, "stroke-linecap": "round",
      }),
      node("text", {
        x: 50, y: 60, "text-anchor": "middle",
        "font-family": "Arial, sans-serif", "font-weight": 800,
        "font-size": value >= 10 && value < 100 ? 35 : 37,
        "letter-spacing": "-1", fill: palette[3],
      }, item.label),
    );
    return svg;
  }

  function note(item) {
    const [paper, ink] = notes[item.cents];
    const width = item.width;
    const height = item.height;
    const cx = (width + 4) / 2;
    const cy = (height + 4) / 2;
    const svg = node("svg", {
      viewBox: "0 0 " + (width + 4) + " " + (height + 4),
      class: "money-svg money-svg--note",
      "aria-hidden": "true", focusable: "false",
    });
    const mainFont = item.cents >= 10000 ? 29 : 34;

    svg.append(
      // Euro-inspired simplified banknote: colour, engraved borders, arches and watermark.
      node("rect", {
        x: 2, y: 2, width, height, rx: 4, fill: paper,
        stroke: ink, "stroke-width": 1.8,
      }),
      node("rect", {
        x: 6, y: 6, width: width - 8, height: height - 8, rx: 2,
        fill: "#fff", "fill-opacity": ".08",
        stroke: "#fff", "stroke-opacity": ".63", "stroke-width": 1.1,
      }),
      node("rect", {
        x: 10, y: 10, width: width - 16, height: height - 16, rx: 2,
        fill: "none", stroke: ink, "stroke-opacity": ".27",
        "stroke-width": .85, "stroke-dasharray": "2 2",
      }),
      node("path", {
        d: "M14 " + (height - 12) +
          "V25Q14 14 25 14H33Q44 14 44 25V" + (height - 12) +
          "M20 " + (height - 12) +
          "V28Q20 20 27 20H31Q38 20 38 28V" + (height - 12) +
          "M23 39H35",
        fill: "none", stroke: ink, "stroke-opacity": ".42",
        "stroke-width": 2, "stroke-linecap": "round",
      }),
      node("path", {
        d: "M" + (width - 42) + " 16h25v" + (height - 32) + "h-25z" +
          "M" + (width - 36) + " 22h13v" + (height - 44) + "h-13z" +
          "M" + (width - 42) + " 34h25",
        fill: "none", stroke: ink, "stroke-opacity": ".4",
        "stroke-width": 1.2,
      }),
      node("circle", {
        cx: width - 28, cy: cy, r: 15, fill: "#fff",
        "fill-opacity": ".18", stroke: ink,
        "stroke-opacity": ".2", "stroke-width": 1,
      }),
      node("circle", {
        cx: width - 28, cy: cy, r: 10, fill: "none", stroke: "#fff",
        "stroke-opacity": ".45", "stroke-width": 1.3,
      }),
      node("path", {
        d: "M12 " + (height - 7) + "H" + (width - 8) +
          "M12 15H" + (width - 8),
        fill: "none", stroke: "#fff", "stroke-opacity": ".45",
        "stroke-width": 1,
      }),
      // A solid low-noise region keeps every denomination legible at small sizes.
      node("rect", {
        x: cx - 40, y: cy - 19, width: 80, height: 38, rx: 5,
        fill: "#fffaf1", "fill-opacity": ".86",
        stroke: ink, "stroke-opacity": ".23", "stroke-width": 1,
      }),
      node("text", {
        x: cx, y: cy + 10, "text-anchor": "middle",
        "font-family": "Arial, sans-serif", "font-weight": 800,
        "font-size": mainFont, "letter-spacing": "-1.35", fill: ink,
      }, item.label),
      node("text", {
        x: 12, y: 13, "font-family": "Arial, sans-serif",
        "font-weight": 700, "font-size": 6, fill: ink,
      }, "EURO"),
      node("text", {
        x: width - 8, y: 13, "text-anchor": "end",
        "font-family": "Arial, sans-serif", "font-weight": 700,
        "font-size": 8, fill: ink,
      }, "€"),
      node("text", {
        x: 12, y: height - 6, "font-family": "Arial, sans-serif",
        "font-weight": 700, "font-size": 5, fill: ink,
      }, "EUR"),
      node("text", {
        x: width - 8, y: height - 6, "text-anchor": "end",
        "font-family": "Arial, sans-serif", "font-weight": 700,
        "font-size": 5, fill: ink, "fill-opacity": ".65",
      }, "EU 2026"),
    );
    return svg;
  }

  function create(item) {
    return item.cents <= 200 ? coin(item) : note(item);
  }
  return Object.freeze({ create });
})();

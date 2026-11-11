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

  // Centimes have a dedicated, flatter SVG: a fine milled edge rather
  // than the thick concentric or bimetallic rings of €1 and €2.
  function centCoin(item) {
    const copper = item.cents <= 5;
    const edge = copper ? "#85502f" : "#94712c";
    const surface = copper ? "#d39160" : "#dfbd66";
    const shine = copper ? "#edb68b" : "#f1d88d";
    const ink = copper ? "#583521" : "#655024";
    const svg = node("svg", {
      viewBox: "0 0 100 100",
      class: "money-svg money-svg--coin money-svg--cent",
      "aria-hidden": "true", focusable: "false",
    });
    svg.append(
      node("circle", {
        cx: 50, cy: 50, r: 47, fill: surface, stroke: edge,
        "stroke-width": 1.15,
      }),
      node("circle", {
        cx: 50, cy: 50, r: 44, fill: "none", stroke: shine,
        "stroke-width": .85, "stroke-opacity": ".9",
      }),
      node("circle", {
        cx: 50, cy: 50, r: 40, fill: "none", stroke: edge,
        "stroke-width": .7, "stroke-opacity": ".42",
      }),
      // Faint geographical engraving and a ring of small star-like dots
      // recall euro cent coins without obscuring the educational label.
      node("path", {
        d: "M26 34Q38 18 52 27T73 36M28 64Q42 78 62 69T77 53",
        fill: "none", stroke: edge, "stroke-opacity": ".22",
        "stroke-width": 1.1, "stroke-linecap": "round",
      }),
    );
    for (let n = 0; n < 12; n++) {
      const angle = (n * Math.PI) / 6 - Math.PI / 2;
      svg.append(node("circle", {
        cx: (50 + 37 * Math.cos(angle)).toFixed(2),
        cy: (50 + 37 * Math.sin(angle)).toFixed(2),
        r: 1.05, fill: edge, "fill-opacity": ".55",
      }));
    }
    svg.append(
      node("text", {
        x: 50, y: 60, "text-anchor": "middle",
        "font-family": "Arial, sans-serif", "font-weight": 800,
        "font-size": item.cents >= 10 ? 35 : 37,
        "letter-spacing": "-1", fill: ink,
        stroke: shine, "stroke-width": 1.7, "paint-order": "stroke",
      }, item.label),
    );
    return svg;
  }

  function euroCoin(item) {
    const palette = item.cents === 100
      ? ["#d9b966", "#cfd7da", "#9d7e33", "#3f545d"]
      : ["#bccbd2", "#efcf78", "#738890", "#604920"];
    const svg = node("svg", {
      viewBox: "0 0 100 100",
      class: "money-svg money-svg--coin money-svg--euro",
      "aria-hidden": "true", focusable: "false",
    });
    svg.append(
      node("circle", {
        cx: 50, cy: 50, r: 47, fill: palette[0],
        stroke: palette[2], "stroke-width": 3,
      }),
      node("circle", {
        cx: 50, cy: 50, r: 43, fill: "none", stroke: "#fff7d0",
        "stroke-opacity": ".53", "stroke-width": 1.6,
        "stroke-dasharray": "2 2.8",
      }),
      node("circle", {
        cx: 50, cy: 50, r: 36, fill: palette[1],
        stroke: palette[2], "stroke-width": 1.8,
      }),
      node("circle", {
        cx: 50, cy: 50, r: 31.5, fill: "none",
        stroke: "#fff", "stroke-opacity": ".28", "stroke-width": .9,
      }),
      node("path", {
        d: "M26 68Q40 77 57 72", fill: "none",
        stroke: "#fff", "stroke-opacity": ".3",
        "stroke-width": 1.7, "stroke-linecap": "round",
      }),
      node("text", {
        x: 50, y: 60, "text-anchor": "middle",
        "font-family": "Arial, sans-serif", "font-weight": 800,
        "font-size": 37, "letter-spacing": "-1", fill: palette[3],
      }, item.label),
    );
    return svg;
  }

  function coin(item) {
    return item.cents < 100 ? centCoin(item) : euroCoin(item);
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

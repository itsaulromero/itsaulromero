// Escribe el README a partir de data/profile.json, para que añadir un
// contacto o cambiar el stack no obligue a tocar el HTML a mano.
//
// Va todo en un único bloque HTML, sin líneas en blanco, para que GitHub no
// meta huecos entre tarjetas.

import fs from "node:fs";
import path from "node:path";
import { RAIZ, leerPerfil } from "./comun.mjs";

const P = leerPerfil();

const pieza = (nombre, alt, ancho = "100%") =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${nombre}-dark.svg"><img src="assets/${nombre}-light.svg" width="${ancho}" alt="${alt.replace(/"/g, "&quot;")}"></picture>`;
const enlace = (href, html) => `<a href="${href}">${html}</a>`;

const ORDEN = ["web", "linkedin", "email", "x"];
const contactos = ORDEN.filter((k) => P.contacto[k]);
const anchoC = `${(100 / contactos.length).toFixed(1).replace(/\.0$/, "")}%`;
const ETIQUETA = { web: "Portfolio", linkedin: "LinkedIn", email: "Email", x: "X" };
const HREF = { web: (v) => v, linkedin: (v) => v, email: (v) => `mailto:${v}`, x: (v) => v };

const lineas = [
  pieza("banner", `${P.nombre}. ${P.titular}: ${P.subtitular}. ${P.banner.map((b) => b[1]).join(". ")}.`),
  contactos.map((k) => enlace(HREF[k](P.contacto[k]), pieza(`contacto-${k}`, `${ETIQUETA[k]}: ${decodeURI(P.contacto[k])}`, anchoC))).join(""),
  pieza("stack", `My stack. ${P.stack.map((g) => `${g.grupo}: ${g.items.map((i) => i.nombre + (i.aprendiendo ? " (learning)" : "")).join(", ")}`).join(". ")}.`),
  pieza("actividad", "My GitHub activity over the last year, including private contributions, and the languages in my public repositories."),
  `<br><sub>Animated SVGs rendered from <a href="data/profile.json"><code>data/profile.json</code></a> · activity refreshes every day</sub>`,
];

const readme =
  `<!--\n` +
  `  Every image here is an animated SVG rendered with Node from data/profile.json\n` +
  `  (see scripts/). Edit that JSON, not the SVGs: the "Profile" workflow redraws\n` +
  `  the cards and this README. Activity refreshes on its own every day.\n` +
  `-->\n` +
  `<div align="center">\n${lineas.join("\n")}\n</div>\n`;

fs.writeFileSync(path.join(RAIZ, "README.md"), readme);
console.log("  README.md");

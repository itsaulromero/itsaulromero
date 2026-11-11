// Tarjetas fijas del perfil: contacto y stack.
// Todo sale de data/profile.json.

import {
  ANCHO, CABECERA, MARGEN, Lienzo, enAmbosTemas, glifo, icono, leerPerfil,
  medir, partir, pintarIcono, r, tarjeta,
} from "./comun.mjs";

const P = leerPerfil();

// --- contacto ----------------------------------------------------------------

const CONTACTOS = {
  web: { glifo: "web", titulo: "Portfolio", accion: "visit", valor: (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "") },
  linkedin: { glifo: "linkedin", titulo: "LinkedIn", accion: "connect", valor: () => P.nombre },
  email: { glifo: "correo", titulo: "Email", accion: "write", valor: (u) => u },
  x: { glifo: "x", titulo: "X", accion: "follow", valor: (u) => "@" + u.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, "").replace(/\/$/, "") },
};

export const contactosActivos = () => Object.keys(CONTACTOS).filter((k) => P.contacto[k]);

// Una tarjeta por contacto; el README las pone en fila, cada una con su enlace.
// Un brillo las recorre una detrás de otra, como una ola.
async function contacto(tipo, tema) {
  const activos = contactosActivos();
  const n = activos.length, orden = activos.indexOf(tipo);
  const ancho = Math.round(ANCHO / n);
  const alto = 124;
  const def = CONTACTOS[tipo];
  const valor = def.valor(P.contacto[tipo]);
  const L = new Lienzo(ancho, alto, tema, { titulo: def.titulo, desc: `${def.titulo}: ${valor}` });
  const T = L.T;
  const x0 = 22;
  let px = 12;
  while (px > 9.5 && medir(valor, "mono400", px) > ancho - 2 * x0 - 4) px -= 0.5;

  let s = `<defs>`;
  s += `<linearGradient id="borde" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.acento}" stop-opacity=".3"/><stop offset=".4" stop-color="${T.linea}"/><stop offset="1" stop-color="${T.linea}"/></linearGradient>`;
  s += `<linearGradient id="caja" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.acento}"/><stop offset="1" stop-color="${T.profundo}"/></linearGradient>`;
  s += `<radialGradient id="luz" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(40 30) scale(200 120)"><stop offset="0" stop-color="${T.profundo}" stop-opacity="${T.brillo * 0.55}"/><stop offset="1" stop-color="${T.profundo}" stop-opacity="0"/></radialGradient>`;
  s += `<clipPath id="dentro"><rect x="4" y="2" width="${ancho - 8}" height="${alto - 4}" rx="17"/></clipPath>`;
  s += `</defs>`;
  s += `<rect x="3.5" y="1.5" width="${ancho - 7}" height="${alto - 3}" rx="18" fill="${T.panel}" stroke="url(#borde)" stroke-width="1.5"/>`;
  s += `<g clip-path="url(#dentro)">`;
  s += `<rect width="${ancho}" height="${alto}" fill="url(#luz)"/>`;
  // el glifo en grande, de marca de agua
  s += `<g opacity="${tema === "dark" ? 0.4 : 0.35}" transform="rotate(-12 ${ancho - 50} 70)">${glifo(def.glifo, ancho - 104, 24, 104, T.tenue, 1.6)}</g>`;
  // un solo brillo que cruza las tarjetas seguidas, como en proyectos: mismas
  // cuentas en coordenadas de la fila entera, desplazadas según la posición
  const dx = orden * ancho;
  const g0 = -120 - dx, g1 = ANCHO + 160 - dx;
  s += `<rect x="${g0}" y="-20" width="60" height="${alto + 40}" fill="#ffffff" opacity="${tema === "dark" ? 0.07 : 0.35}" transform="skewX(-22)"><animate attributeName="x" values="${g0};${g0};${g1}" keyTimes="0;.55;1" dur="6s" repeatCount="indefinite"/></rect>`;
  s += `</g>`;

  // icono
  s += `<rect x="${x0 + 0.5}" y="20.5" width="41" height="41" rx="12" fill="${T.panel2}" stroke="${T.linea}"/>`;
  s += glifo(def.glifo, x0 + 11, 31, 20, T.acento, 2);
  // llamada a la acción
  const wa = medir(def.accion, "mono500", 11) + 40;
  const xa = ancho - x0 - wa;
  s += `<rect x="${r(xa)}" y="28" width="${r(wa)}" height="26" rx="13" fill="${T.panel2}" stroke="${T.linea}"/>`;
  s += L.t(xa + 13, 45, def.accion, { f: "mono500", s: 11, c: "acento" });
  s += `<g>${glifo("flecha", xa + wa - 23, 35, 12, T.acento, 2.6)}<animateTransform attributeName="transform" type="translate" values="0 0;0 0;2 -2;0 0" keyTimes="0;.7;.85;1" dur="2.4s" repeatCount="indefinite"/></g>`;
  // textos
  s += L.t(x0, 90, def.titulo, { f: "sans800", s: 18, c: "tinta", ls: -0.2 });
  s += L.t(x0, 108, valor, { f: "mono400", s: px, c: "suave" });
  return L.svg(s);
}

// --- stack: lista + órbitas ------------------------------------------------------------
//
// Cada capa del stack gira en su órbita: frontend dentro, backend en medio y
// datos + despliegue fuera, alrededor de mis iniciales.

async function stack(tema) {
  const grupos = P.stack;
  const todos = grupos.flatMap((g) => g.items);
  const trazos = Object.fromEntries(await Promise.all(todos.map(async (it) => [it.icono, await icono(it.icono)])));
  const orbitaDe = (gi) => Math.min(gi + 1, 3);

  // izquierda: grupos con chips (primero se maqueta para saber el alto)
  const xmax = 430;
  const chips = [];
  let y = CABECERA + 38;
  const titulos = [];
  for (const g of grupos) {
    titulos.push([g, y]);
    y += 14;
    let x = MARGEN;
    for (const it of g.items) {
      const extra = it.aprendiendo ? medir("learning", "mono500", 9.5) + 16 : 0;
      const w = 12 + 18 + 8 + medir(it.nombre, "sans600", 13) + 12 + extra;
      if (x + w > xmax) { x = MARGEN; y += 38; }
      chips.push({ it, x, y, w, extra });
      x += w + 8;
    }
    y += 30 + 30;
  }
  const alto = Math.max(CABECERA + 410, y + 4);

  const L = new Lienzo(ANCHO, alto, tema, {
    titulo: "My stack",
    desc: `My stack. ${grupos.map((g) => `${g.grupo}: ${g.items.map((i) => i.nombre + (i.aprendiendo ? " (learning)" : "")).join(", ")}`).join(". ")}. Drawn as orbits around my initials.`,
  });
  const T = L.T;
  const color = (it) => (it.color === "tinta" ? T.tinta : it.color);
  let s = tarjeta(L, "Stack", `${todos.length} technologies · ${grupos.length} layers`);

  for (const [g, yt] of titulos) {
    s += L.t(MARGEN, yt, g.grupo.toUpperCase(), { f: "mono500", s: 11, c: "acento", ls: 1.6 });
    if (g.nota) s += L.t(MARGEN + medir(g.grupo.toUpperCase(), "mono500", 11, 1.6) + 10, yt, `// ${g.nota}`, { f: "mono400", s: 11, c: "tenue" });
  }
  for (const { it, x, y: yc, w, extra } of chips) {
    s += `<rect x="${r(x)}" y="${yc}" width="${r(w)}" height="30" rx="9" fill="${T.panel}" stroke="${T.linea}"${it.aprendiendo ? ` stroke-dasharray="4 3"` : ""}/>`;
    s += pintarIcono(trazos[it.icono], x + 21, yc + 15, 16, color(it));
    s += L.t(x + 38, yc + 19.5, it.nombre, { f: "sans600", s: 13 });
    if (extra) {
      const xb = x + w - extra - 4;
      s += `<rect x="${r(xb)}" y="${yc + 7}" width="${r(extra - 4)}" height="16" rx="5" fill="${T.acento}" fill-opacity=".14"/>`;
      s += L.t(xb + (extra - 4) / 2, yc + 18.5, "learning", { f: "mono500", s: 9.5, c: "acento", a: "middle" });
    }
  }

  // derecha: órbitas
  const cx = 640, cy = CABECERA + (alto - CABECERA) / 2;
  const radios = { 1: 70, 2: 120, 3: 168 };
  const duraciones = { 1: 36, 2: 54, 3: 72 };
  s += `<defs><radialGradient id="nucleo" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${T.acento}"/><stop offset="1" stop-color="${T.profundo}"/></radialGradient>`;
  s += `<radialGradient id="aura" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${T.profundo}" stop-opacity="${T.brillo * 0.8}"/><stop offset="1" stop-color="${T.profundo}" stop-opacity="0"/></radialGradient>`;
  s += `<linearGradient id="estela" x1="1" x2="0"><stop offset="0" stop-color="${T.acento2}"/><stop offset="1" stop-color="${T.acento2}" stop-opacity="0"/></linearGradient>`;
  s += `<clipPath id="corta"><rect x="1" y="${CABECERA + 1}" width="${ANCHO - 2}" height="${alto - CABECERA - 2}" rx="17"/></clipPath></defs>`;
  s += `<g clip-path="url(#corta)">`;
  s += `<circle cx="${cx}" cy="${r(cy)}" r="200" fill="url(#aura)"/>`;
  for (const [n, rad] of Object.entries(radios)) {
    s += `<circle cx="${cx}" cy="${r(cy)}" r="${rad}" fill="none" stroke="${T.linea}" stroke-width="1.2" ${n === "2" ? `stroke-dasharray="2 6" stroke-linecap="round"` : ""}/>`;
  }
  // un cometa que recorre la órbita exterior
  s += `<g><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${r(cy)}" to="360 ${cx} ${r(cy)}" dur="9s" repeatCount="indefinite"/>`;
  s += `<path d="M${cx} ${r(cy - radios[3])} A${radios[3]} ${radios[3]} 0 0 0 ${r(cx - radios[3] * Math.sin(0.6))} ${r(cy - radios[3] * Math.cos(0.6))}" fill="none" stroke="url(#estela)" stroke-width="2" stroke-linecap="round"/>`;
  s += `<circle cx="${cx}" cy="${r(cy - radios[3])}" r="3" fill="${T.acento2}"/></g>`;

  for (const n of [1, 2, 3]) {
    const its = grupos.flatMap((g, gi) => (orbitaDe(gi) === n ? g.items : []));
    const rad = radios[n], dur = duraciones[n];
    const sentido = n === 2 ? -1 : 1;
    const desfase = n * 25;
    s += `<g><animateTransform attributeName="transform" type="rotate" from="${desfase} ${cx} ${r(cy)}" to="${desfase + 360 * sentido} ${cx} ${r(cy)}" dur="${dur}s" repeatCount="indefinite"/>`;
    its.forEach((it, i) => {
      const ang = (i / its.length) * Math.PI * 2;
      const x = cx + rad * Math.cos(ang), yy = cy + rad * Math.sin(ang);
      // el icono gira al revés que su órbita para quedarse siempre derecho
      s += `<g transform="translate(${r(x)} ${r(yy)})"><g><animateTransform attributeName="transform" type="rotate" from="${-desfase}" to="${-desfase - 360 * sentido}" dur="${dur}s" repeatCount="indefinite"/>`;
      s += `<circle r="19" fill="${T.panel}" stroke="${T.linea}" stroke-width="1.2"${it.aprendiendo ? ` stroke-dasharray="3 3"` : ""}/>`;
      s += pintarIcono(trazos[it.icono], 0, 0, 19, color(it));
      s += `</g></g>`;
    });
    s += `</g>`;
  }
  // núcleo: mis iniciales, con un aro degradado que gira
  const rf = 36;
  s += `<defs><linearGradient id="aro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.acento}"/><stop offset=".5" stop-color="${T.profundo}" stop-opacity=".2"/><stop offset="1" stop-color="${T.acento2}"/></linearGradient></defs>`;
  s += `<circle cx="${cx}" cy="${r(cy)}" r="${rf}" fill="${T.acento}" opacity=".14" class="latido"/>`;
  s += `<circle cx="${cx}" cy="${r(cy)}" r="${rf + 5}" fill="${T.fondo}"/>`;
  s += `<circle cx="${cx}" cy="${r(cy)}" r="${rf + 4}" fill="none" stroke="url(#aro)" stroke-width="2.5"><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${r(cy)}" to="360 ${cx} ${r(cy)}" dur="6s" repeatCount="indefinite"/></circle>`;
  s += `<circle cx="${cx}" cy="${r(cy)}" r="${rf}" fill="url(#nucleo)"/>`;
  s += L.t(cx, cy + 8.5, P.iniciales, { f: "sans800", s: 24, c: "#ffffff", a: "middle", ls: -0.5 });
  s += `</g>`;
  return L.svg(s);
}

// --- salida ----------------------------------------------------------------------------------

for (const tipo of contactosActivos()) await enAmbosTemas(`contacto-${tipo}`, (t) => contacto(tipo, t));
await enAmbosTemas("stack", stack);

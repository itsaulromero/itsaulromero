// Banner: nombre y titular a la izquierda; a la derecha, una petición que
// baja por las cuatro capas de mi stack (frontend, backend, datos, despliegue)
// y vuelve con un 200. Lo que hago de punta a punta, en una animación.

import { ANCHO, Lienzo, enAmbosTemas, glifo, leerPerfil, medir, r } from "./comun.mjs";

const P = leerPerfil();
const ALTO = 360;
const CICLO = 8; // segundos

function flujo(L, ox, oy) {
  const T = L.T;
  const W = 360, H = 262;
  const capas = P.stack;
  let s = `<g transform="translate(${ox} ${oy})">`;

  // sombra suave y ventana
  s += `<rect x="6" y="14" width="${W - 12}" height="${H - 6}" rx="16" fill="${T.profundo}" opacity="${L.tema === "dark" ? 0.18 : 0.06}" filter="url(#difumina)"/>`;
  s += `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${T.panel}" stroke="${T.linea}"/>`;
  // barra del navegador
  s += `<path d="M.5 34V12.5a12 12 0 0 1 12-12h${W - 25}a12 12 0 0 1 12 12V34z" fill="${T.panel2}"/>`;
  s += `<line x1="0" y1="34" x2="${W}" y2="34" stroke="${T.linea}"/>`;
  [T.profundo, T.acento, T.acento2].forEach((c, i) => (s += `<circle cx="${16 + i * 14}" cy="17" r="4.5" fill="${c}" opacity=".85"/>`));
  s += `<rect x="64" y="8" width="${W - 80}" height="18" rx="9" fill="${T.fondo}" stroke="${T.linea}"/>`;
  s += L.t(76, 21, "GET", { f: "mono500", s: 10.5, c: "acento" });
  s += L.t(100, 21, P.flujo.url, { f: "mono400", s: 10.5, c: "suave" });

  // capas
  const y0 = 48, hC = 40, gap = 9, xn = 34;
  const inicio = (i) => 0.06 + i * 0.15; // cuándo llega la petición a cada capa
  const centro = (i) => y0 + i * (hC + gap) + hC / 2;
  // la línea que une las capas
  s += `<line x1="${xn}" y1="${centro(0)}" x2="${xn}" y2="${centro(capas.length - 1)}" stroke="${T.linea}" stroke-width="2"/>`;
  capas.forEach((g, i) => {
    const y = y0 + i * (hC + gap), cy = centro(i);
    const a = r(inicio(i)), b = r(inicio(i) + 0.03);
    s += `<rect x="14.5" y="${y + 0.5}" width="${W - 29}" height="${hC - 1}" rx="9" fill="${T.fondo}" stroke="${T.linea}"/>`;
    // se ilumina cuando pasa la petición
    s += `<rect x="14.5" y="${y + 0.5}" width="${W - 29}" height="${hC - 1}" rx="9" fill="${T.acento}" fill-opacity="${L.tema === "dark" ? 0.06 : 0.05}" stroke="${T.acento}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a};${b};.9;.95;1" dur="${CICLO}s" repeatCount="indefinite"/></rect>`;
    s += `<circle cx="${xn}" cy="${cy}" r="5" fill="${T.panel}" stroke="${T.tenue}" stroke-width="1.6"/>`;
    s += `<circle cx="${xn}" cy="${cy}" r="5" fill="${T.acento}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a};${b};.9;.95;1" dur="${CICLO}s" repeatCount="indefinite"/></circle>`;
    s += L.t(52, cy - 3, g.grupo, { f: "sans700", s: 12.5 });
    // tecnologías de la capa, las que quepan
    const anchoMax = W - 52 - 60;
    let texto = "";
    for (const it of g.items) {
      const prueba = texto ? `${texto} · ${it.nombre}` : it.nombre;
      if (medir(prueba, "mono400", 9.5) > anchoMax) break;
      texto = prueba;
    }
    s += L.t(52, cy + 11, texto, { f: "mono400", s: 9.5, c: "suave" });
    // estado: puntos de espera y luego un check
    s += `<g opacity="1"><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${b};${r(+b + 0.01)};.95;1" dur="${CICLO}s" repeatCount="indefinite"/>${L.t(W - 30, cy + 4, "···", { f: "mono500", s: 12, c: "tenue", a: "end" })}</g>`;
    s += `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${b};${r(+b + 0.01)};.9;.95;1" dur="${CICLO}s" repeatCount="indefinite"/>`;
    s += `<circle cx="${W - 38}" cy="${cy}" r="8" fill="${T.acento}" opacity=".16"/>${glifo("check", W - 43, cy - 5, 10, T.acento, 3)}</g>`;
  });

  // la petición: baja por las capas y vuelve arriba como respuesta
  const ult = capas.length - 1;
  const kt = [0, ...capas.map((_, i) => r(inicio(i))), r(inicio(ult) + 0.12), 0.9, 1];
  const cys = [centro(0), ...capas.map((_, i) => centro(i)), centro(0), centro(0), centro(0)];
  s += `<circle cx="${xn}" r="3.2" fill="${T.tinta}"><animate attributeName="cy" values="${cys.join(";")}" keyTimes="${kt.join(";")}" dur="${CICLO}s" repeatCount="indefinite"/>`;
  s += `<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.05;${r(inicio(ult) + 0.12)};${r(inicio(ult) + 0.13)};1" dur="${CICLO}s" repeatCount="indefinite"/></circle>`;

  // respuesta
  const yr = y0 + capas.length * (hC + gap) + 4;
  const ta = r(inicio(ult) + 0.12), tb = r(inicio(ult) + 0.15);
  s += `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${ta};${tb};.9;.95;1" dur="${CICLO}s" repeatCount="indefinite"/>`;
  s += `<circle cx="${xn}" cy="${yr + 4}" r="4" fill="${T.ok}"/>`;
  s += L.t(52, yr + 8, P.flujo.estado, { f: "mono500", s: 11, c: "ok" });
  s += `</g>`;

  s += `</g>`;
  s += L.t(ox + W / 2, oy + H + 26, P.flujo.pie, { f: "mono400", s: 11, c: "suave", a: "middle", ls: 0.3 });
  return s;
}

async function dibujar(tema) {
  const L = new Lienzo(ANCHO, ALTO, tema, {
    titulo: P.nombre,
    desc: `${P.nombre}. ${P.titular}: ${P.subtitular}. ${P.banner.map((b) => b[1]).join(". ")}. Animation of a request travelling through the frontend, backend, database and deployment layers.`,
  });
  const T = L.T;
  let s = "";

  const defs =
    `<radialGradient id="halo" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(660 150) scale(360 240)"><stop offset="0" stop-color="${T.profundo}" stop-opacity="${T.brillo}"/><stop offset="1" stop-color="${T.profundo}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="halo2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(90 360) scale(300 160)"><stop offset="0" stop-color="${T.acento2}" stop-opacity="${T.brillo * 0.45}"/><stop offset="1" stop-color="${T.acento2}" stop-opacity="0"/></radialGradient>` +
    `<pattern id="puntos" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="${T.tenue}" opacity=".45"/></pattern>` +
    `<linearGradient id="desvanece" x1="0" x2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>` +
    `<mask id="mascara"><rect width="${ANCHO}" height="${ALTO}" fill="url(#desvanece)"/></mask>` +
    `<linearGradient id="velo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>` +
    `<filter id="difumina" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>` +
    `<clipPath id="recorte"><rect x="1" y="1" width="${ANCHO - 2}" height="${ALTO - 2}" rx="17"/></clipPath>` +
    // brillo que recorre el nombre de izquierda a derecha
    `<linearGradient id="nombre" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="420" y2="0">` +
    `<stop offset="0" stop-color="${T.tinta}"/><stop offset=".38" stop-color="${T.tinta}"/><stop offset=".5" stop-color="${T.acento}"/><stop offset=".6" stop-color="${T.acento2}"/><stop offset=".72" stop-color="${T.tinta}"/><stop offset="1" stop-color="${T.tinta}"/>` +
    `<animateTransform attributeName="gradientTransform" type="translate" values="-420 0;420 0;420 0" keyTimes="0;.55;1" dur="7s" repeatCount="indefinite"/></linearGradient>`;

  s += `<rect x=".5" y=".5" width="${ANCHO - 1}" height="${ALTO - 1}" rx="18" fill="${T.fondo}" stroke="${T.linea}"/>`;
  s += `<g clip-path="url(#recorte)"><rect width="${ANCHO}" height="${ALTO}" fill="url(#puntos)" mask="url(#mascara)"/><rect width="${ANCHO}" height="${ALTO}" fill="url(#halo)"/><rect width="${ANCHO}" height="${ALTO}" fill="url(#halo2)"/></g>`;

  // izquierda
  const x = 40;
  s += `<g class="entra">`;
  s += L.t(x, 84, P.saludo.toUpperCase(), { f: "mono500", s: 12, c: "acento", ls: 2.4 });
  s += `<rect class="cursor" x="${r(x + medir(P.saludo.toUpperCase(), "mono500", 12, 2.4) + 6)}" y="74" width="7" height="12" rx="1" fill="${T.acento}"/>`;
  s += L.t(x - 2, 142, P.nombre, { f: "sans800", s: 52, c: "url(#nombre)", ls: -1.4 });
  s += L.t(x, 178, P.titular, { f: "sans600", s: 21, c: "tinta" });
  const partes = P.subtitular.split(" · ");
  s += L.tramos(x, 204, partes.flatMap((p, i) => (i ? [[" · ", "acento"], [p, "suave"]] : [[p, "suave"]])), { f: "mono400", s: 14 });
  s += `</g>`;

  P.banner.forEach(([ico, texto], i) => {
    const y = 250 + i * 30;
    s += `<g class="entra" style="animation-delay:${0.15 + i * 0.12}s">`;
    s += `<rect x="${x}" y="${y - 16}" width="24" height="24" rx="7" fill="${T.panel2}" stroke="${T.linea}"/>`;
    s += glifo(ico, x + 5, y - 11, 14, T.acento, 2);
    s += L.t(x + 36, y + 0.5, texto, { f: "sans500", s: 14, c: "suave" });
    s += `</g>`;
  });

  s += flujo(L, 470, 36);
  return L.svg(s, { defs });
}

await enAmbosTemas("banner", dibujar);

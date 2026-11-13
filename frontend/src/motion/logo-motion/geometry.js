/* Geometria e utilitários compartilhados da marca (ícone 512×512). */

export const BLUE = "#1927B0";
export const BLUE_HI = "#2838D2";
export const GREEN = "#1BA566";

/* Polígonos exatos na ordem TL, TR, BR, BL */
export const S1 = [[91, 131], [171, 131], [325, 369], [245, 369]];
export const S2 = [[238, 170], [312, 170], [437, 369], [357, 369]];
export const TRI4 = [[134, 266], [134, 266], [193, 369], [75, 369]]; // ápice duplicado → 4 pontos

export const K = 0.63; // inclinação média das faixas (dx/dy)

export const EXPO = [0.16, 1, 0.3, 1];
export const INOUT = [0.83, 0, 0.17, 1];
export const QUART_IN_OUT = [0.76, 0, 0.24, 1];

export const toD = (pts) =>
  "M" + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L") + " Z";

/** Paralelogramo fino na diagonal da marca */
export const sliver = (dx, y0, y1, w) => {
  const xl = (y) => 91 + dx + (y - 131) * K;
  return [[xl(y0), y0], [xl(y0) + w, y0], [xl(y1) + w, y1], [xl(y1), y1]];
};

/** Forma colapsada numa aresta (topo ou base) — para "desenhar" a partir de uma ponta */
export const collapseTop = (p) => [p[0], p[1], p[1], p[0]];
export const collapseBottom = (p) => [p[3], p[2], p[2], p[3]];
export const collapsed = (p, fromTop) => (fromTop ? collapseTop(p) : collapseBottom(p));

/** PRNG determinístico */
export function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Cor das formas brancas/azuis em cada tema (variantes sem o quadrado) */
export const inkFor = (theme) => (theme === "light" ? BLUE : "#ffffff");

/** Transformação usada pelas variantes "só a logo" para ocupar o mesmo espaço do ícone */
export const BARE_TRANSFORM = "translate(256 250) scale(1.32) translate(-256 -250)";

/** Duração total (s) de cada abertura, usada para disparar onComplete */
export const SPLASH_DURATION = { icon: 4.4, slices: 2.0, baseline: 1.8 };

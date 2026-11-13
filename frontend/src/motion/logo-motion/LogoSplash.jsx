import React, { useEffect, useId, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BLUE, BLUE_HI, GREEN, S1, S2, TRI4, EXPO, INOUT, QUART_IN_OUT,
  toD, sliver, collapsed, rng, inkFor, BARE_TRANSFORM, SPLASH_DURATION,
} from "./geometry";

/**
 * Animação de abertura da logo.
 *
 * @param {object}  props
 * @param {"icon"|"slices"|"baseline"} [props.variant="icon"]
 *        icon     → ícone completo (linhas convergem nas faixas, quadrado se abre da régua verde)
 *        slices   → só a logo, "A · Faixas de horário"
 *        baseline → só a logo, "B · Linha de base"
 * @param {"dark"|"light"} [props.theme="dark"]  fundo sobre o qual a logo aparece
 * @param {number|string}  [props.size=160]      largura/altura do quadro 512×512
 * @param {() => void}     [props.onComplete]    chamado quando a animação termina
 * @param {string}         [props.className]
 * @param {object}         [props.style]
 */
export default function LogoSplash({ variant = "icon", theme = "dark", size = 160, onComplete, className, style }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const cb = useRef(onComplete);
  cb.current = onComplete;

  useEffect(() => {
    const ms = reduce ? 600 : (SPLASH_DURATION[variant] ?? 2) * 1000;
    const t = setTimeout(() => cb.current?.(), ms);
    return () => clearTimeout(t);
  }, [variant, reduce]);

  const bare = variant !== "icon";
  const ink = bare ? inkFor(theme) : "#fff";

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      overflow="visible"
      role="img"
      aria-label="Logo"
      className={className}
      style={{ overflow: "visible", display: "block", ...style }}
    >
      <SharedDefs uid={uid} />
      {reduce ? (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <g transform={bare ? BARE_TRANSFORM : undefined}>
            {!bare && <rect width={512} height={512} rx={112} fill={`url(#${uid}-bg)`} />}
            <path d={toD(S1)} fill={ink} />
            <path d={toD(S2)} fill={ink} />
            <path d={toD(TRI4)} fill={GREEN} />
          </g>
        </motion.g>
      ) : variant === "slices" ? (
        <SlicesReveal uid={uid} ink={ink} theme={theme} />
      ) : variant === "baseline" ? (
        <BaselineReveal uid={uid} ink={ink} />
      ) : (
        <IconReveal uid={uid} theme={theme} />
      )}
    </svg>
  );
}

/**
 * Logo estática (estado final da abertura), sem animação.
 * @param {{variant?: "icon"|"slices"|"baseline"|"bare", theme?: "dark"|"light", size?: number|string, className?: string, style?: object}} props
 */
export function LogoMark({ variant = "icon", theme = "dark", size = 160, className, style }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const bare = variant !== "icon";
  const ink = bare ? inkFor(theme) : "#fff";
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} role="img" aria-label="Logo"
      className={className} style={{ display: "block", overflow: "visible", ...style }}>
      <SharedDefs uid={uid} />
      <g transform={bare ? BARE_TRANSFORM : undefined}>
        {!bare && <rect width={512} height={512} rx={112} fill={`url(#${uid}-bg)`} />}
        {!bare && <rect width={512} height={512} rx={112} fill={`url(#${uid}-inner)`} opacity={0.55} />}
        <path d={toD(S1)} fill={ink} />
        <path d={toD(S2)} fill={ink} />
        <path d={toD(TRI4)} fill={GREEN} />
      </g>
    </svg>
  );
}

/* ───────────────────────── defs ───────────────────────── */
export function SharedDefs({ uid }) {
  return (
    <defs>
      <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={BLUE_HI} />
        <stop offset="1" stopColor={BLUE} />
      </linearGradient>
      <radialGradient id={`${uid}-inner`} cx="0.3" cy="0.15" r="0.9">
        <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.28" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <clipPath id={`${uid}-sq`}>
        <rect width={512} height={512} rx={112} />
      </clipPath>
      <filter id={`${uid}-soft`} x="-50%" y="-200%" width="200%" height="500%">
        <feGaussianBlur stdDeviation="28" />
      </filter>
    </defs>
  );
}

/* ───────────────────── variante: ícone ───────────────────── */
const T = { convEnd: 2.0, open: 1.7, rule: 1.05, shrink: 2.35, rise: 2.62, polish: 3.15 };

function useField() {
  return useMemo(() => {
    const r = rng(7);
    const N = 26;
    return Array.from({ length: N }, (_, i) => {
      const dx = -360 + (i / (N - 1)) * 900 + (r() - 0.5) * 24;
      const y0 = -90 + r() * 260;
      const len = 200 + r() * 300;
      const start = sliver(dx, y0, y0 + len, 2 + r() * 1.6);
      const target = dx < 105 ? S1 : S2;
      const fromTop = r() > 0.4;
      const drawDelay = 0.05 + r() * 0.6;
      const convStart = 0.95 + Math.abs(dx - (target === S1 ? 40 : 160)) / 2400 + r() * 0.12;
      return { i, start, target, fromTop, drawDelay, convStart, op: 0.35 + r() * 0.45 };
    });
  }, []);
}

function FieldLine({ l }) {
  const d0 = toD(collapsed(l.start, l.fromTop));
  const d1 = toD(l.start);
  const d2 = toD(l.target);
  const convEnd = Math.min(l.convStart + 0.85, T.convEnd);
  const total = convEnd - l.drawDelay;
  return (
    <motion.path
      fill="currentColor"
      initial={{ d: d0, opacity: 0 }}
      animate={{ d: [d0, d1, d1, d2], opacity: [0, l.op, l.op, 1] }}
      transition={{
        delay: l.drawDelay,
        duration: total,
        times: [0, 0.6 / total, (l.convStart - l.drawDelay) / total, 1],
        ease: [EXPO, "linear", QUART_IN_OUT],
      }}
    />
  );
}

function GreenLine() {
  const start = sliver(-250, 10, 330, 3);
  const bar = [[75, 365], [437, 365], [437, 369], [75, 369]];
  const base = [[75, 365], [193, 365], [193, 369], [75, 369]];
  const keys = [collapsed(start, true), start, start, bar, bar, base, TRI4].map(toD);
  const t0 = 0.2;
  const at = [t0, 0.8, T.rule, 1.75, T.shrink, T.rise, T.rise + 0.62];
  const total = at[at.length - 1] - t0;
  return (
    <motion.path
      fill={GREEN}
      initial={{ d: keys[0] }}
      animate={{ d: keys }}
      transition={{
        delay: t0,
        duration: total,
        times: at.map((t) => (t - t0) / total),
        ease: [EXPO, "linear", INOUT, "linear", QUART_IN_OUT, EXPO],
      }}
    />
  );
}

function IconReveal({ uid, theme }) {
  const field = useField();
  const lineColor = theme === "light" ? BLUE : "#fff";
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-open`}>
          <motion.rect
            initial={{ attrX: 75, attrY: 367, width: 362, height: 0, rx: 2 }}
            animate={{ attrX: 0, attrY: 0, width: 512, height: 512, rx: 112 }}
            transition={{ delay: T.open, duration: 0.95, ease: EXPO }}
          />
        </clipPath>
      </defs>

      <motion.ellipse
        cx={256} cy={540} rx={230} ry={40}
        fill={theme === "light" ? BLUE : "#000"}
        filter={`url(#${uid}-soft)`}
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: theme === "light" ? 0.18 : 0.55, scaleX: 1 }}
        transition={{ delay: T.open + 0.15, duration: 1, ease: EXPO }}
      />

      <g clipPath={`url(#${uid}-open)`}>
        <rect width={512} height={512} fill={`url(#${uid}-bg)`} />
        <motion.rect
          width={512} height={512} fill={`url(#${uid}-inner)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.55] }}
          transition={{ delay: T.open, duration: 1.4, times: [0, 0.35, 1] }}
        />
      </g>

      <motion.g
        initial={{ color: lineColor }}
        animate={{ color: [lineColor, lineColor, "#fff"] }}
        transition={{ duration: T.open + 0.3, times: [0, 0.8, 1] }}
      >
        {field.map((l) => <FieldLine key={l.i} l={l} />)}
      </motion.g>

      <GreenLine />

      <motion.rect
        x={1.5} y={1.5} width={509} height={509} rx={110.5}
        fill="none" stroke="#fff" strokeWidth={3}
        initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
        animate={{ pathLength: [0, 0.22, 0], pathOffset: [0.1, 0.55, 1.1], opacity: [0, 0.7, 0] }}
        transition={{ delay: T.polish, duration: 1.1, ease: "easeInOut" }}
      />
      <g clipPath={`url(#${uid}-sq)`}>
        <motion.path
          d={toD(sliver(-420, -60, 580, 150))}
          fill={`url(#${uid}-sheen)`}
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: 900, opacity: [0, 1, 1, 0] }}
          transition={{ delay: T.polish + 0.1, duration: 1.15, ease: [0.45, 0, 0.2, 1] }}
        />
      </g>
    </g>
  );
}

/* ─────────────── variante A: faixas de horário ─────────────── */
const BAND_N = 7, BAND_TOP = 131, BAND_BOT = 369;
const BAND_H = (BAND_BOT - BAND_TOP) / BAND_N;

function Mark({ ink }) {
  return (
    <>
      <path d={toD(S1)} fill={ink} />
      <path d={toD(S2)} fill={ink} />
      <path d={toD(TRI4)} fill={ink} />
    </>
  );
}

function SlicesReveal({ uid, ink, theme }) {
  const lock = 1.45;
  const order = [3, 2, 4, 1, 5, 0, 6];
  return (
    <g transform={BARE_TRANSFORM}>
      <defs>
        {Array.from({ length: BAND_N }, (_, i) => (
          <clipPath id={`${uid}-band-${i}`} key={i}>
            <rect x={-900} y={BAND_TOP + i * BAND_H - 0.6} width={2400} height={BAND_H + 1.2} />
          </clipPath>
        ))}
        <clipPath id={`${uid}-wipe`}>
          <motion.rect
            x={60} width={150}
            initial={{ attrY: 370, height: 0 }}
            animate={{ attrY: 262, height: 108 }}
            transition={{ delay: lock + 0.1, duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
          />
        </clipPath>
      </defs>

      {Array.from({ length: BAND_N + 1 }, (_, i) => (
        <motion.line
          key={i}
          x1={-260} x2={772}
          y1={BAND_TOP + i * BAND_H} y2={BAND_TOP + i * BAND_H}
          stroke={ink} strokeWidth={1}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1], opacity: [0, theme === "light" ? 0.18 : 0.22, 0] }}
          transition={{ delay: 0.05 + Math.abs(i - BAND_N / 2) * 0.04, duration: 1.7, times: [0, 0.35, 1], ease: EXPO }}
        />
      ))}

      <motion.g initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: lock, duration: 0 }}>
        {Array.from({ length: BAND_N }, (_, i) => {
          const dir = i % 2 ? 1 : -1;
          const rank = order.indexOf(i);
          return (
            <g key={i} clipPath={`url(#${uid}-band-${i})`}>
              <motion.g
                initial={{ x: dir * 560, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  x: { delay: 0.3 + rank * 0.07, duration: 0.85, ease: [0.7, 0, 0.1, 1] },
                  opacity: { delay: 0.3 + rank * 0.07, duration: 0.2 },
                }}
              >
                <Mark ink={ink} />
              </motion.g>
            </g>
          );
        })}
      </motion.g>

      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: lock, duration: 0 }}>
        <Mark ink={ink} />
        <path d={toD(TRI4)} fill={GREEN} clipPath={`url(#${uid}-wipe)`} />
      </motion.g>
    </g>
  );
}

/* ─────────────── variante B: linha de base ─────────────── */
function BaselineReveal({ uid, ink }) {
  const U = { x: 0.55, y: 0.835 };
  const shapes = [
    { pts: S1, from: { x: U.x * 300, y: U.y * 300 }, delay: 0.42 },
    { pts: S2, from: { x: U.x * 260, y: U.y * 260 }, delay: 0.52 },
  ];
  return (
    <g transform={BARE_TRANSFORM}>
      <defs>
        <clipPath id={`${uid}-above`}>
          <rect x={-900} y={-900} width={2400} height={900 + 369} />
        </clipPath>
      </defs>

      <motion.line
        x1={-40} x2={552} y1={369.5} y2={369.5}
        stroke={ink} strokeWidth={2}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 1, 1, 0] }}
        transition={{ duration: 1.75, times: [0, 0.26, 0.7, 1], ease: [EXPO, "linear", [0.7, 0, 0.84, 0]] }}
      />

      <g clipPath={`url(#${uid}-above)`}>
        {shapes.map((s, k) => (
          <g key={k}>
            {[1, 2, 3].map((e) => (
              <motion.path
                key={e}
                d={toD(s.pts)}
                fill="none" stroke={ink} strokeWidth={1.2}
                initial={{ x: s.from.x, y: s.from.y, opacity: 0 }}
                animate={{ x: -U.x * 24 * e, y: -U.y * 24 * e, opacity: [0, 0.55 - e * 0.12, 0] }}
                transition={{
                  delay: s.delay + 0.03 * e, duration: 0.95, ease: EXPO,
                  opacity: { delay: s.delay + 0.03 * e, duration: 1.1, times: [0, 0.35, 1] },
                }}
              />
            ))}
            <motion.path
              d={toD(s.pts)} fill={ink}
              initial={{ x: s.from.x, y: s.from.y }}
              animate={{ x: 0, y: 0 }}
              transition={{ delay: s.delay, duration: 0.95, ease: EXPO }}
            />
          </g>
        ))}
        <motion.path
          d={toD(TRI4)} fill={GREEN}
          initial={{ y: 110 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.7, duration: 0.85, ease: EXPO }}
        />
      </g>
    </g>
  );
}

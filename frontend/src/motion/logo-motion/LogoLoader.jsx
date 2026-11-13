import React, { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GREEN, S1, S2, TRI4, QUART_IN_OUT, toD, collapseTop, collapseBottom, inkFor, BARE_TRANSFORM } from "./geometry";
import { SharedDefs } from "./LogoSplash";

/**
 * Indicador de carregamento com a logo.
 * As faixas ficam como trilho translúcido e um preenchimento corre pela diagonal,
 * entrando pelo topo e saindo pela base. O triângulo verde fica fixo.
 * O ciclo começa com a logo completa, então dá para emendar direto depois da abertura.
 *
 * @param {object} props
 * @param {"icon"|"bare"}  [props.variant="icon"]  com o quadrado azul ou só a logo
 * @param {"dark"|"light"} [props.theme="dark"]    só afeta a variante "bare"
 * @param {number|string}  [props.size=64]
 * @param {string}         [props.label="Carregando"]  texto para leitores de tela
 * @param {string}         [props.className]
 * @param {object}         [props.style]
 */
export default function LogoLoader({ variant = "icon", theme = "dark", size = 64, label = "Carregando", className, style }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const bare = variant === "bare";
  const ink = bare ? inkFor(theme) : "#fff";

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="status"
      aria-label={label}
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      <SharedDefs uid={uid} />
      <g transform={bare ? BARE_TRANSFORM : undefined}>
        {!bare && <rect width={512} height={512} rx={112} fill={`url(#${uid}-bg)`} />}
        {!bare && <rect width={512} height={512} rx={112} fill={`url(#${uid}-inner)`} opacity={0.55} />}
        {[S1, S2].map((s, k) => {
          const full = toD(s);
          return (
            <g key={k}>
              <path d={full} fill={ink} opacity={bare ? 0.16 : 0.14} />
              {reduce ? (
                <motion.path
                  d={full}
                  fill={ink}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: k * 0.3 }}
                />
              ) : (
                <motion.path
                  fill={ink}
                  initial={{ d: full }}
                  /* cheia → sai pela base → (salto invisível) → entra pelo topo → cheia */
                  animate={{ d: [full, toD(collapseBottom(s)), toD(collapseTop(s)), full] }}
                  transition={{
                    duration: 1.5,
                    delay: k * 0.22,
                    times: [0, 0.5, 0.501, 1],
                    ease: [QUART_IN_OUT, "linear", QUART_IN_OUT],
                    repeat: Infinity,
                    repeatDelay: 0.3,
                  }}
                />
              )}
            </g>
          );
        })}
        <path d={toD(TRI4)} fill={GREEN} />
      </g>
    </svg>
  );
}

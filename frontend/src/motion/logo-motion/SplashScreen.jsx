import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import LogoSplash from "./LogoSplash";
import LogoLoader from "./LogoLoader";
import { BLUE_HI } from "./geometry";

const BACKGROUNDS = {
  dark: "radial-gradient(120% 90% at 50% 45%, #121a5c 0%, #070a24 60%, #04061a 100%)",
  light: "radial-gradient(120% 90% at 50% 45%, #ffffff 0%, #eef0fa 60%, #e3e6f6 100%)",
};

/**
 * Tela de abertura em tela cheia para quando o sistema abre.
 *
 * Fluxo: toca a abertura → se `ready` ainda for false, emenda no loader →
 * quando `ready` for true, espera `holdMs` e sai com fade → chama `onFinish`.
 *
 * @param {object} props
 * @param {"icon"|"slices"|"baseline"} [props.variant="icon"]
 * @param {"dark"|"light"} [props.theme="dark"]
 * @param {boolean} [props.ready=true]   passe false enquanto o app carrega (auth, dados…)
 * @param {number}  [props.size=180]     tamanho da logo em px
 * @param {number}  [props.holdMs=350]   tempo parado na logo final antes de sair
 * @param {() => void} [props.onFinish]  chamado depois da animação de saída (desmonte aqui)
 */
export default function SplashScreen({
  variant = "icon",
  theme = "dark",
  ready = true,
  size = 180,
  holdMs = 350,
  onFinish,
}) {
  const [phase, setPhase] = useState("intro"); // intro → loading → exit-wait → exit
  const [usedLoader, setUsedLoader] = useState(false);
  const loaderVariant = variant === "icon" ? "icon" : "bare";

  const introDone = () => setPhase((p) => (p === "intro" ? (ready ? "exit-wait" : "loading") : p));

  useEffect(() => {
    if (phase === "loading") setUsedLoader(true);
    if (phase === "loading" && ready) setPhase("exit-wait");
  }, [phase, ready]);

  useEffect(() => {
    if (phase !== "exit-wait") return;
    const t = setTimeout(() => setPhase("exit"), holdMs);
    return () => clearTimeout(t);
  }, [phase, holdMs]);

  return (
    <motion.div
      role="presentation"
      initial={{ opacity: 1 }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => phase === "exit" && onFinish?.()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: BACKGROUNDS[theme],
        overflow: "hidden",
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      {/* brilho ambiente atrás da logo */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: theme === "light" ? 0.3 : 0.5, scale: 1 }}
        transition={{ delay: variant === "icon" ? 1.7 : 1.2, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          width: size * 2.4,
          height: size * 2.4,
          borderRadius: "50%",
          background: theme === "light" ? "#9aa5ff" : BLUE_HI,
          filter: `blur(${Math.round(size * 0.35)}px)`,
        }}
      />

      <motion.div
        style={{ position: "relative", width: size, height: size }}
        animate={phase === "exit" ? { scale: 0.94 } : { scale: 1 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        {usedLoader || phase === "loading" ? (
          /* o loader começa pela logo completa, igual ao último quadro da abertura: sem salto */
          <LogoLoader key="loader" variant={loaderVariant} theme={theme} size={size} />
        ) : (
          /* a abertura continua montada (parada no quadro final) até a saída */
          <LogoSplash key="splash" variant={variant} theme={theme} size={size} onComplete={introDone} />
        )}
      </motion.div>
    </motion.div>
  );
}

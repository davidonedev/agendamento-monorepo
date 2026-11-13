import type { CSSProperties, FC } from "react";

export type Theme = "dark" | "light";
export type SplashVariant = "icon" | "slices" | "baseline";

export interface LogoSplashProps {
  /** "icon" = com o quadrado azul · "slices" = só a logo (Faixas) · "baseline" = só a logo (Linha de base) */
  variant?: SplashVariant;
  theme?: Theme;
  size?: number | string;
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

export interface LogoMarkProps {
  variant?: SplashVariant | "bare";
  theme?: Theme;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

export interface LogoLoaderProps {
  variant?: "icon" | "bare";
  theme?: Theme;
  size?: number | string;
  /** texto para leitores de tela (padrão: "Carregando") */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export interface SplashScreenProps {
  variant?: SplashVariant;
  theme?: Theme;
  /** false enquanto o sistema carrega; a splash emenda no loader até virar true */
  ready?: boolean;
  size?: number;
  holdMs?: number;
  /** chamado depois do fade de saída — desmonte a splash aqui */
  onFinish?: () => void;
}

export const LogoSplash: FC<LogoSplashProps>;
export const LogoMark: FC<LogoMarkProps>;
export const LogoLoader: FC<LogoLoaderProps>;
export const SplashScreen: FC<SplashScreenProps>;

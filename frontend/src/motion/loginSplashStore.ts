import { useSyncExternalStore } from 'react';

/** Quanto o Painel continua em skeleton depois que a animação da logo termina. */
export const POST_SPLASH_SKELETON_MS = 2000;

/**
 * Estado global (fora do React Router) do pós-login:
 *   splash → a logo toca em tela cheia (o sistema já carrega por baixo)
 *   hold   → a splash saiu e o Painel fica em skeleton por POST_SPLASH_SKELETON_MS
 *   idle   → normal
 */
type Phase = 'idle' | 'splash' | 'hold';
let phase: Phase = 'idle';
let holdTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const setPhase = (next: Phase) => {
  phase = next;
  listeners.forEach(l => l());
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};

/** Chame logo depois de um login bem-sucedido, antes de navegar para o sistema. */
export function showLoginSplash() {
  clearTimeout(holdTimer);
  setPhase('splash');
}

/** Chamado quando a splash termina: começa a janela de skeleton. */
export function hideLoginSplash() {
  setPhase('hold');
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => setPhase('idle'), POST_SPLASH_SKELETON_MS);
}

export function useLoginSplashVisible() {
  return useSyncExternalStore(subscribe, () => phase === 'splash', () => false);
}

/** true durante a splash e nos ~2 s seguintes: os componentes do Painel mostram skeleton. */
export function useLoginSkeletonHold() {
  return useSyncExternalStore(subscribe, () => phase !== 'idle', () => false);
}

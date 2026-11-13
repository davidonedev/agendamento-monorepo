import { SplashScreen } from './logo-motion';
import { hideLoginSplash, useLoginSplashVisible } from './loginSplashStore';

/**
 * Abertura da logo em tela cheia, centralizada, a cada login. Fica no topo do app para continuar na
 * tela enquanto a rota troca por baixo: a logo toca inteira (4,4 s) e só então o sistema aparece.
 * Quem reduz movimento no sistema vê só um fade curto (tratado pelo próprio componente).
 */
export function LoginSplashHost() {
  const visible = useLoginSplashVisible();
  if (!visible) return null;

  return (
    <>
      <p role="status" className="sr-only">Entrando no Nimbo</p>
      <SplashScreen variant="icon" theme="dark" onFinish={hideLoginSplash} />
    </>
  );
}

# logo-motion

Animações da logo em React + Framer Motion: abertura (splash), carregamento (loader) e logo estática.
São componentes SVG puros, sem imagens nem CSS externo.

## Instalação

1. Copie a pasta `logo-motion/` para dentro do seu projeto (ex.: `src/components/logo-motion/`).
2. Instale a dependência (React 18 ou 19):

```bash
npm i framer-motion
```

> Se o projeto usa o pacote novo `motion`, troque `from "framer-motion"` por `from "motion/react"` nos 3 arquivos `.jsx`.

Em projetos TypeScript, o `index.d.ts` já tipa tudo. Basta importar de `./logo-motion`.

## 1. Abertura ao abrir o sistema

```jsx
import { useEffect, useState } from "react";
import { SplashScreen } from "./components/logo-motion";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // troque pelo carregamento real: sessão, usuário, configurações…
    carregarSistema().finally(() => setReady(true));
  }, []);

  return (
    <>
      <Rotas />
      {showSplash && (
        <SplashScreen
          variant="icon"          // "icon" | "slices" | "baseline"
          theme="dark"            // "dark" | "light"
          ready={ready}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </>
  );
}
```

O fluxo é este:
1. A abertura toca inteira: 4,4 s em `icon`, 2 s em `slices` e 1,8 s em `baseline`.
2. Se `ready` ainda for `false`, a splash emenda direto no loader, sem salto, e fica nele até `ready` virar `true`.
3. Com `ready` em `true`, a logo fica parada por `holdMs` (padrão 350 ms) e sai com fade.
4. Depois do fade, a splash chama `onFinish`. É ali que você a desmonta.

Para a abertura tocar só na primeira visita da sessão:

```jsx
const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("splash"));
// …
onFinish={() => { sessionStorage.setItem("splash", "1"); setShowSplash(false); }}
```

## 2. Loader em qualquer lugar

```jsx
import { LogoLoader } from "./components/logo-motion";

<LogoLoader size={56} />                              // com o quadrado azul
<LogoLoader variant="bare" theme="light" size={40} /> // só a logo, fundo claro
<LogoLoader variant="bare" theme="dark" size={20} />  // dentro de botão escuro
```

Exemplo em rotas com `Suspense`:

```jsx
<Suspense fallback={<div style={{ display: "grid", placeItems: "center", height: "100vh" }}><LogoLoader size={64} /></div>}>
  <Outlet />
</Suspense>
```

## 3. Só a animação, sem tela cheia

```jsx
import { LogoSplash, LogoMark } from "./components/logo-motion";

<LogoSplash variant="slices" theme="light" size={200} onComplete={() => console.log("fim")} />
<LogoMark variant="icon" size={32} />  // logo estática, ex.: no header
```

Para repetir a abertura, troque a `key`: `<LogoSplash key={n} />`.

## Props

| Componente | Prop | Valores | Padrão |
|---|---|---|---|
| todos | `theme` | `"dark"` \| `"light"`: cor do fundo onde a logo aparece (sem o quadrado, as faixas ficam azuis no claro) | `"dark"` |
| todos | `size` | px ou string CSS | 160 / 64 / 180 |
| `SplashScreen`, `LogoSplash` | `variant` | `"icon"`, `"slices"`, `"baseline"` | `"icon"` |
| `LogoLoader` | `variant` | `"icon"`, `"bare"` | `"icon"` |
| `SplashScreen` | `ready`, `holdMs`, `onFinish` | ver acima | `true`, `350` |
| `LogoSplash` | `onComplete` | callback | — |

## Observações

- **Acessibilidade:** quem ativou "reduzir movimento" no sistema vê só um fade suave na abertura e uma pulsação leve no loader.
- **Vários na mesma página:** os IDs internos do SVG usam `useId`, então dá para ter vários loaders ao mesmo tempo sem conflito.
- **Overflow:** na variante `icon`, as linhas da abertura passam um pouco para fora do quadro. O SVG já vem com `overflow: visible`, mas evite colocar a logo dentro de um container com `overflow: hidden` muito justo.

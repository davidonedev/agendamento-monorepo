# AgendePro — Frontend (React + Vite)

**Português** | [English](#english)

Interface web do AgendePro (React 19, TypeScript, Vite, Tailwind). Roda em http://localhost:5173.

## Requisitos

- Node.js 20.19+ ou 22+ e npm
- Backend rodando em http://localhost:3333 (veja [../backend-java](../backend-java))

## 1. Instalar

```bash
cd frontend
npm install
```

## 2. Configurar

Crie o arquivo `frontend/.env`:

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

Depois edite o `.env` e aponte para o backend local (o valor precisa terminar em `/api`):

```env
VITE_API_URL=http://localhost:3333/api
```

- O `.env.example` traz uma URL de exemplo de produção; substitua pela do backend local.
- `VITE_GOOGLE_CLIENT_ID` é opcional (só para login com Google).
- Depois de mudar o `.env`, reinicie o `npm run dev`.

## 3. Rodar

```bash
npm run dev
```

Abra http://localhost:5173.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | Verifica o código com ESLint |

## Como testar

Entre em http://localhost:5173/login com as contas de demonstração do backend (somente desenvolvimento):

| Perfil | E-mail | Senha | Área |
|---|---|---|---|
| Super admin | `super@agendepro.com` | `super123` | `/super` |
| Admin da barbearia | `admin@barber-kings.com` | `admin123` | `/admin` |
| Profissional | `carlos@barber-kings.com` | `prof123` | `/professional` |

Portal público do cliente (agendamento): http://localhost:5173/barber-kings

## Problemas comuns

- Erro de rede ou CORS → o backend não está rodando, ou `VITE_API_URL` está errado ou sem `/api`.
- Mudou o `.env` e nada mudou → pare e rode `npm run dev` de novo.
- Login falha com contas de demonstração → o banco do backend estava com dados e o seed não rodou (ele só roda com o banco vazio).

---

<a id="english"></a>

[Português](#agendepro--frontend-react--vite) | **English**

AgendePro web interface (React 19, TypeScript, Vite, Tailwind). Runs at http://localhost:5173.

## Requirements

- Node.js 20.19+ or 22+ and npm
- Backend running at http://localhost:3333 (see [../backend-java](../backend-java))

## 1. Install

```bash
cd frontend
npm install
```

## 2. Configure

Create the `frontend/.env` file:

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

Then edit `.env` and point it to the local backend (the value must end in `/api`):

```env
VITE_API_URL=http://localhost:3333/api
```

- `.env.example` contains an example production URL; replace it with the local backend URL.
- `VITE_GOOGLE_CLIENT_ID` is optional (Google sign-in only).
- After changing `.env`, restart `npm run dev`.

## 3. Run

```bash
npm run dev
```

Open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Builds the production version into `dist/` |
| `npm run preview` | Serves the build locally |
| `npm run lint` | Lints the code with ESLint |

## How to try it

Go to http://localhost:5173/login with the backend's demo accounts (development only):

| Role | E-mail | Password | Area |
|---|---|---|---|
| Super admin | `super@agendepro.com` | `super123` | `/super` |
| Barbershop admin | `admin@barber-kings.com` | `admin123` | `/admin` |
| Professional | `carlos@barber-kings.com` | `prof123` | `/professional` |

Public customer portal (booking): http://localhost:5173/barber-kings

## Common issues

- Network or CORS error → the backend is not running, or `VITE_API_URL` is wrong or missing `/api`.
- Changed `.env` but nothing changed → stop and run `npm run dev` again.
- Demo login fails → the backend database already had data, so the seed did not run (it only runs on an empty database).

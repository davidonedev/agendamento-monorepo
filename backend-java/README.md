# AgendePro — Backend (Java / Spring Boot)

**Português** | [English](#english)

API do AgendePro em Java 21 + Spring Boot 3.3, rodando na porta **3333**.

## Requisitos

- Java 21
- Docker (para o PostgreSQL)

## 1. Banco de dados

```bash
docker run --name agendepro-java-pg -e POSTGRES_PASSWORD=root -e POSTGRES_DB=agendepro_java -p 5432:5432 -d postgres:16-alpine
```

- Se a porta 5432 estiver ocupada, use `-p 5433:5432` e ajuste `DB_URL` no `.env` para `jdbc:postgresql://localhost:5433/agendepro_java`.
- Nas próximas vezes, basta: `docker start agendepro-java-pg`

## 2. Configuração

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

| Variável | Para que serve | Padrão |
|---|---|---|
| `DB_URL` | URL JDBC do banco | `jdbc:postgresql://localhost:5432/agendepro_java` |
| `DB_USERNAME` / `DB_PASSWORD` | Usuário e senha do banco | `postgres` / `root` |
| `PORT` | Porta da API | `3333` |
| `JWT_SECRET` | Segredo dos tokens (troque fora do ambiente local) | placeholder |
| `CORS_ORIGIN` | Origens do frontend permitidas | `http://localhost:5173,http://localhost:3000` |
| `SEED_ENABLED` | Cria dados de demonstração no primeiro start (banco vazio) | `true` |

`SMTP_*` e `APP_URL` são opcionais. Sem SMTP configurado, o link de verificação de e-mail aparece apenas no console.

## 3. Rodar

```bash
./mvnw spring-boot:run      # Windows: .\mvnw.cmd spring-boot:run
```

Não precisa instalar o Maven. Na primeira vez baixa as dependências (demora). As migrations do banco rodam sozinhas.

**Windows — caminho com acento ou espaço** (ex.: `Área de Trabalho`): se aparecer `Could not find or load main class`, gere o jar e rode assim:

```powershell
.\mvnw.cmd -DskipTests package
java -jar target\agendepro-backend.jar
```

A mensagem `'EM' não é reconhecido como um comando interno` pode ser ignorada.

## 4. Conferir

- Saúde: http://localhost:3333/health → `{"status":"ok", ...}`
- Documentação interativa da API (Swagger): http://localhost:3333/swagger-ui.html

## Logins de demonstração (somente desenvolvimento)

| Perfil | E-mail | Senha |
|---|---|---|
| Super admin | `super@agendepro.com` | `super123` |
| Admin da barbearia | `admin@barber-kings.com` | `admin123` |
| Profissional | `carlos@barber-kings.com` | `prof123` |

## Testes

```bash
./mvnw test                 # exige o Docker em execução (Testcontainers)
```

## Problemas comuns

- `error during connect ... dockerDesktopLinuxEngine` → abra o Docker Desktop.
- `Connection refused` ou `password authentication failed` → o container do banco não está rodando, ou porta/senha diferem do `.env`.
- `Port 3333 was already in use` → há outra aplicação usando a porta 3333.
- PostgreSQL instalado no Windows já ocupa a porta 5432 → suba o container com `-p 5433:5432` e use `DB_URL=jdbc:postgresql://localhost:5433/agendepro_java` no `.env`.

Frontend: [../frontend](../frontend)

---

<a id="english"></a>

[Português](#agendepro--backend-java--spring-boot) | **English**

AgendePro API built with Java 21 + Spring Boot 3.3, running on port **3333**.

## Requirements

- Java 21
- Docker (for PostgreSQL)

## 1. Database

```bash
docker run --name agendepro-java-pg -e POSTGRES_PASSWORD=root -e POSTGRES_DB=agendepro_java -p 5432:5432 -d postgres:16-alpine
```

- If port 5432 is already in use, use `-p 5433:5432` and set `DB_URL` in `.env` to `jdbc:postgresql://localhost:5433/agendepro_java`.
- Next time, just run: `docker start agendepro-java-pg`

## 2. Configuration

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

| Variable | Purpose | Default |
|---|---|---|
| `DB_URL` | Database JDBC URL | `jdbc:postgresql://localhost:5432/agendepro_java` |
| `DB_USERNAME` / `DB_PASSWORD` | Database user and password | `postgres` / `root` |
| `PORT` | API port | `3333` |
| `JWT_SECRET` | Token signing secret (change it outside local development) | placeholder |
| `CORS_ORIGIN` | Allowed frontend origins | `http://localhost:5173,http://localhost:3000` |
| `SEED_ENABLED` | Creates demo data on first start (empty database) | `true` |

`SMTP_*` and `APP_URL` are optional. Without SMTP configured, the e-mail verification link is only printed to the console.

## 3. Run

```bash
./mvnw spring-boot:run      # Windows: .\mvnw.cmd spring-boot:run
```

No Maven installation needed. The first run downloads dependencies (it takes a while). Database migrations run automatically.

**Windows — path with accents or spaces** (e.g. `Área de Trabalho`): if you get `Could not find or load main class`, build the jar and run it instead:

```powershell
.\mvnw.cmd -DskipTests package
java -jar target\agendepro-backend.jar
```

The message `'EM' não é reconhecido como um comando interno` can be ignored.

## 4. Check

- Health: http://localhost:3333/health → `{"status":"ok", ...}`
- Interactive API documentation (Swagger): http://localhost:3333/swagger-ui.html

## Demo logins (development only)

| Role | E-mail | Password |
|---|---|---|
| Super admin | `super@agendepro.com` | `super123` |
| Barbershop admin | `admin@barber-kings.com` | `admin123` |
| Professional | `carlos@barber-kings.com` | `prof123` |

## Tests

```bash
./mvnw test                 # requires Docker running (Testcontainers)
```

## Common issues

- `error during connect ... dockerDesktopLinuxEngine` → start Docker Desktop.
- `Connection refused` or `password authentication failed` → the database container is not running, or the port/password differs from `.env`.
- `Port 3333 was already in use` → another application is using port 3333.
- A PostgreSQL installed on Windows already uses port 5432 → run the container with `-p 5433:5432` and set `DB_URL=jdbc:postgresql://localhost:5433/agendepro_java` in `.env`.

Frontend: [../frontend](../frontend)

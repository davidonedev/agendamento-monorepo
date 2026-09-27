# AgendePro Backend — Java / Spring Boot

Reescrita em Java/Spring Boot do backend original (`../backend`, Node.js + Express +
Prisma), feita como projeto de aprendizado/portfólio. O **frontend não foi alterado** —
este backend expõe exatamente o mesmo contrato de API (`/api/**`, envelope
`{success, data}` / `{success, error, code, details}`, porta `3333`), então basta
apontar `frontend/.env` (`VITE_API_URL`) para aqui.

## Stack

- **Java 21** + **Spring Boot 3.3**
- **Spring Data JPA** (Hibernate) + **PostgreSQL**
- **Flyway** — migrations versionadas (`src/main/resources/db/migration`)
- **Spring Security** (stateless) + **JJWT** — autenticação JWT, mesmas claims do backend Node
- **Bean Validation** (Jakarta) — porta das validações Zod
- **Lombok** — reduz boilerplate de getters/setters/construtores
- **Bucket4j** — rate limiting (porta do express-rate-limit)
- **spring-boot-starter-mail** + **Thymeleaf** — e-mail de verificação
- **springdoc-openapi** — Swagger UI em `/swagger-ui.html`
- **spring-dotenv** — lê `.env` localmente, igual ao backend Node
- **Testcontainers** — testes de integração com Postgres real (sem mocks)

## Diferenças deliberadas em relação ao backend Node

- **Banco separado** (`agendepro_java`) — não compartilha dados com o backend Node em produção.
- **MapStruct foi removido** do plano original em favor de mapeamento manual
  (métodos estáticos `from(...)` nos DTOs) — mais simples de revisar/depurar num
  projeto de aprendizado, sem processador de anotações adicional.
- **Enums** (`TenantStatus`, `TenantPlan`, `UserRole`, `AppointmentStatus`) são
  `VARCHAR` + `CHECK constraint` no banco (não enum nativo do Postgres), convertidos
  via `AttributeConverter` — mesmos valores em snake_case (`tenant_admin`, `no_show`...)
  tanto no JSON quanto no banco, para o frontend não perceber diferença.
- **`passwordHash` nunca é serializado** nas respostas aninhadas de cliente
  (ex: dentro de um agendamento) — o Node original inclui o registro `Client`
  inteiro via Prisma `include`, o que vazaria o hash; aqui isso foi corrigido.
- **Upsert de cliente por (tenantId, email)** no fluxo de agendamento usa
  check-then-act protegido pela constraint única do banco, em vez do upsert
  atômico do Prisma — sob concorrência extrema, o perdedor da corrida recebe
  `409 DUPLICATE_ENTRY` em vez de mesclar silenciosamente.
- `multer` existia no `package.json` do Node mas não havia nenhum endpoint de
  upload real — não foi portado (apenas o `/uploads/**` estático, por paridade).

## Como rodar

### 1. Banco de dados

```bash
docker run --name agendepro-java-pg -e POSTGRES_PASSWORD=root -e POSTGRES_DB=agendepro_java -p 5432:5432 -d postgres:16-alpine
```

Ou aponte `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` (em `.env`) para qualquer Postgres já
existente — só use um banco vazio dedicado (`agendepro_java`), não o mesmo do backend Node.

### 2. Configuração

```bash
cp .env.example .env
# edite JWT_SECRET, credenciais de banco, SMTP (opcional) etc.
```

### 3. Subir a aplicação

```bash
./mvnw spring-boot:run
```

Não é necessário ter o Maven instalado — o Maven Wrapper (`mvnw`/`mvnw.cmd`) baixa
tudo sozinho no primeiro uso. O Flyway aplica as migrations automaticamente ao
iniciar, e o seed de dados de demonstração roda se `SEED_ENABLED=true` (padrão) e o
banco estiver vazio.

### 4. Testar

- Health check: `GET http://localhost:3333/health`
- Swagger UI: `http://localhost:3333/swagger-ui.html`
- Login de exemplo: `admin@barber-kings.com` / `admin123` (veja mais contas no log do seed)

```bash
./mvnw test
```

## Estrutura (por domínio/feature)

```
com.agendepro
├── common/        envelope de resposta, exceções, handler global
├── security/       JWT, filtros, SecurityConfig
├── ratelimit/       Bucket4j
├── tenant/          Tenant, dashboard, configurações, receita (admin)
├── user/            User, autenticação (/api/auth/**)
├── professional/     Profissionais + auto-atendimento (/api/professional/**)
├── catalog/         Serviços, categorias de produto/serviço
├── client/           Clientes (área admin)
├── appointment/     Agendamentos, conflito de horário, slots
├── blockedslot/      Horários bloqueados
├── product/          Produtos (estoque)
├── reminder/         Clientes ausentes
├── publicapi/        Portal público (/api/public/**, sem auth)
├── superadmin/        Painel super admin (/api/super/**)
├── notification/      E-mail (Thymeleaf) e WhatsApp (Evolution API)
└── config/            Seed de dados, recursos estáticos, OpenAPI
```

Cada domínio segue `Controller → Service → Repository`, mesmo para CRUDs simples.

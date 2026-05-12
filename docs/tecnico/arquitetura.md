# Arquitetura do Sistema — ModelInk3D

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Backend — FastAPI](#4-backend--fastapi)
5. [Frontend — Next.js 15](#5-frontend--nextjs-15)
6. [Autenticação](#6-autenticação)
7. [Fluxo de Dados](#7-fluxo-de-dados)
8. [Decisões de Design](#8-decisões-de-design)

---

## 1. Visão Geral

O ModelInk3D é uma aplicação web full-stack containerizada com Docker Compose. Composta por três serviços independentes que se comunicam em uma rede Docker interna:

```
┌─────────────────────────────────────────────────────┐
│                   Host / Internet                   │
│                                                     │
│  :3000                              :8000           │
│  ┌──────────────┐          ┌────────────────────┐   │
│  │   Frontend   │ ─SSR──▶  │     Backend API    │   │
│  │  Next.js 15  │          │     FastAPI         │   │
│  │  (Node.js)   │ ◀─JSON─  │     (Uvicorn)      │   │
│  └──────────────┘          └────────┬───────────┘   │
│                                     │               │
│                             :5432   ▼               │
│                      ┌─────────────────────────┐    │
│                      │      PostgreSQL 16       │    │
│                      │  (dados + uploads ref.)  │    │
│                      └─────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Dois modos de comunicação do frontend com a API:**
- **SSR (Server Components):** usa `API_INTERNAL_URL=http://backend:8000` — comunicação direta entre containers, sem passar pela rede externa.
- **Client Components / SWR:** usa `NEXT_PUBLIC_API_URL=http://localhost:8000` — requisições do navegador do usuário.

---

## 2. Stack Tecnológica

### Backend

| Componente | Tecnologia | Versão |
|---|---|---|
| Framework web | FastAPI | 0.115.5 |
| Servidor ASGI | Uvicorn + Watchfiles | 0.32.1 |
| ORM | SQLAlchemy (async) | 2.0.36 |
| Driver DB | asyncpg | 0.30.0 |
| Migrações | Alembic | 1.14.0 |
| Validação | Pydantic v2 | 2.10.3 |
| Autenticação | python-jose (JWT) + bcrypt | 3.3.0 / 4.2.1 |
| Upload de arquivos | python-multipart + aiofiles | — |
| Geração PDF | ReportLab | 4.2.5 |

### Frontend

| Componente | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 15.x |
| Linguagem | TypeScript | 5.x |
| Fetch / cache | SWR | 2.x |
| Cliente HTTP | Axios | — |
| Estilização | Tailwind CSS | 3.x |
| Ícones | lucide-react | — |
| Formulários | react-hook-form | — |
| Notificações | react-hot-toast | — |
| Datas | date-fns (pt-BR) | — |

### Infraestrutura

| Componente | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL 16 Alpine |
| Containerização | Docker + Docker Compose v2 |
| Build frontend | Next.js standalone output |
| Armazenamento de uploads | Volume Docker (`uploads_data`) |
| Armazenamento de dados | Volume Docker (`postgres_data`) |

---

## 3. Estrutura de Diretórios

```
modelink3d-app/
├── docker-compose.yml          # Orquestração dos 3 serviços
├── .env                        # Variáveis de ambiente (não versionar)
├── .env.example                # Template do .env
├── backup.sh                   # Script de backup do banco
├── docs/                       # Esta documentação
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/                # Migrações (não usadas ativamente — ver §4.5)
│   └── app/
│       ├── main.py             # Entrypoint, lifespan, routers
│       ├── database.py         # Engine, session, Base
│       ├── core/
│       │   ├── config.py       # Pydantic Settings (lê .env)
│       │   └── security.py     # JWT + bcrypt
│       ├── models/             # SQLAlchemy ORM models
│       ├── schemas/            # Pydantic schemas (I/O)
│       ├── routers/            # FastAPI routers (um por recurso)
│       └── services/
│           └── pdf.py          # Geração de recibo PDF (ReportLab)
│
└── frontend/
    ├── Dockerfile
    ├── next.config.js          # Rewrites, standalone output
    ├── tailwind.config.js
    ├── middleware.ts            # Proteção de rotas (JWT cookie)
    ├── lib/
    │   ├── api.ts              # Axios instance + helpers
    │   └── hooks.ts            # SWR hooks por recurso
    ├── components/
    │   ├── layout/
    │   │   └── Sidebar.tsx     # Navegação lateral
    │   ├── ui/
    │   │   ├── ImageUpload.tsx
    │   │   ├── MultiImageUpload.tsx
    │   │   └── MaterialSelector.tsx
    │   └── vitrine/
    │       └── ProductCarousel.tsx
    └── app/                    # Next.js App Router
        ├── page.tsx            # Vitrine pública (home "/")
        ├── vitrine/[id]/       # Detalhe de produto
        ├── (auth)/
        │   └── app/page.tsx   # Login (URL: /app)
        └── (dashboard)/
            └── dashboard/
                ├── page.tsx
                ├── orders/
                ├── kanban/
                ├── materials/
                ├── printers/
                ├── clients/
                ├── stock/
                ├── catalog/
                └── settings/
```

---

## 4. Backend — FastAPI

### 4.1 Entrypoint e Lifespan

`app/main.py` registra um `asynccontextmanager` como `lifespan` da aplicação FastAPI. Na inicialização ele executa:

1. `Base.metadata.create_all` — cria todas as tabelas que ainda não existem.
2. Migrações inline com `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — adiciona colunas novas sem exigir rollback ou downtime.
3. Criação do usuário administrador (se não existir).
4. Criação do registro `SystemSettings` com id=1 (singleton).

Esta abordagem permite deployar uma nova versão e as tabelas/colunas novas são criadas automaticamente na primeira inicialização.

### 4.2 Routers

Cada entidade tem seu próprio router registrado com um prefixo:

| Router | Prefixo | Auth |
|---|---|---|
| auth | `/auth` | Público (POST /token) / Protegido |
| clients | `/clients` | Requer JWT |
| printers | `/printers` | Requer JWT |
| materials | `/materials` | Requer JWT |
| extra_services | `/extra-services` | Requer JWT |
| orders | `/orders` | Requer JWT |
| stock | `/stock` | Misto (ver abaixo) |
| settings | `/settings` | Misto (ver abaixo) |
| catalog | `/catalog` | Requer JWT |
| upload | `/upload` | Requer JWT |

**Endpoints públicos (sem JWT):**
- `GET /stock/public` — lista itens com estoque > 0 para a vitrine.
- `GET /stock/public/{id}` — detalhe de um item para a página de produto.
- `GET /settings/public` — retorna apenas `whatsapp_number` para o botão da vitrine.

### 4.3 Sessão de Banco (async)

```python
# database.py
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

Cada request recebe uma sessão independente via `Depends(get_db)`. A sessão é fechada automaticamente ao final do request.

### 4.4 Padrão de Eager Loading

Para evitar N+1 queries, o router de orders usa `selectinload` para carregar relacionamentos de uma só vez:

```python
LOAD_OPTS = [
    selectinload(Order.extra_services).selectinload(OrderExtraService.extra_service),
    selectinload(Order.status_history),
    selectinload(Order.client),
    selectinload(Order.materials).selectinload(OrderMaterial.material),
]
```

### 4.5 Estratégia de Migração

O projeto usa Alembic instalado mas não utiliza seus scripts de migração gerados automaticamente. Em vez disso, adota **migrações inline no lifespan** com SQL idempotente (`IF NOT EXISTS`, `IF NOT EXISTS`). Esta escolha foi feita para simplificar o deploy: não há passo extra de `alembic upgrade head` — a aplicação se auto-migra ao iniciar.

A desvantagem é que não há histórico de versões de schema. Para projetos maiores, recomenda-se migrar para scripts Alembic versionados.

### 4.6 Upload de Arquivos

`POST /upload/image` recebe um `multipart/form-data` e salva o arquivo em `./uploads/`. O diretório é mapeado como volume Docker (`uploads_data`) para persistência entre deployments.

O frontend acessa os uploads via `GET /uploads/{filename}` — o FastAPI serve esses arquivos via `StaticFiles`. Em produção, recomenda-se servir esses estáticos via Nginx.

---

## 5. Frontend — Next.js 15

### 5.1 App Router e Route Groups

O projeto usa o **App Router** do Next.js 15 com route groups para organizar rotas sem afetar a URL:

```
app/
├── page.tsx                    →  /          (vitrine pública, Server Component)
├── (auth)/
│   └── app/page.tsx           →  /app       (login)
├── (dashboard)/
│   └── dashboard/...          →  /dashboard/...
└── vitrine/[id]/page.tsx      →  /vitrine/:id
```

O grupo `(auth)` foi necessário para evitar uma colisão de caminhos no container Docker: o diretório de trabalho do container é `/app`, e criar `app/app/page.tsx` causaria ambiguidade com o diretório raiz do projeto. O route group `(auth)` resolve isso sem afetar a URL final.

### 5.2 Server Components vs Client Components

- **Server Components** (`page.tsx` sem `"use client"`): usados na vitrine pública. Fazem fetch diretamente do backend interno (`API_INTERNAL_URL`) no servidor, sem expor a lógica ao browser.
- **Client Components** (`"use client"`): usados em todo o dashboard. Usam SWR para fetch reativo e mutação otimista.

### 5.3 SWR e Hooks

`lib/hooks.ts` centraliza todos os hooks de dados:

```typescript
export const useOrders = (status?: string) =>
  useSWR(`/orders${status ? `?status=${status}` : ""}`, fetcher);

export const useOrder   = (id?: number) => useSWR(id ? `/orders/${id}` : null, fetcher);
export const useClients = () => useSWR("/clients", fetcher);
// ...
```

O `fetcher` usa a instância Axios configurada em `lib/api.ts`, que injeta o token JWT automaticamente no header `Authorization: Bearer`.

### 5.4 Middleware de Autenticação

`middleware.ts` intercepta todas as requisições. Rotas não marcadas como públicas redirecionam para `/app` se não houver token no cookie:

```typescript
const PUBLIC_PREFIXES = ["/app", "/vitrine", "/uploads", "/_next", "/api"];
const isPublic = pathname === "/" || PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
```

O token é armazenado tanto em `localStorage` (para as chamadas Axios do lado cliente) quanto em um cookie `httpOnly: false` (para o middleware de servidor ler).

### 5.5 Build Docker — Standalone Output

O `next.config.js` configura `output: "standalone"` para gerar um bundle autossuficiente sem `node_modules` completo:

```javascript
module.exports = {
  output: "standalone",
  async rewrites() {
    const backend = process.env.API_INTERNAL_URL || "http://localhost:8000";
    return [{ source: "/uploads/:path*", destination: `${backend}/uploads/:path*` }];
  },
};
```

O rewrite `/uploads/:path*` permite que o browser acesse imagens via `http://localhost:3000/uploads/foto.jpg`, que é proxiado internamente para o backend — resolvendo o problema de CORS e URL pública.

---

## 6. Autenticação

### Fluxo de Login

```
1. Usuário submete email + senha em /app
2. Frontend POST /auth/token (form-urlencoded)
3. Backend valida credenciais, retorna { access_token, token_type }
4. Frontend salva token em localStorage + cookie
5. Axios interceptor injeta Authorization: Bearer <token> em toda requisição
6. Middleware Next.js lê o cookie para proteger rotas SSR
```

### Token JWT

- **Algoritmo:** HS256
- **Payload:** `{ "sub": "email@usuario.com", "exp": <timestamp> }`
- **Expiração:** 7 dias (configurável via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Chave:** `SECRET_KEY` do `.env`

### Proteção do Backend

Cada endpoint protegido usa `Depends(get_current_user)`:

```python
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    email = decode_token(token)
    # Valida token e carrega usuário do banco
```

---

## 7. Fluxo de Dados

### Criar Pedido com Multi-Material

```
1. Frontend: POST /orders
   { item_name, print_type, estimated_time, materials: [{material_id, estimated_weight}, ...], ... }

2. Backend:
   a. Cria registro Order
   b. db.flush() → gera order.id
   c. Cria OrderMaterial para cada item da lista materials
   d. Define order.material_id = materials[0].material_id (retrocompatibilidade)
   e. Cria OrderStatusHistory com status=BUDGET
   f. db.commit()
   g. Recalcula cost_price via _calculate_cost()
   h. db.commit() novamente
   i. Retorna order enriquecido

3. Frontend: mutate() → SWR refaz o fetch da lista
```

### Finalizar Pedido e Deduzir Material

```
1. Frontend: PATCH /orders/{id}/finish
   { actual_weight: 42.5 }

2. Backend:
   a. Carrega order com materials eagerly loaded
   b. Calcula total_est = soma dos estimated_weight de cada OrderMaterial
   c. Para cada material:
      deduct = actual_weight × (om.estimated_weight / total_est)
      material.current_weight = max(0, current_weight - deduct)
   d. Cria OrderStatusHistory com status=FINISHED
   e. db.commit()
```

---

## 8. Decisões de Design

### Por que FastAPI + SQLAlchemy async?

A farm opera múltiplas impressoras simultaneamente. O modelo assíncrono do FastAPI + asyncpg permite que o servidor trate centenas de requisições concorrentes com baixo consumo de memória, adequado para rodar num hardware doméstico (ex: mini PC, Raspberry Pi 5).

### Por que Next.js App Router com route groups?

O App Router permite misturar Server Components (vitrine pública com SSR para SEO e sem flash de loading) com Client Components (dashboard interativo com SWR). Os route groups resolvem o problema de separar a área pública da privada sem duplicar layouts.

### Por que migrações inline em vez de Alembic scripts?

Para simplificar o ciclo de deploy: `docker compose up -d --build` é o único comando necessário. Não há `alembic upgrade head` separado. A desvantagem (sem histórico de schema) foi aceita dado o tamanho e contexto do projeto.

### Por que ReportLab para PDF?

ReportLab é a biblioteca PDF mais madura para Python, sem dependências externas (não precisa de Chrome headless, wkhtmltopdf, etc.), funciona perfeitamente dentro do container Alpine.

### Por que armazenar uploads localmente?

Para simplicidade operacional numa farm pequena. Volumes Docker são persistentes, fazem parte do backup e não exigem serviços externos (S3, Cloudinary). Para escalar, o `upload.py` poderia ser adaptado para enviar para um bucket.

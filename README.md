# ModelInk3D Farm Manager

Sistema de gestão para farm de impressão 3D — FastAPI + Next.js + PostgreSQL + Docker.

## Início rápido

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e gere um SECRET_KEY seguro:
# openssl rand -hex 32

# 2. Subir todos os serviços
docker compose up -d --build

# 3. Acessar
# Frontend:  http://localhost:3000
# API docs:  http://localhost:8000/docs
# Vitrine:   http://localhost:3000/vitrine
```

**Login padrão:** `admin@modelink.local` / `admin123`
> Troque a senha nas variáveis de ambiente antes de expor na internet.

## Serviços

| Serviço    | Porta | Descrição              |
|------------|-------|------------------------|
| Frontend   | 3000  | Next.js PWA            |
| Backend    | 8000  | FastAPI + Swagger UI   |
| PostgreSQL | 5432  | Banco de dados         |

## PWA (Android)

Acesse `http://<ip-do-servidor>:3000` no Chrome Android → menu (⋮) → **"Adicionar à tela inicial"**.

## Backup

```bash
chmod +x backup.sh
./backup.sh
# Backups salvos em ./backups/
```

Para automatizar, adicione ao crontab:
```
0 2 * * * /caminho/para/modelink3d-app/backup.sh
```

## Estrutura

```
modelink3d-app/
├── backend/        # FastAPI + SQLAlchemy + Alembic
├── frontend/       # Next.js 15 + Tailwind CSS
├── docker-compose.yml
├── backup.sh
└── REQUISITOS.md
```

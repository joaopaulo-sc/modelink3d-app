# ModelInk3D — Documentação

Sistema de gerenciamento para farm de impressão 3D. Controla pedidos, materiais, impressoras, estoque e vitrine pública.

---

## Índice

### Para o Usuário
- [Guia de Uso](guia-usuario.md) — como operar o sistema no dia a dia
- [Configuração Inicial](configuracao.md) — primeiros passos após instalar

### Técnico
- [Arquitetura do Sistema](tecnico/arquitetura.md) — visão geral, stack e decisões de design
- [API Reference](tecnico/api.md) — todos os endpoints REST documentados
- [Banco de Dados](tecnico/banco-de-dados.md) — esquema de tabelas e relacionamentos
- [Deploy e Infraestrutura](tecnico/deploy.md) — como subir o sistema em produção
- [Backup e Manutenção](tecnico/backup.md) — rotinas de backup e operação

---

## Visão Rápida

```
Vitrine pública   →  http://localhost:3000/
Painel de gestão  →  http://localhost:3000/dashboard
Login             →  http://localhost:3000/app
API REST          →  http://localhost:8000
Docs interativas  →  http://localhost:8000/docs
```

## Stack

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 15 (App Router, TypeScript) |
| Backend     | FastAPI + Python 3.12               |
| Banco       | PostgreSQL 16                       |
| ORM         | SQLAlchemy 2.0 (async)              |
| Auth        | JWT (HS256, 7 dias)                 |
| Deploy      | Docker Compose                      |

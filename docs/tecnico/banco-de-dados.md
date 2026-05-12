# Banco de Dados — ModelInk3D

Banco: **PostgreSQL 16**
ORM: **SQLAlchemy 2.0 (async)**

---

## Diagrama de Entidades

```
users
  └── (sem relacionamentos — usuário único de sistema)

system_settings
  └── (singleton, id=1)

clients
  └──< orders (client_id → clients.id)

printers
  └──< orders (printer_id → printers.id)

materials
  ├──< order_materials (material_id → materials.id)
  └──< stock_items (material_id → materials.id)

extra_services
  └──< order_extra_services (extra_service_id → extra_services.id)

orders
  ├──< order_materials       (order_id, CASCADE DELETE)
  ├──< order_extra_services  (order_id, CASCADE DELETE)
  └──< order_status_history  (order_id, CASCADE DELETE)

catalog_items
  └── (independente — referência para criação de pedidos/stock)

stock_items
  └── material (material_id → materials.id, opcional)
```

---

## Tabelas

### `users`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| email | VARCHAR(255) | UNIQUE NOT NULL | Identificador de login |
| password_hash | VARCHAR(255) | NOT NULL | Hash bcrypt da senha |

> O sistema foi projetado para um único usuário administrador. Não há papéis ou permissões diferenciadas.

---

### `system_settings`

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| id | INTEGER | 1 | Sempre 1 (singleton) |
| fdm_rate_per_hour | FLOAT | 5.0 | Custo de máquina FDM por hora (R$) |
| resin_rate_per_hour | FLOAT | 8.0 | Custo de máquina Resina por hora (R$) |
| default_margin | FLOAT | 0.30 | Margem de lucro padrão (30%) |
| default_min_alert_weight | FLOAT | 150.0 | Alerta padrão de estoque baixo (g) |
| whatsapp_number | VARCHAR(30) | NULL | Número para o botão da vitrine |
| updated_at | TIMESTAMPTZ | now() | Última atualização |

---

### `clients`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| name | VARCHAR(255) | NOT NULL | Nome completo |
| whatsapp | VARCHAR(30) | NULL | Número WhatsApp (`5511...`) |
| email | VARCHAR(255) | NULL | |
| notes | TEXT | NULL | Observações internas |
| created_at | TIMESTAMPTZ | now() | |

---

### `printers`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| name | VARCHAR(100) | NOT NULL | Nome da impressora |
| model | VARCHAR(100) | NULL | Modelo (ex: X1 Carbon) |
| status | ENUM | NOT NULL | `Idle` \| `Printing` \| `Maintenance` |

---

### `materials`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| brand | VARCHAR(100) | NOT NULL | Marca (ex: Bambu Lab) |
| material_type | VARCHAR(50) | NOT NULL | PLA, PETG, ABS, ASA, TPU, etc. |
| color | VARCHAR(80) | NOT NULL | Cor (ex: Red, Transparent) |
| initial_weight | FLOAT | NOT NULL | Peso ao cadastrar (g) |
| current_weight | FLOAT | NOT NULL | Peso atual após deduções (g) |
| min_alert_weight | FLOAT | DEFAULT 150 | Limiar de alerta de estoque baixo (g) |
| price_per_gram | FLOAT | DEFAULT 0 | Preço por grama em R$ |
| created_at | TIMESTAMPTZ | now() | |

> `low_stock` não é uma coluna — é calculado em Python: `current_weight <= min_alert_weight`.

---

### `extra_services`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| name | VARCHAR(100) | NOT NULL | Nome do serviço (ex: Pintura) |
| default_price | FLOAT | DEFAULT 0 | Preço sugerido ao adicionar ao pedido |

---

### `orders`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| client_id | INTEGER | FK → clients, NULL | Cliente associado |
| item_name | VARCHAR(255) | NOT NULL | Nome da peça |
| file_url | VARCHAR(500) | NULL | Link do arquivo 3D |
| status | ENUM | NOT NULL | Ver abaixo |
| print_type | VARCHAR(10) | NOT NULL | `FDM` ou `Resin` |
| estimated_weight | FLOAT | NULL | Peso estimado total (g) — legado |
| actual_weight | FLOAT | NULL | Peso real consumido (g) |
| estimated_time | FLOAT | NULL | Tempo estimado (horas) |
| cost_price | FLOAT | NULL | Custo calculado automaticamente (R$) |
| sell_price | FLOAT | NULL | Preço de venda (R$) |
| down_payment | FLOAT | DEFAULT 0 | Sinal recebido (R$) |
| failure_count | INTEGER | DEFAULT 0 | Quantas vezes houve falha |
| notes | TEXT | NULL | Observações |
| printer_id | INTEGER | FK → printers, NULL | Impressora em uso |
| material_id | INTEGER | FK → materials, NULL | Material principal — legado |
| deadline | TIMESTAMPTZ | NULL | Prazo de entrega |
| created_at | TIMESTAMPTZ | now() | |

**Status possíveis (ENUM `OrderStatus`):**

| Valor | Descrição |
|-------|-----------|
| `Budget` | Orçamento — não confirmado |
| `Queued` | Na fila de produção |
| `Printing` | Sendo impresso agora |
| `PostProcessing` | Pós-processamento (lixar, lavar, etc.) |
| `Finished` | Impressão concluída |
| `Delivered` | Entregue ao cliente |

> **Campos legados:** `material_id` e `estimated_weight` foram mantidos para retrocompatibilidade com pedidos criados antes do suporte a múltiplos materiais. Novos pedidos usam a tabela `order_materials`.

---

### `order_materials`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| order_id | INTEGER | FK → orders CASCADE | Pedido |
| material_id | INTEGER | FK → materials | Material usado |
| estimated_weight | FLOAT | NULL | Peso estimado deste material (g) |

> Ao finalizar o pedido, o peso real é distribuído proporcionalmente entre os materiais com base no `estimated_weight` de cada um.

---

### `order_extra_services`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| order_id | INTEGER | FK → orders CASCADE | |
| extra_service_id | INTEGER | FK → extra_services | |
| price | FLOAT | NOT NULL | Preço cobrado neste pedido específico |
| notes | TEXT | NULL | Observações do serviço |

---

### `order_status_history`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| order_id | INTEGER | FK → orders CASCADE | |
| status | ENUM | NOT NULL | Status registrado |
| changed_at | TIMESTAMPTZ | now() | Momento da mudança |
| notes | TEXT | NULL | Motivo ou observação |

---

### `catalog_items`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| name | VARCHAR(255) | NOT NULL INDEX | Nome do modelo |
| description | TEXT | NULL | Descrição |
| print_type | VARCHAR(10) | DEFAULT 'FDM' | `FDM` ou `Resin` |
| default_weight | FLOAT | NULL | Peso padrão (g) |
| default_time | FLOAT | NULL | Tempo padrão (horas) |
| file_url | VARCHAR(500) | NULL | Link do arquivo |
| image_url | VARCHAR(500) | NULL | URL da imagem de capa |
| notes | TEXT | NULL | |
| created_at | TIMESTAMPTZ | now() | |

---

### `stock_items`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | SERIAL | PK | |
| name | VARCHAR(255) | NOT NULL | Nome do produto |
| quantity | INTEGER | DEFAULT 0 | Quantidade em estoque |
| sell_price | FLOAT | DEFAULT 0 | Preço de venda (R$) |
| production_cost | FLOAT | NULL | Custo de produção (R$) |
| material_id | INTEGER | FK → materials, NULL | Material usado |
| image_url | VARCHAR(500) | NULL | URL da imagem principal (legado) |
| image_urls | JSON | NULL | Array de URLs de imagens |
| description | TEXT | NULL | Descrição exibida na vitrine |
| created_at | TIMESTAMPTZ | now() | |

> `image_urls` é um array JSON de strings. A primeira URL é usada como capa. `image_url` (legado) é mantido para retrocompatibilidade.

---

## Estratégia de Criação de Schema

As tabelas são criadas pelo SQLAlchemy via `Base.metadata.create_all` no lifespan da aplicação. Colunas adicionadas em versões posteriores usam `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — também executado no lifespan, garantindo idempotência.

```python
# Exemplo de migração inline (backend/app/main.py)
await conn.execute(text(
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30)"
))
await conn.execute(text(
    "CREATE TABLE IF NOT EXISTS order_materials (...)"
))
```

## Backup e Restore

Ver [Backup e Manutenção](backup.md).

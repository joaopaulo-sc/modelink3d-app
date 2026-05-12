# API Reference — ModelInk3D

Base URL: `http://localhost:8000`

Documentação interativa gerada automaticamente: `http://localhost:8000/docs` (Swagger UI)

---

## Autenticação

A maioria dos endpoints requer um token JWT no header:

```
Authorization: Bearer <token>
```

### POST /auth/token

Autentica o usuário e retorna o token de acesso.

**Body** (`application/x-www-form-urlencoded`)
```
username=admin@modelink.local&password=admin123
```

**Resposta 200**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### GET /auth/me

Retorna os dados do usuário autenticado.

**Resposta 200**
```json
{ "id": 1, "email": "admin@modelink.local" }
```

### POST /auth/change-password

Altera a senha do usuário autenticado.

**Body** (JSON)
```json
{
  "current_password": "admin123",
  "new_password": "nova-senha-segura"
}
```
**Resposta 204** (sem conteúdo)

---

## Configurações

### GET /settings/public *(público, sem auth)*

Retorna apenas os dados necessários para a vitrine.

**Resposta 200**
```json
{ "whatsapp_number": "5511999999999" }
```

### GET /settings *(requer auth)*

Retorna todas as configurações do sistema.

**Resposta 200**
```json
{
  "fdm_rate_per_hour": 5.0,
  "resin_rate_per_hour": 8.0,
  "default_margin": 0.3,
  "default_min_alert_weight": 150.0,
  "whatsapp_number": "5511999999999",
  "updated_at": "2026-05-10T12:00:00Z"
}
```

### PUT /settings *(requer auth)*

Atualiza as configurações do sistema.

**Body** (JSON) — todos os campos são obrigatórios:
```json
{
  "fdm_rate_per_hour": 6.0,
  "resin_rate_per_hour": 10.0,
  "default_margin": 0.35,
  "default_min_alert_weight": 200.0,
  "whatsapp_number": "5511888888888"
}
```

---

## Pedidos (Orders)

### GET /orders *(requer auth)*

Lista todos os pedidos, opcionalmente filtrado por status.

**Query params**
- `status` (opcional): `Budget` | `Queued` | `Printing` | `PostProcessing` | `Finished` | `Delivered`

**Resposta 200** — array de `OrderOut`

### POST /orders *(requer auth)*

Cria um novo pedido.

**Body** (JSON)
```json
{
  "item_name": "Suporte para parede",
  "print_type": "FDM",
  "client_id": 3,
  "estimated_time": 2.5,
  "deadline": "2026-05-15T18:00:00",
  "down_payment": 20.0,
  "sell_price": 85.00,
  "notes": "Cor vermelha, acabamento fosco",
  "file_url": "https://drive.google.com/...",
  "materials": [
    { "material_id": 1, "estimated_weight": 35.0 },
    { "material_id": 2, "estimated_weight": 10.0 }
  ],
  "extra_services": [
    { "extra_service_id": 1, "price": 15.00, "notes": null }
  ]
}
```

**Resposta 201** — `OrderOut`

### GET /orders/{id} *(requer auth)*

Retorna um pedido completo com histórico de status, materiais e serviços extras.

**Resposta 200** — `OrderOut`

### PUT /orders/{id} *(requer auth)*

Atualiza um pedido existente. Substitui completamente `materials` e `extra_services` se fornecidos.

**Body** — mesmos campos do POST, todos opcionais.

**Resposta 200** — `OrderOut`

### PATCH /orders/{id}/status *(requer auth)*

Avança ou retrocede o status manualmente.

**Body**
```json
{ "status": "Queued", "notes": "Aprovado pelo cliente" }
```

### PATCH /orders/{id}/finish *(requer auth)*

Finaliza o pedido e debita o peso real dos materiais.

**Body**
```json
{ "actual_weight": 42.5, "notes": "Finalizado sem problemas" }
```

### PATCH /orders/{id}/failure *(requer auth)*

Registra falha de impressão. Incrementa o contador de falhas e retorna o pedido para `Queued`.

**Body**
```json
{
  "partial_weight_used": 12.0,
  "notes": "Falha de adesão na camada 30"
}
```

### GET /orders/{id}/invoice *(requer auth)*

Gera e retorna o recibo em PDF.

**Resposta 200** — `application/pdf` (download)

### DELETE /orders/{id} *(requer auth)*

Remove o pedido e todo seu histórico (cascade).

**Resposta 204**

---

## Schema: OrderOut

```json
{
  "id": 1,
  "item_name": "Suporte para parede",
  "status": "Queued",
  "print_type": "FDM",
  "client_id": 3,
  "client_name": "João Silva",
  "estimated_weight": 45.0,
  "actual_weight": null,
  "estimated_time": 2.5,
  "cost_price": 35.75,
  "sell_price": 85.00,
  "down_payment": 20.0,
  "failure_count": 0,
  "notes": "Cor vermelha",
  "printer_id": 2,
  "material_id": 1,
  "deadline": "2026-05-15T18:00:00Z",
  "created_at": "2026-05-10T10:00:00Z",
  "materials": [
    {
      "id": 1,
      "material_id": 1,
      "estimated_weight": 35.0,
      "material_name": "Bambu PLA Red"
    }
  ],
  "extra_services": [
    {
      "id": 1,
      "extra_service_id": 1,
      "price": 15.00,
      "notes": null,
      "extra_service_name": "Pintura"
    }
  ],
  "status_history": [
    {
      "id": 1,
      "status": "Budget",
      "changed_at": "2026-05-10T10:00:00Z",
      "notes": null
    }
  ]
}
```

---

## Materiais

### GET /materials *(requer auth)*

Lista todos os materiais ordenados por marca.

**Resposta 200**
```json
[
  {
    "id": 1,
    "brand": "Bambu Lab",
    "material_type": "PLA",
    "color": "Red",
    "initial_weight": 1000.0,
    "current_weight": 743.2,
    "min_alert_weight": 150.0,
    "price_per_gram": 0.0899,
    "low_stock": false,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

### POST /materials *(requer auth)*

Cria um novo material.

**Body**
```json
{
  "brand": "Bambu Lab",
  "material_type": "PLA",
  "color": "Red",
  "initial_weight": 1000.0,
  "min_alert_weight": 150.0,
  "price_per_gram": 0.0899
}
```
> Se `current_weight` não for informado, é inicializado igual a `initial_weight`.

### PATCH /materials/{id} *(requer auth)*

Atualiza campos de um material. Aceita qualquer subconjunto dos campos:

```json
{
  "brand": "Bambu Lab",
  "material_type": "PETG",
  "color": "Blue",
  "initial_weight": 1000.0,
  "current_weight": 650.0,
  "min_alert_weight": 200.0,
  "price_per_gram": 0.095
}
```

### DELETE /materials/{id} *(requer auth)*

Remove o material. **Resposta 204**

---

## Clientes

### GET /clients *(requer auth)*

Lista todos os clientes.

### POST /clients *(requer auth)*

```json
{
  "name": "João Silva",
  "whatsapp": "5511999999999",
  "email": "joao@example.com",
  "notes": "Prefere entrega aos sábados"
}
```

### PUT /clients/{id} *(requer auth)*

Atualiza os dados de um cliente.

### DELETE /clients/{id} *(requer auth)*

Remove o cliente. Retorna **409** se houver pedidos vinculados.

---

## Impressoras

### GET /printers *(requer auth)*

Lista todas as impressoras.

**Resposta 200**
```json
[
  { "id": 1, "name": "Bambu X1C #1", "model": "X1 Carbon", "status": "Idle" }
]
```

### POST /printers *(requer auth)*

```json
{ "name": "Bambu X1C #1", "model": "X1 Carbon", "status": "Idle" }
```

Status possíveis: `Idle` | `Printing` | `Maintenance`

### PATCH /printers/{id} *(requer auth)*

Atualiza status ou dados da impressora.

### DELETE /printers/{id} *(requer auth)*

Remove a impressora. **Resposta 204**

---

## Serviços Extras

### GET /extra-services *(requer auth)*

Lista os tipos de serviços extras disponíveis.

### POST /extra-services *(requer auth)*

```json
{ "name": "Pintura", "default_price": 20.0 }
```

### PUT /extra-services/{id} *(requer auth)*

Atualiza nome e preço padrão.

### DELETE /extra-services/{id} *(requer auth)*

Remove o serviço. **Resposta 204**

---

## Catálogo

### GET /catalog *(requer auth)*

Lista todos os itens do catálogo.

### POST /catalog *(requer auth)*

```json
{
  "name": "Vaso Gyroid",
  "description": "Vaso com padrão gyroid, tamanho médio",
  "print_type": "FDM",
  "default_weight": 80.0,
  "default_time": 3.5,
  "file_url": "https://www.printables.com/...",
  "image_url": "http://localhost:8000/uploads/vaso.jpg",
  "notes": "Usar modo vase mode"
}
```

### PUT /catalog/{id} *(requer auth)*

Atualiza um item do catálogo.

### DELETE /catalog/{id} *(requer auth)*

Remove o item. **Resposta 204**

---

## Estoque (Pronta Entrega)

### GET /stock/public *(público)*

Lista itens com `quantity > 0`. Usado pela vitrine.

### GET /stock/public/{id} *(público)*

Retorna um item específico independentemente da quantidade. Usado pela página de detalhe da vitrine.

### GET /stock *(requer auth)*

Lista todos os itens, incluindo os com quantidade 0.

### POST /stock *(requer auth)*

```json
{
  "name": "Vaso Gyroid Azul",
  "quantity": 3,
  "sell_price": 45.00,
  "production_cost": 18.50,
  "material_id": 1,
  "description": "Vaso decorativo com padrão gyroid",
  "image_url": "http://localhost:8000/uploads/vaso.jpg",
  "image_urls": [
    "http://localhost:8000/uploads/vaso_1.jpg",
    "http://localhost:8000/uploads/vaso_2.jpg"
  ]
}
```

### PUT /stock/{id} *(requer auth)*

Atualiza todos os campos de um item.

### DELETE /stock/{id} *(requer auth)*

Remove o item. **Resposta 204**

---

## Upload de Imagens

### POST /upload/image *(requer auth)*

Faz upload de uma imagem e retorna a URL pública.

**Body** (`multipart/form-data`)
- `file`: arquivo de imagem (JPEG, PNG, WebP, GIF)

**Resposta 200**
```json
{ "url": "http://localhost:8000/uploads/abc123_foto.jpg" }
```

O arquivo é salvo em `./uploads/` no container do backend e servido via `GET /uploads/{filename}`. No frontend, o rewrite do Next.js permite acessar também via `http://localhost:3000/uploads/{filename}`.

---

## Health Check

### GET /health *(público)*

```json
{ "status": "ok" }
```

Usado pelo Docker Compose e sistemas de monitoramento.

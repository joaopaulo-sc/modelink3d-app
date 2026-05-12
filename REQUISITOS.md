# Documento de Requisitos do Sistema: ModelInk3D Farm Manager

## 1. Visão Geral

O ModelInk3D Farm Manager é um sistema projetado para gerenciar a produção e o fluxo de trabalho de uma farm de impressão 3D (3 impressoras FDM e 1 de Resina). O sistema substituirá as atuais planilhas de controle por uma interface unificada, rodando em um ambiente conteinerizado (Docker) e com acesso otimizado para dispositivos móveis Android via PWA.

---

## 2. Requisitos Funcionais

### 2.1. Gestão de Pedidos (Orders)

**RF01 — Cadastro de Pedidos**
O usuário deve ser capaz de criar pedidos contendo: nome da peça, link ou arquivo do modelo 3D, prazo de entrega, tipo de impressão (FDM/Resina), peso estimado (obtido do fatiador), tempo estimado de impressão e observações.

**RF02 — Precificação Automática**
O sistema deve calcular uma sugestão de preço de venda com base na seguinte fórmula:

```
Custo Material = peso_estimado × preço_por_grama_do_material
Custo Produção = tempo_impressão_horas × taxa_horária_por_tipo (FDM ou Resina)
Custo Serviços Extras = soma dos preços dos serviços adicionados
Preço Sugerido = (Custo Material + Custo Produção + Custo Serviços Extras) × (1 + margem_lucro)
```

Todos os parâmetros configuráveis (taxas horárias, margem de lucro) devem ser gerenciados na tela de Configurações do Sistema (ver RF19). O usuário pode aceitar ou sobrescrever o preço sugerido antes de salvar.

**RF03 — Serviços Extras**
O usuário deve poder adicionar um ou mais serviços extras a um pedido, selecionando de uma lista pré-cadastrada (ex: Pintura Personalizada, Pós-processamento de Resina, Lixamento). Cada serviço extra adicionado pode ter seu preço individual ajustado para aquele pedido específico.

**RF04 — Acompanhamento de Status**
Todo pedido deve ter um status rastreável com os seguintes estados:
- `Orçamento` → `Na Fila` → `Imprimindo` → `Pós-Processamento` → `Finalizado` → `Entregue`

Cada transição de status deve ser registrada com data/hora automaticamente, formando um histórico auditável do pedido. A fila Kanban deve destacar visualmente (cor amarela) pedidos com prazo em menos de 24 horas e (cor vermelha) pedidos com prazo já vencido.

**RF05 — Gestão Financeira Básica**
Registro de valor cobrado (`sellPrice`), custo estimado (`costPrice`), e valor de sinal pago pelo cliente (`downPayment`). O sistema deve exibir o saldo restante a receber por pedido.

**RF06 — Geração de Recibos (Invoice)**
O sistema deve gerar um recibo do pedido em PDF contendo: dados do cliente, detalhamento dos serviços, materiais utilizados e valores. O arquivo deve estar pronto para impressão ou compartilhamento direto via WhatsApp.

**RF07 — Registro de Falha de Impressão**
O usuário deve poder registrar uma falha durante a impressão de um pedido, informando o motivo (ex: descolamento, entupimento, falta de material). Ao registrar uma falha:
- O pedido retorna automaticamente para o status `Na Fila`.
- O consumo parcial de material (se houver) pode ser registrado e descontado do estoque.
- O campo `failureCount` é incrementado no pedido para rastreabilidade.

---

### 2.2. Gestão de Produção (Fila Kanban)

**RF08 — Fila de Impressão**
Interface interativa Kanban para visualização e gestão da fila de impressão, com colunas correspondentes aos status do RF04. Deve permitir reordenar pedidos por arrastar e soltar (drag-and-drop) para priorização manual.

**RF09 — Atribuição de Máquinas**
O sistema deve permitir vincular um pedido a uma impressora específica (FDM 1, FDM 2, FDM 3, Resina 1) no momento em que o status avança para `Imprimindo`.

**RF10 — Status das Máquinas**
Cadastro e controle de status manual de cada máquina: `Disponível`, `Imprimindo`, `Manutenção`. A dashboard deve exibir o estado atual de cada impressora em tempo real (atualização manual pelo usuário).

---

### 2.3. Gestão de Suprimentos (Estoque de Materiais)

**RF11 — Cadastro de Insumos**
Registro de rolos de filamento e garrafas de resina com os campos: Marca, Material (PLA, PETG, ABS, ABS-Like Resina, etc.), Cor, Peso/Volume Inicial, **Preço por Grama/mL** (usado na precificação automática) e Peso/Volume Mínimo de Alerta.

**RF12 — Baixa de Material com Confirmação**
Ao finalizar um pedido (transição para `Finalizado`), o sistema deve exibir uma tela de confirmação solicitando o peso/volume **real** consumido na impressão. O campo é pré-preenchido com o `estimatedWeight` do pedido como sugestão, mas o usuário deve confirmar ou corrigir antes de a baixa ser efetivada no estoque.

**RF13 — Alertas de Estoque**
Notificação visual na dashboard e push notification PWA quando um material atingir ou ultrapassar a quantidade mínima predefinida.

---

### 2.4. Estoque de Peças Prontas (Pronta Entrega)

**RF14 — Gestão de Estoque de Peças Prontas**
Controle de peças impressas disponíveis para pronta entrega, com campos: Nome, Quantidade, Preço de Venda, Custo de Produção, Material utilizado (FK para `Material`) e imagem da peça.

**RF15 — Catálogo (Vitrine)**
Geração de uma página pública simples (URL compartilhável) ou PDF com as peças disponíveis para pronta entrega, incluindo foto, nome e preço. Pronto para compartilhar via WhatsApp ou Instagram.

---

### 2.5. Cadastro de Clientes

**RF16 — Gestão de Clientes**
Cadastro contendo: Nome, WhatsApp (com botão de atalho para iniciar conversa no app), Instagram (@), e Endereço de Entrega.

**RF17 — Histórico do Cliente**
Visualização de todos os pedidos já realizados por um cliente, com totais financeiros consolidados (total gasto, total em aberto).

---

### 2.6. Configurações do Sistema

**RF18 — Gestão de Serviços Extras**
Cadastro e edição da lista de serviços extras disponíveis, com nome e preço padrão de cada serviço.

**RF19 — Parâmetros de Precificação**
Tela de configuração com os seguintes parâmetros globais:
- Taxa horária para impressão FDM (R$/h)
- Taxa horária para impressão Resina (R$/h)
- Margem de lucro padrão (%)
- Peso mínimo de alerta de estoque padrão (g)

**RF20 — Notificações Push (PWA)**
O sistema deve enviar notificações push para os seguintes eventos:
- Material atingiu nível mínimo de estoque.
- Prazo de entrega de um pedido em menos de 24 horas.
- Prazo de entrega de um pedido já vencido.

---

## 3. Requisitos Não Funcionais

**RNF01 — Compatibilidade Mobile (Android)**
A interface deve ser "Mobile First", utilizando a abordagem PWA (Progressive Web App). Isso permite instalação diretamente na tela inicial do Android, com interface nativa e suporte a notificações push, sem a complexidade de publicação na Play Store.

**RNF02 — Autenticação**
O sistema deve exigir autenticação para acesso. Implementar login com usuário e senha (bcrypt para hash). A sessão deve ser mantida via JWT com expiração configurável. A página pública do catálogo (Vitrine, RF15) é a única rota acessível sem autenticação.

**RNF03 — Implantação Conteinerizada**
O sistema inteiro (Frontend, Backend e Banco de Dados) deve ser empacotado em containers Docker via `docker-compose`, garantindo fácil implantação local ou em um VPS na nuvem.

**RNF04 — Experiência do Usuário (UI/UX) e Agilidade**
A interface deve focar na simplicidade e usabilidade. Telas de inserção rápida de pedidos e clientes devem ter o mínimo de campos obrigatórios e etapas. Campos não essenciais devem ser opcionais ou acessíveis em seção expansível ("avançado").

**RNF05 — Backup e Segurança dos Dados**
Os volumes do banco de dados no Docker devem ter rotinas documentadas de backup (script de dump agendado via cron). O arquivo de backup deve ser gerado localmente e, opcionalmente, enviado para um destino remoto (ex: pasta no Google Drive via rclone).

---

## 4. Arquitetura e Modelagem de Dados

### 4.1. Stack Tecnológico Sugerido

| Camada | Tecnologia |
|---|---|
| Frontend (PWA) | Next.js (React) + Tailwind CSS |
| Backend | Node.js com NestJS ou Python com FastAPI |
| Banco de Dados | PostgreSQL + Prisma ORM |
| Containerização | Docker + docker-compose |

### 4.2. Estrutura de Banco de Dados

**Tabela: `Client`**
```
id, name, whatsapp, instagram, address, createdAt
```

**Tabela: `Order`**
```
id
clientId           (FK → Client)
itemName
fileUrl            (caminho local ou URL externa do modelo 3D)
status             (Enum: Budget|Queued|Printing|PostProcessing|Finished|Delivered)
type               (Enum: FDM|Resin)
estimatedWeight    (gramas, obtido do fatiador)
actualWeight       (gramas, confirmado na finalização — usado para baixa real no estoque)
estimatedTime      (horas, obtido do fatiador)
costPrice          (calculado)
sellPrice          (sugerido ou sobrescrito pelo usuário)
downPayment        (sinal pago)
failureCount       (contador de falhas de impressão)
printerId          (FK → Printer, nullable)
materialId         (FK → Material, nullable)
createdAt
deadline
```

**Tabela: `OrderStatusHistory`**
```
id, orderId (FK → Order), status (Enum), changedAt, notes
```

**Tabela: `ExtraService`**
```
id, name, defaultPrice, estimatedTimeHours
```

**Tabela: `OrderExtraService`** (junção)
```
id, orderId (FK → Order), extraServiceId (FK → ExtraService), price, notes
```

**Tabela: `Printer`**
```
id, name (ex: FDM 1 - Ender 3), type (Enum: FDM|Resin), status (Enum: Idle|Printing|Maintenance)
```

**Tabela: `Material`**
```
id, brand, type (ex: PLA, PETG, ABS-Like), color,
initialWeight, currentWeight, minAlertWeight,
pricePerGram, createdAt
```

**Tabela: `StockItem`** (Pronta Entrega)
```
id, name, quantity, sellPrice, productionCost,
materialId (FK → Material, nullable),
imageUrl, createdAt
```

**Tabela: `Settings`**
```
id (único registro), fdmRatePerHour, resinRatePerHour,
defaultMargin, defaultMinAlertWeight, updatedAt
```

**Tabela: `User`** (autenticação)
```
id, email, passwordHash, createdAt
```

---

## 5. Fluxo Principal de um Pedido

```
[Cliente entra em contato]
       ↓
[RF01] Criar Pedido → Status: Orçamento
       ↓
[RF02/RF03] Calcular preço + adicionar serviços extras
       ↓
[RF05] Registrar sinal (downPayment) se necessário
       ↓
Avançar status → Na Fila
       ↓
[RF09] Atribuir impressora → Status: Imprimindo
       ↓ (ou em caso de falha → RF07 → volta para Na Fila)
       ↓
Status: Pós-Processamento (se houver serviços extras)
       ↓
[RF12] Confirmar peso real consumido → Baixa no estoque
       ↓
Status: Finalizado
       ↓
[RF06] Gerar recibo PDF → compartilhar com cliente
       ↓
Status: Entregue
```

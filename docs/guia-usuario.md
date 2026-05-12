# Guia de Uso — ModelInk3D

Este guia cobre todas as funcionalidades do sistema na perspectiva do operador da farm.

---

## Sumário

1. [Acessando o Sistema](#1-acessando-o-sistema)
2. [Dashboard](#2-dashboard)
3. [Pedidos](#3-pedidos)
4. [Kanban de Produção](#4-kanban-de-produção)
5. [Materiais](#5-materiais)
6. [Impressoras](#6-impressoras)
7. [Clientes](#7-clientes)
8. [Catálogo](#8-catálogo)
9. [Pronta Entrega (Estoque)](#9-pronta-entrega-estoque)
10. [Vitrine Pública](#10-vitrine-pública)
11. [Configurações](#11-configurações)
12. [Recibo PDF](#12-recibo-pdf)

---

## 1. Acessando o Sistema

Acesse **`http://seu-servidor:3000/app`** (ou `http://localhost:3000/app` em ambiente local).

Entre com o e-mail e senha do administrador. Após o login você é redirecionado para o **Dashboard**.

> O endereço raiz `/` exibe a vitrine pública, visível para qualquer pessoa sem login.

---

## 2. Dashboard

Tela inicial do painel. Apresenta um resumo em tempo real da operação:

| Card | O que mostra |
|------|-------------|
| **Pedidos Ativos** | Pedidos que ainda não foram finalizados ou entregues |
| **Imprimindo Agora** | Impressoras com status "Printing" |
| **Materiais Baixos** | Materiais abaixo do peso mínimo de alerta (destaque em amarelo) |
| **Prazos Urgentes** | Pedidos com prazo nas próximas 24 horas ou já atrasados |

Abaixo dos cards:
- **Alerta de estoque baixo** — lista os materiais críticos com link direto para a página de materiais.
- **Pedidos com prazo urgente** — lista com tempo restante ou "ATRASADO" em vermelho.
- **Status das Impressoras** — painel com todas as máquinas cadastradas e seus estados atuais.

---

## 3. Pedidos

### 3.1 Listagem

Acesse **Dashboard → Pedidos**. A listagem mostra todos os pedidos com filtros por status:

- Orçamento · Na Fila · Imprimindo · Pós-Processamento · Finalizado · Entregue

Clique em qualquer pedido para ver os detalhes.

### 3.2 Criar Novo Pedido

Clique em **+ Novo Pedido**. O formulário tem três seções:

**Informações do Pedido**
- **Nome da Peça** — obrigatório.
- **Tipo de Impressão** — FDM ou Resina.
- **Cliente** — opcional; selecione um cliente já cadastrado.
- **Tempo Estimado** — em horas; usado no cálculo de custo.
- **Prazo de Entrega** — data e hora.
- **Materiais** — adicione um ou mais materiais com o peso estimado de cada um. Use "Adicionar Material" para pedidos que combinam cores ou tipos diferentes.
- **Link do Arquivo 3D** — URL para o arquivo no Google Drive, Printables, etc.

> **Selecionar do Catálogo:** no topo do formulário há um atalho para pré-preencher nome, tipo e tempo estimado a partir de um item do catálogo de modelos.

**Serviços Extras**
- Adicione serviços avulsos (pintura, suporte, etc.) com o preço de cada um.

**Financeiro**
- O sistema calcula automaticamente o **preço sugerido** baseado em: custo de material + custo de máquina (taxa/hora × tempo) + serviços extras + margem configurada.
- Clique em "Usar este valor" para aceitar o sugerido ou informe um preço manual.
- **Sinal Recebido** — valor já pago pelo cliente no momento do orçamento.

### 3.3 Detalhe do Pedido

A página de detalhe mostra todas as informações e permite:

**Avançar Status**
O fluxo padrão é:
```
Orçamento → Na Fila → Imprimindo → Pós-Processamento → Finalizado → Entregue
```
Clique em **"Avançar para [próximo status]"**. Ao avançar para **Imprimindo**, o sistema pergunta qual impressora será usada e a marca como ocupada. Ao avançar para **Finalizado**, o sistema pede o peso real consumido e debita do estoque de materiais automaticamente.

**Registrar Falha**
Disponível quando o pedido está em "Imprimindo". Registra a ocorrência, permite informar o peso de material já consumido e retorna o pedido para a fila. A impressora é marcada como disponível. O contador de falhas fica visível no pedido.

**Editar Pedido**
Clique no botão **Editar** (ícone de lápis no cabeçalho) para abrir o formulário de edição completo. Permite alterar qualquer campo, incluindo adicionar/remover materiais e serviços extras.

**Baixar Recibo**
Clique em **Recibo** para baixar o PDF com os dados do pedido.

### 3.4 Ciclo de Vida do Material

- **Na criação do pedido:** nenhum estoque é deduzido ainda.
- **Ao finalizar (status → Finished):** o sistema deduz o **peso real informado** proporcional entre os materiais do pedido.
- **Ao registrar falha:** o sistema deduz o **peso parcial informado** (se houver) proporcionalmente.

---

## 4. Kanban de Produção

Acesse **Dashboard → Kanban**. Visão em colunas de todos os pedidos ativos (exceto "Entregue").

Cada card mostra: nome da peça, cliente, prazo e contador de falhas. Pedidos atrasados têm borda vermelha; urgentes têm borda amarela.

Botões disponíveis em cada card:
- **Avançar →** — mesmo efeito do botão na página de detalhe.
- **Falha** — disponível apenas na coluna "Imprimindo".
- **Detalhes** — abre a página completa do pedido.

---

## 5. Materiais

Acesse **Dashboard → Materiais**.

### 5.1 Cadastrar Material

Clique em **+ Novo Material** e preencha:

| Campo | Descrição |
|-------|-----------|
| Marca | Ex: Bambu Lab, Polymaker, Creality |
| Tipo | PLA, PETG, ABS, ASA, TPU, ABS-Like Resina, Standard Resina |
| Cor | Nome da cor conforme embalagem |
| Peso Inicial (g) | Peso do carretel/frasco ao ser cadastrado |
| Alerta Mínimo (g) | Sistema alerta quando o peso atual atingir este valor (padrão: 150g) |
| Preço/grama (R$) | Usado no cálculo automático de custo dos pedidos |

O **Peso Atual** é inicializado igual ao Peso Inicial e vai sendo deduzido conforme os pedidos são finalizados.

### 5.2 Editar Material

Clique no ícone de lápis em qualquer material para editar todos os campos, incluindo o peso atual (útil para correções manuais após pesagem real do carretel).

### 5.3 Barra de Progresso

Cada material exibe uma barra de consumo:
- **Azul** — acima de 30% do peso inicial
- **Amarelo** — entre 10% e 30%
- **Vermelho** — abaixo de 10%

O ícone de alerta (⚠) aparece quando o peso atual está abaixo do mínimo configurado.

---

## 6. Impressoras

Acesse **Dashboard → Impressoras**.

Cadastre cada máquina com nome, modelo e status inicial. Os status possíveis são:

| Status | Significado |
|--------|-------------|
| Idle | Disponível para uso |
| Printing | Imprimindo um pedido |
| Maintenance | Fora de operação para manutenção |

O status é atualizado automaticamente ao avançar pedidos. Também pode ser alterado manualmente na listagem.

---

## 7. Clientes

Acesse **Dashboard → Clientes**.

Cadastre clientes com:
- **Nome** — obrigatório.
- **WhatsApp** — número no formato internacional (ex: `5511999999999`). Aparece no recibo PDF.
- **E-mail** e **Notas** — opcionais.

Na listagem, cada cliente mostra o total de pedidos associados. Clientes vinculados a pedidos não podem ser excluídos.

---

## 8. Catálogo

Acesse **Dashboard → Catálogo**.

O catálogo armazena **modelos de peças** que são impressas com frequência. Não é um estoque — é uma biblioteca de referência para acelerar a criação de pedidos.

Campos:
- **Nome** e **Descrição**
- **Tipo** (FDM / Resina)
- **Tempo padrão** — em horas; copiado automaticamente ao criar pedido
- **Link do arquivo 3D** — URL do modelo
- **Imagem de capa**
- **Notas internas**

Ao criar um novo pedido ou um novo item de estoque (pronta entrega), você pode **Importar do Catálogo** para pré-preencher os campos automaticamente.

---

## 9. Pronta Entrega (Estoque)

Acesse **Dashboard → Pronta Entrega**.

Gerencie itens já impressos e disponíveis para venda imediata. Esses itens são exibidos na vitrine pública.

### 9.1 Cadastrar Item

Clique em **+ Novo Item**. Opcionalmente use **"Importar do Catálogo"** para preencher nome, descrição e imagem automaticamente.

Campos:
| Campo | Descrição |
|-------|-----------|
| Nome | Nome do produto |
| Quantidade | Unidades disponíveis em estoque |
| Preço de Venda | Preço exibido na vitrine |
| Custo de Produção | Custo interno (não exibido na vitrine) |
| Material | Material usado (referência interna) |
| Descrição | Texto exibido na vitrine |
| Fotos | Até 8 imagens; a primeira é a capa |

### 9.2 Múltiplas Imagens

O upload suporta várias imagens por item. Na vitrine, o cliente pode navegar pelo carrossel. A primeira imagem é sempre a capa nos cards de listagem.

### 9.3 Editar Item

Clique no ícone de lápis no card. O formulário de edição ocupa a linha completa da grade, permitindo atualizar quantidade, preço, imagens, etc.

### 9.4 Controle de Estoque

Itens com quantidade **0** ficam ocultos na vitrine pública e aparecem esmaecidos no painel. Atualize a quantidade manualmente após cada venda.

---

## 10. Vitrine Pública

Acessível em **`http://seu-servidor:3000/`** sem necessidade de login.

Exibe todos os itens de pronta entrega com quantidade > 0. Cada card tem:
- Foto de capa
- Nome e descrição
- Preço
- **Botão WhatsApp** — abre uma conversa pré-formatada com o número configurado nas Configurações do sistema, contendo o nome do produto e o link da página de detalhes.

### Página de Detalhes do Produto

Clique em qualquer item para abrir a página individual (`/vitrine/{id}`) com:
- Carrossel de imagens com miniaturas
- Descrição completa
- Botão WhatsApp com mensagem pré-formatada

---

## 11. Configurações

Acesse **Dashboard → Configurações**.

| Campo | Descrição |
|-------|-----------|
| Taxa FDM (R$/hora) | Custo de máquina por hora para impressões FDM |
| Taxa Resina (R$/hora) | Custo de máquina por hora para impressões de resina |
| Margem padrão (%) | Percentual aplicado sobre o custo para calcular o preço sugerido |
| Alerta mín. de material (g) | Valor padrão para novos materiais (pode ser ajustado por material) |
| WhatsApp de contato | Número no formato `5511999999999` (sem `+` ou espaços) |

### Fórmula de Preço Sugerido

```
custo_material = soma(peso_estimado × preço_por_grama) por material
custo_máquina  = tempo_estimado × taxa_por_hora
custo_extras   = soma(preço de cada serviço extra)

custo_total    = custo_material + custo_máquina + custo_extras
preço_sugerido = custo_total × (1 + margem)
```

---

## 12. Recibo PDF

Disponível na página de detalhe de qualquer pedido. O PDF inclui:

- Número e data do pedido
- Prazo de entrega e status
- Dados do cliente (nome e WhatsApp, se cadastrado)
- Tabela de serviços: nome da peça, tipo de impressão e preço
- Serviços extras com preços individuais
- Resumo financeiro: total, sinal pago e restante a pagar

O texto longo na coluna "Descrição" é quebrado automaticamente para não ultrapassar a coluna seguinte.

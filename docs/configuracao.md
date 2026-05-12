# Configuração Inicial — ModelInk3D

Este guia descreve como instalar e configurar o sistema pela primeira vez.

---

## Sumário

1. [Requisitos](#1-requisitos)
2. [Instalação com Docker Compose](#2-instalação-com-docker-compose)
3. [Variáveis de Ambiente](#3-variáveis-de-ambiente)
4. [Primeiro Acesso](#4-primeiro-acesso)
5. [Configuração do Sistema](#5-configuração-do-sistema)
6. [Cadastros Iniciais Recomendados](#6-cadastros-iniciais-recomendados)
7. [Acesso via Rede Local ou Internet](#7-acesso-via-rede-local-ou-internet)
8. [Atualização do Sistema](#8-atualização-do-sistema)

---

## 1. Requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Docker | 24.x |
| Docker Compose | v2.x (plugin integrado) |
| RAM | 1 GB disponível |
| Disco | 2 GB livres (+ espaço para uploads e banco) |
| SO | Linux, macOS ou Windows com WSL2 |

Não é necessário instalar Python, Node.js ou PostgreSQL diretamente na máquina.

---

## 2. Instalação com Docker Compose

```bash
# 1. Clone o repositório
git clone <url-do-repositorio> modelink3d-app
cd modelink3d-app

# 2. Crie o arquivo de configuração a partir do exemplo
cp .env.example .env

# 3. Edite o .env com suas credenciais (veja seção 3)
nano .env

# 4. Suba os containers
docker compose up -d

# 5. Verifique se estão rodando
docker compose ps
```

O sistema levará cerca de 30 segundos na primeira execução para:
- Baixar as imagens base do Docker Hub
- Compilar o frontend Next.js
- Criar as tabelas do banco de dados
- Criar o usuário administrador

---

## 3. Variáveis de Ambiente

O arquivo `.env` na raiz do projeto controla todas as configurações sensíveis.

```env
# ─── Banco de Dados ─────────────────────────────────────────
POSTGRES_USER=modelink
POSTGRES_PASSWORD=modelink123        # Troque por uma senha forte
POSTGRES_DB=modelink3d

# ─── Segurança JWT ──────────────────────────────────────────
# Gere com: openssl rand -hex 32
SECRET_KEY=changeme-use-openssl-rand-hex-32

# ─── Usuário Administrador (criado na primeira execução) ─────
FIRST_ADMIN_EMAIL=admin@modelink.local
FIRST_ADMIN_PASSWORD=admin123        # Troque após o primeiro login

# ─── URL da API (acessível pelo navegador do cliente) ────────
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Gerar SECRET_KEY segura

```bash
openssl rand -hex 32
```

Cole o resultado no `.env`. **Nunca compartilhe esse valor.**

### NEXT_PUBLIC_API_URL em produção

Se o sistema será acessado por outros dispositivos na rede (celular, outro computador), substitua `localhost` pelo IP da máquina onde o Docker roda:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
```

---

## 4. Primeiro Acesso

1. Abra **`http://localhost:3000/app`** no navegador.
2. Entre com as credenciais definidas em `FIRST_ADMIN_EMAIL` e `FIRST_ADMIN_PASSWORD`.
3. **Troque a senha imediatamente**: vá em Configurações → Segurança → Alterar Senha.

---

## 5. Configuração do Sistema

Antes de cadastrar pedidos, configure as taxas financeiras em **Dashboard → Configurações**:

| Configuração | Valor recomendado inicial | Motivo |
|---|---|---|
| Taxa FDM (R$/hora) | Calcule seus custos fixos ÷ horas mensais de uso | Base para cálculo automático de preço |
| Taxa Resina (R$/hora) | Geralmente maior que FDM | Consumo de resina + IPA + equipamentos |
| Margem padrão | 30% a 50% | Lucro sobre o custo calculado |
| WhatsApp de contato | `5511999999999` | Botão de contato na vitrine pública |

> **Dica para calcular a taxa/hora:** some os custos mensais fixos (energia, depreciação, manutenção) e divida pelo número de horas que a máquina fica ligada por mês. Ex: R$ 300/mês ÷ 300h = R$ 1,00/hora. Some com o custo de mão de obra desejado.

---

## 6. Cadastros Iniciais Recomendados

Faça estes cadastros logo após a configuração para que o sistema funcione corretamente:

### 6.1 Impressoras

**Dashboard → Impressoras → + Nova Impressora**

Cadastre cada máquina com nome, modelo e tipo (FDM ou Resina). O status inicial deve ser "Idle" (disponível).

### 6.2 Materiais

**Dashboard → Materiais → + Novo Material**

Para cada carretel/frasco disponível, cadastre:
- Pese o carretel no momento do cadastro para ter o **peso atual** preciso.
- Configure o **Preço/grama** — é fundamental para o cálculo automático de custos.

Exemplo: Carretel PLA 1kg da Bambu Lab a R$ 89,90 → `0,0899` R$/g.

### 6.3 Clientes Recorrentes

**Dashboard → Clientes** — cadastre os clientes que já têm pedidos frequentes para agilizar o preenchimento dos próximos orçamentos.

### 6.4 Catálogo de Modelos

**Dashboard → Catálogo** — cadastre os modelos que você já imprime com frequência com os parâmetros padrão. Isso acelera a criação de novos pedidos.

---

## 7. Acesso via Rede Local ou Internet

### Rede Local (WiFi/LAN)

Para acessar de outros dispositivos na mesma rede (ex: celular Android):

1. Descubra o IP da máquina que roda o Docker:
   ```bash
   ip addr show | grep 'inet ' | grep -v '127.0.0.1'
   ```
2. Edite o `.env`:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.x.x:8000
   ```
3. Reconstrua:
   ```bash
   docker compose down && docker compose up -d --build
   ```
4. Acesse de qualquer dispositivo na rede: `http://192.168.x.x:3000`

### Acesso pela Internet (produção)

Para expor o sistema pela internet com domínio e HTTPS, consulte o [Guia de Deploy](tecnico/deploy.md).

---

## 8. Atualização do Sistema

Para atualizar após mudanças no código:

```bash
# Baixe as alterações
git pull

# Reconstrua e reinicie
docker compose down
docker compose up -d --build
```

Os dados do banco e uploads são preservados em volumes Docker e não são afetados pela atualização.

Para verificar os logs em caso de problema:
```bash
docker compose logs backend --tail=50
docker compose logs frontend --tail=50
```

# Deploy e Infraestrutura — ModelInk3D

---

## Sumário

1. [Deploy Local (desenvolvimento)](#1-deploy-local-desenvolvimento)
2. [Deploy em Rede Local (produção doméstica)](#2-deploy-em-rede-local-produção-doméstica)
3. [Deploy com Domínio e HTTPS (produção)](#3-deploy-com-domínio-e-https-produção)
4. [Variáveis de Ambiente de Produção](#4-variáveis-de-ambiente-de-produção)
5. [Hardening de Segurança](#5-hardening-de-segurança)
6. [Logs e Monitoramento](#6-logs-e-monitoramento)

---

## 1. Deploy Local (desenvolvimento)

```bash
git clone <repo> modelink3d-app
cd modelink3d-app
cp .env.example .env
docker compose up -d --build
```

Acesse:
- Vitrine: `http://localhost:3000`
- Painel: `http://localhost:3000/dashboard`
- Login: `http://localhost:3000/app`
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

---

## 2. Deploy em Rede Local (produção doméstica)

Cenário: mini PC ou servidor doméstico acessado por celulares e computadores na mesma rede WiFi.

### 2.1 Descobrir o IP do servidor

```bash
ip addr show | grep 'inet ' | grep -v '127.0.0.1'
# Exemplo: 192.168.1.100
```

### 2.2 Configurar o .env

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
SECRET_KEY=<gerado com openssl rand -hex 32>
POSTGRES_PASSWORD=<senha forte>
FIRST_ADMIN_EMAIL=admin@modelink.local
FIRST_ADMIN_PASSWORD=<senha forte>
```

### 2.3 Subir o sistema

```bash
docker compose up -d --build
```

Acesse de qualquer dispositivo na rede: `http://192.168.1.100:3000`

### 2.4 IP fixo no roteador

Para que o IP do servidor não mude após reinicializações, configure **DHCP reservado** (ou IP estático) no roteador doméstico para o endereço MAC da máquina servidora.

### 2.5 Iniciar automaticamente com o sistema

```bash
# Habilitar o serviço Docker para iniciar no boot
sudo systemctl enable docker

# O docker-compose.yml já tem restart: unless-stopped
# Os containers sobem automaticamente com o Docker
```

---

## 3. Deploy com Domínio e HTTPS (produção)

Para acessar o sistema pela internet com domínio e HTTPS, use Nginx como reverse proxy e Certbot para o certificado.

### 3.1 Pré-requisitos

- VPS com IP público (Ubuntu 22.04 recomendado)
- Domínio apontando para o IP da VPS (registro A no DNS)
- Docker + Docker Compose instalados

### 3.2 Ajustar portas no docker-compose.yml

Em produção, o Nginx vai fazer proxy — não é necessário expor as portas 3000 e 8000 diretamente. Remova ou comente as seções `ports` do frontend e backend:

```yaml
# frontend:
#   ports:
#     - "3000:3000"   ← remover em produção

# backend:
#   ports:
#     - "8000:8000"   ← remover em produção
```

Adicione o backend e frontend a uma rede Docker com o Nginx:

```yaml
networks:
  web:
    external: true
```

### 3.3 Instalar Nginx e Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 3.4 Configurar Nginx

```nginx
# /etc/nginx/sites-available/modelink3d

server {
    listen 80;
    server_name meudominio.com.br www.meudominio.com.br;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend FastAPI (API e uploads)
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/modelink3d /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.5 Obter certificado HTTPS

```bash
sudo certbot --nginx -d meudominio.com.br -d www.meudominio.com.br
```

O Certbot modifica automaticamente o Nginx para usar HTTPS e redirecionar HTTP → HTTPS. O certificado é renovado automaticamente a cada 90 dias.

### 3.6 .env para produção com domínio

```env
NEXT_PUBLIC_API_URL=https://meudominio.com.br/api
SECRET_KEY=<openssl rand -hex 32>
POSTGRES_PASSWORD=<senha muito forte>
```

---

## 4. Variáveis de Ambiente de Produção

| Variável | Obrigatório | Recomendação |
|----------|-------------|--------------|
| `SECRET_KEY` | Sim | `openssl rand -hex 32` — nunca use o valor padrão |
| `POSTGRES_PASSWORD` | Sim | Mínimo 20 caracteres aleatórios |
| `FIRST_ADMIN_PASSWORD` | Sim | Troque no primeiro login |
| `NEXT_PUBLIC_API_URL` | Sim | URL pública da API (com HTTPS em produção) |
| `API_INTERNAL_URL` | Não | Padrão `http://backend:8000` — funciona na rede Docker |

---

## 5. Hardening de Segurança

### 5.1 Não exponha o banco à internet

O PostgreSQL não deve ter porta publicada para fora do host:

```yaml
# docker-compose.yml — remover em produção ou restringir
db:
  ports:
    - "127.0.0.1:5432:5432"   # apenas localhost
```

### 5.2 Firewall

```bash
# Permitir apenas SSH, HTTP e HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 5.3 Trocar senha admin

Após o primeiro login, altere imediatamente a senha via **Configurações → Alterar Senha** ou via API:

```bash
curl -X POST http://localhost:8000/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"admin123","new_password":"nova-senha-forte"}'
```

### 5.4 SECRET_KEY

A `SECRET_KEY` assina todos os tokens JWT. Se for comprometida, todos os tokens ativos ficam inválidos ao trocá-la — o que força todos os usuários a fazer login novamente. Gere uma nova:

```bash
openssl rand -hex 32
```

---

## 6. Logs e Monitoramento

### Ver logs em tempo real

```bash
# Todos os serviços
docker compose logs -f

# Apenas backend
docker compose logs -f backend

# Apenas frontend
docker compose logs -f frontend
```

### Verificar status dos containers

```bash
docker compose ps
```

### Health check da API

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### Reiniciar um serviço específico

```bash
docker compose restart backend
docker compose restart frontend
```

### Parar e remover containers (sem apagar dados)

```bash
docker compose down
# Os volumes postgres_data e uploads_data são preservados
```

### Remover tudo (CUIDADO: apaga dados)

```bash
docker compose down -v
# Remove containers E volumes — dados do banco e uploads são perdidos
```

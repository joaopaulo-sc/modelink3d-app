# Backup e Manutenção — ModelInk3D

---

## Sumário

1. [O que precisa de backup](#1-o-que-precisa-de-backup)
2. [Backup do Banco de Dados](#2-backup-do-banco-de-dados)
3. [Backup de Uploads (Imagens)](#3-backup-de-uploads-imagens)
4. [Automatizar com Cron](#4-automatizar-com-cron)
5. [Restaurar Backup](#5-restaurar-backup)
6. [Manutenção de Rotina](#6-manutenção-de-rotina)

---

## 1. O que precisa de backup

| Dado | Onde fica | Criticidade |
|------|-----------|-------------|
| Banco de dados (pedidos, clientes, materiais...) | Volume Docker `postgres_data` | Alta |
| Imagens de produtos e catálogo | Volume Docker `uploads_data` | Média |
| Arquivo `.env` | Diretório raiz do projeto | Alta |

O código-fonte pode ser restaurado pelo repositório git. Os dados do banco e os uploads são os únicos dados que precisam de backup regular.

---

## 2. Backup do Banco de Dados

O projeto inclui o script `backup.sh` na raiz do projeto.

### Executar manualmente

```bash
chmod +x backup.sh
./backup.sh
```

O script:
1. Executa `pg_dump` dentro do container `modelink_db`
2. Grava o dump em `./backups/modelink3d_backup_YYYYMMDD_HHMMSS.sql`
3. Comprime com gzip
4. Mantém apenas os 10 backups mais recentes (apaga os mais antigos)

### Conteúdo do script

```bash
#!/bin/bash
set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="modelink3d_backup_${DATE}.sql"

mkdir -p "$BACKUP_DIR"

docker exec modelink_db pg_dump \
  -U "${POSTGRES_USER:-modelink}" \
  "${POSTGRES_DB:-modelink3d}" > "${BACKUP_DIR}/${FILENAME}"

gzip "${BACKUP_DIR}/${FILENAME}"

# Manter apenas os 10 mais recentes
ls -t "${BACKUP_DIR}"/*.gz | tail -n +11 | xargs -r rm --
```

### Backup para arquivo específico

```bash
docker exec modelink_db pg_dump \
  -U modelink modelink3d \
  > /tmp/backup_manual.sql
```

---

## 3. Backup de Uploads (Imagens)

Os uploads ficam no volume Docker `uploads_data`. Para fazer backup:

```bash
# Copiar do container para o host
docker cp modelink_backend:/app/uploads ./backups/uploads_$(date +%Y%m%d)/
```

Ou usar `rsync` se os uploads já estiverem mapeados como bind mount:

```bash
rsync -av ./backend/uploads/ /mnt/backup/modelink_uploads/
```

### Backup completo (banco + uploads) com tar

```bash
# Parar o sistema (opcional, para backup consistente)
docker compose stop

# Backup do volume do banco via docker
docker run --rm \
  -v modelink3d-app_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz /data

# Backup dos uploads
docker run --rm \
  -v modelink3d-app_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads_data_$(date +%Y%m%d).tar.gz /data

# Reiniciar
docker compose start
```

---

## 4. Automatizar com Cron

Para executar o backup diariamente às 3h da manhã:

```bash
# Editar crontab do usuário
crontab -e
```

Adicione a linha:

```cron
0 3 * * * cd /home/usuario/modelink3d-app && ./backup.sh >> /var/log/modelink_backup.log 2>&1
```

Para verificar o log:
```bash
tail -f /var/log/modelink_backup.log
```

### Backup semanal dos uploads

```cron
0 4 * * 0 docker cp modelink_backend:/app/uploads /mnt/backup/uploads_$(date +\%Y\%m\%d)/
```

---

## 5. Restaurar Backup

### Restaurar banco de dados

```bash
# 1. Descompactar o backup
gunzip backups/modelink3d_backup_20260510_030000.sql.gz

# 2. Dropar e recriar o banco (atenção: apaga todos os dados atuais)
docker exec -it modelink_db psql -U modelink -c "DROP DATABASE IF EXISTS modelink3d;"
docker exec -it modelink_db psql -U modelink -c "CREATE DATABASE modelink3d;"

# 3. Restaurar
docker exec -i modelink_db psql \
  -U modelink modelink3d \
  < backups/modelink3d_backup_20260510_030000.sql

# 4. Reiniciar o backend para executar as migrações
docker compose restart backend
```

### Restaurar em novo servidor

```bash
# 1. Clone o repositório no novo servidor
git clone <repo> modelink3d-app
cd modelink3d-app

# 2. Restaure o .env (mantenha ele em local seguro separado do backup)
cp /mnt/backup/env_backup .env

# 3. Suba os containers (cria banco vazio)
docker compose up -d

# 4. Aguarde o banco ficar disponível
sleep 10

# 5. Restaure o dump
docker exec -i modelink_db psql \
  -U modelink modelink3d \
  < /mnt/backup/modelink3d_backup_20260510_030000.sql

# 6. Restaure os uploads
docker cp /mnt/backup/uploads/. modelink_backend:/app/uploads/

# 7. Reinicie
docker compose restart
```

---

## 6. Manutenção de Rotina

### Verificar espaço em disco

```bash
# Espaço dos volumes Docker
docker system df -v

# Espaço do banco especificamente
docker exec modelink_db psql -U modelink modelink3d \
  -c "SELECT pg_size_pretty(pg_database_size('modelink3d'));"
```

### Limpar imagens Docker não usadas

Após atualizações, imagens antigas ficam acumuladas:

```bash
docker image prune -f
```

### Vacuum do PostgreSQL

Para manter performance do banco após muitos deletes/updates:

```bash
docker exec modelink_db psql -U modelink modelink3d -c "VACUUM ANALYZE;"
```

### Atualizar o sistema

```bash
git pull
docker compose down
docker compose up -d --build
```

Os dados são preservados nos volumes Docker durante a atualização.

### Verificar saúde dos containers

```bash
docker compose ps

# Saída esperada:
# modelink_db        running (healthy)
# modelink_backend   running
# modelink_frontend  running
```

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### Redefinir senha do administrador

Se a senha for perdida, ela pode ser redefinida diretamente no banco:

```bash
# Gerar hash de uma nova senha (execute no host com Python)
python3 -c "import bcrypt; print(bcrypt.hashpw(b'nova-senha', bcrypt.gensalt()).decode())"

# Atualizar no banco
docker exec modelink_db psql -U modelink modelink3d \
  -c "UPDATE users SET password_hash = '\$2b\$12\$...' WHERE email = 'admin@modelink.local';"
```

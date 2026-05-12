#!/bin/bash
set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="modelink3d_backup_${DATE}.sql"

mkdir -p "$BACKUP_DIR"

echo "Iniciando backup: $FILENAME"
docker exec modelink_db pg_dump \
  -U "${POSTGRES_USER:-modelink}" \
  "${POSTGRES_DB:-modelink3d}" > "${BACKUP_DIR}/${FILENAME}"

gzip "${BACKUP_DIR}/${FILENAME}"
echo "Backup salvo em: ${BACKUP_DIR}/${FILENAME}.gz"

# Manter apenas os 10 backups mais recentes
ls -t "${BACKUP_DIR}"/*.gz | tail -n +11 | xargs -r rm --
echo "Limpeza concluída. Backups retidos: $(ls ${BACKUP_DIR}/*.gz | wc -l)"

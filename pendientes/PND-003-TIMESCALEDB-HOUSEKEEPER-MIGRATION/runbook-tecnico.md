# Runbook Técnico — PND-003: Migración TimescaleDB Hypertables
## Zabbix 7.0.22 LTS — SRO-ZAB01 — Milicic S.A.

**ID:** PND-003  
**Fecha de Ejecución:** 25 de Septiembre de 2026  
**Estado:** ✅ Resuelto  
**Clasificación:** AUD-006 — Sobrecarga Plataforma (Housekeeper 100%)

---

## Problema

El proceso `housekeeper` de Zabbix Server mantuvo una utilización del **100%** de forma crónica.
Trigger: `Zabbix server: Utilization of housekeeper processes over 75%` (triggerid: 13473)

### Causa Raíz

`ZBX_ENABLE_TIMESCALEDB=true` estaba configurado en el contenedor pero las tablas `history*` y `trends*`
**nunca fueron migradas a hypertables**. TimescaleDB estaba instalado (v2.24.0, pg16) pero inactivo.
El housekeeper realizaba `DELETE` fila por fila sobre tablas PostgreSQL planas de hasta 33 GB.

---

## Infraestructura (SRO-ZAB01)

```
docker ps:
- zabbix-server          zabbix-server-pgsql:alpine-7.0-latest    Puerto: 10051
- zabbix-frontend        zabbix-web-nginx-pgsql:alpine-7.0-latest Puerto: 8080/8443
- zabbix-postgresql      timescale/timescaledb:latest-pg16         Puerto: 5432
- zabbix-agent           zabbix-agent2:alpine-7.0-latest           Puerto: 10050
- portainer              portainer/portainer-ce:lts                Puerto: 9443
- npm-app                jc21/nginx-proxy-manager:latest           Puerto: 80/443
```

Red: `zabbix_network-zabbix` (Docker network — gestionada por Portainer)

---

## Variables de Entorno del Contenedor (zabbix-server)

```
ZBX_MAXHOUSEKEEPERDELETE=2000        → pendiente cambio a 5000 via Portainer
ZBX_STARTPOLLERS=8
ZBX_VALUECACHESIZE=256M
ZBX_HOUSEKEEPINGFREQUENCY=1
ZBX_CACHESIZE=1024M
DB_SERVER_HOST=zabbix-postgresql
DB_SERVER_PORT=5432
ZBX_STARTPINGERS=3
ZBX_DBEXTENSION=timescaledb
ZBX_VMWARECACHESIZE=64M
ZBX_STARTVMWARECOLLECTORS=5
ZBX_ENABLE_TIMESCALEDB=true
ZBX_TIMEOUT=10
```

---

## Volumen de Tablas Pre-Migración

| Tabla         | Tamaño   |
|---------------|----------|
| history_uint  | 33 GB    |
| history       | 6.8 GB   |
| trends_uint   | 5.3 GB   |
| trends        | 715 MB   |
| history_text  | 461 MB   |
| history_str   | 194 MB   |
| history_log   | 28 MB    |
| **TOTAL**     | **~46 GB** |

---

## Procedimiento Ejecutado

### Paso 1 — Detener el Zabbix Server
```bash
docker stop zabbix-server
```

### Paso 2 — Migrar tablas a Hypertables (comando corregido con segundos enteros)
```bash
# Nota: clock es integer (Unix timestamp). El intervalo debe ser en SEGUNDOS, no INTERVAL.
# 86400 = 1 día | 2592000 = 30 días

docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \
"SELECT create_hypertable('history_log',  by_range('clock', 86400),   migrate_data => true, if_not_exists => true);"

docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \
"SELECT create_hypertable('history_str',  by_range('clock', 86400),   migrate_data => true, if_not_exists => true);"

docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \
"SELECT create_hypertable('history_text', by_range('clock', 86400),   migrate_data => true, if_not_exists => true);"

docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \
"SELECT create_hypertable('trends',       by_range('clock', 2592000), migrate_data => true, if_not_exists => true);"

docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \
"SELECT create_hypertable('trends_uint',  by_range('clock', 2592000), migrate_data => true, if_not_exists => true);"

docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \
"SELECT create_hypertable('history',      by_range('clock', 86400),   migrate_data => true, if_not_exists => true);"

# La más larga (~2.5 horas). Usar screen para evitar cortes de sesión:
screen -S zabbix-migration
docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \
"SELECT create_hypertable('history_uint', by_range('clock', 86400), migrate_data => true, if_not_exists => true);"
# Para reconectar si se corta: screen -r zabbix-migration
```

### Verificar progreso de history_uint
```bash
watch -n 30 "docker exec zabbix-postgresql psql -U zabbix -d zabbix -c \"
SELECT pid, state, now() - query_start AS elapsed 
FROM pg_stat_activity 
WHERE pid = <PID_DE_LA_MIGRACION>;\""
```

### Paso 3 — Verificar hypertables
```bash
docker exec zabbix-postgresql psql -U zabbix -d zabbix -c "
SELECT hypertable_name, num_chunks, 
       pg_size_pretty(hypertable_size(hypertable_name::regclass)) AS size
FROM timescaledb_information.hypertables 
ORDER BY hypertable_name;"
# Resultado esperado: 7 filas con num_chunks > 0
```

### Paso 4 — Reiniciar Zabbix Server
```bash
docker start zabbix-server
docker logs zabbix-server --tail 20
```

### Paso 5 — Configurar Retention Policies en TimescaleDB
```bash
docker exec zabbix-postgresql psql -U zabbix -d zabbix -c "
-- Función requerida para columnas integer (clock en Zabbix es integer, no TIMESTAMP)
DROP FUNCTION IF EXISTS unix_now();
CREATE OR REPLACE FUNCTION unix_now() 
RETURNS integer LANGUAGE SQL STABLE AS 
\$\$ SELECT extract(epoch from now())::integer \$\$;

-- Registrar en cada hypertable
SELECT set_integer_now_func('history',      'unix_now');
SELECT set_integer_now_func('history_uint', 'unix_now');
SELECT set_integer_now_func('history_str',  'unix_now');
SELECT set_integer_now_func('history_log',  'unix_now');
SELECT set_integer_now_func('history_text', 'unix_now');
SELECT set_integer_now_func('trends',       'unix_now');
SELECT set_integer_now_func('trends_uint',  'unix_now');

-- Políticas: 31 días = 2678400 seg | 365 días = 31536000 seg
SELECT add_retention_policy('history',      2678400,  if_not_exists => true);
SELECT add_retention_policy('history_uint', 2678400,  if_not_exists => true);
SELECT add_retention_policy('history_str',  2678400,  if_not_exists => true);
SELECT add_retention_policy('history_log',  2678400,  if_not_exists => true);
SELECT add_retention_policy('history_text', 2678400,  if_not_exists => true);
SELECT add_retention_policy('trends',       31536000, if_not_exists => true);
SELECT add_retention_policy('trends_uint',  31536000, if_not_exists => true);
"
```

### Paso 6 — Deshabilitar HK de History y Trends en UI de Zabbix
Ir a: **Administration → General → Housekeeping**
- History → **Desmarcar** "Enable internal housekeeping"
- Trends → **Desmarcar** "Enable internal housekeeping"
- Events, Services, Audit, Sessions → **mantener habilitados**

---

## Resultado de la Migración

| Hypertable   | Chunks | Tamaño Final | Retención | Job ID |
|--------------|--------|-------------|-----------|--------|
| history_log  | 33     | 9.4 MB      | 31 días   | 1003   |
| history_str  | 90     | 211 MB      | 31 días   | 1002   |
| history_text | 90     | 415 MB      | 31 días   | 1004   |
| trends       | 10     | 786 MB      | 365 días  | 1005   |
| trends_uint  | 10     | 5.1 GB      | 365 días  | 1006   |
| history      | 90     | 7.4 GB      | 31 días   | 1000   |
| history_uint | 90     | 34 GB       | 31 días   | 1001   |

---

## Rollback

```bash
# 1. Re-habilitar HK en UI: Administration → General → Housekeeping → marcar History y Trends
# 2. Opcional - eliminar retention policies:
docker exec zabbix-postgresql psql -U zabbix -d zabbix -c "
SELECT remove_retention_policy('history',      if_not_exists => true);
SELECT remove_retention_policy('history_uint', if_not_exists => true);
SELECT remove_retention_policy('history_str',  if_not_exists => true);
SELECT remove_retention_policy('history_log',  if_not_exists => true);
SELECT remove_retention_policy('history_text', if_not_exists => true);
SELECT remove_retention_policy('trends',       if_not_exists => true);
SELECT remove_retention_policy('trends_uint',  if_not_exists => true);
"
# Las hypertables son compatibles con el HK de Zabbix. No es necesario revertirlas.
```

---

## Pendientes

- [ ] Cambiar `ZBX_MAXHOUSEKEEPERDELETE` de 2000 a 5000 vía Portainer UI (stack `zabbix`)
      - Acceso: tunnel SSH `ssh -L 9443:127.0.0.1:9443 root@172.30.20.61` → `https://127.0.0.1:9443`
- [ ] Verificar caída de utilización del housekeeper en los próximos ciclos (~1-2h post-cambio)
      - Ítem: `zabbix[process,housekeeper,avg,busy]` en Host `Zabbix server`
- [ ] Evaluar retención de Events: Internal/Service/Discovery está en 1d (puede ser muy corto)
- [ ] Crear docker-compose.yml en Portainer para trazabilidad del stack

---

*Generado: 25/09/2026 — Milicic S.A. · Infraestructura & TI*

# 14. Procedimiento de Despliegue: Zabbix Proxy 7.0 LTS en Sucursales y Oficinas Remotas

**Organización:** Milicic S.A. | Infraestructura, Minería y Construcción  
**Área Emisora:** Gerencia de Infraestructura y Tecnología de la Información  
**Documento Técnico:** DOC-MIL-IT-ZBX-PROXY-2026-V1  
**Plataforma Base:** Zabbix 7.0 LTS | Ubuntu 26.04 LTS | SQLite3 Embedded  
**Servidor Central (HQ):** `172.30.20.61:10051`  
**Clasificación:** Documentación Oficial / Uso Interno  

---

## 1. Alcance y Arquitectura de Comunicación

Para garantizar la supervisión centralizada de infraestructura crítica en obradores, faenas mineras y oficinas satélites sin saturar los enlaces WAN satelitales (Starlink) ni comprometer la seguridad perimetral, se establece el despliegue de **Zabbix Proxy en Modo Activo**.

### 1.1. Principios de Operación
1. **Modo Activo Saliente:** El Proxy remoto inicia la conexión saliente hacia el Zabbix Server central (`172.30.20.61:10051`). No se requiere abrir puertos entrantes en los firewalls perimetrales (FortiGate) ni IPs públicas en la sucursal.
2. **Buffer Híbrido (RAM + Disco):** El proxy incorpora motor SQLite3 local con modo `ProxyBufferMode=hybrid` (16MB en memoria + almacenamiento local), garantizando que ante cortes climáticos del enlace satelital o contingencias WAN, las métricas se retengan localmente y se transmitan ordenadamente al restablecer el enlace.
3. **Aislamiento de Carga de Red:** El servidor central no sondea individualmente a cada switch, router o servidor de la sucursal; toda la recolección la realiza el Proxy localmente en la LAN y la envía comprimida y en lotes al datacenter central.

```mermaid
flowchart LR
    subgraph Sucursal["Sucursal Remota / Faena"]
        direction TB
        Dev1["Servidores / VMs Locales"] -->|Agent / ICMP| Proxy["Zabbix Proxy 7.0 LTS<br/>(SQLite3 + Hybrid Buffer)"]
        Dev2["Switches / Routers / APs"] -->|SNMP / Ping| Proxy
    end

    subgraph WAN["Conectividad Segura"]
        Proxy -.->|TCP 10051 Saliente<br/>(Starlink / VPN)| HQ
    end

    subgraph HQ["Sede Central / Datacenter"]
        Server["Zabbix Server Central<br/>172.30.20.61:10051"]
        DB[("Base de Datos Central")]
        UI["Consola Web / NOC"]
        Server --- DB
        Server --- UI
    end

    classDef milicicOrange fill:#FFF7ED,stroke:#EA580C,stroke-width:2px,color:#0F172A;
    classDef milicicSlate fill:#0F172A,stroke:#38BDF8,stroke-width:2px,color:#FFFFFF;
    classDef devBox fill:#F8FAFC,stroke:#94A3B8,stroke-width:1px,color:#1E293B;

    class Proxy milicicOrange;
    class Server,DB,UI milicicSlate;
    class Dev1,Dev2 devBox;
```

---

## 2. Guía de Instalación Paso a Paso (Ubuntu 26.04)

### Paso 1: Instalación de Repositorios y Paquetes
Ejecutar en la máquina o contenedor de la sucursal remota con privilegios de `root`:

```bash
# 1. Agregar el repositorio oficial de Zabbix 7.0 LTS
wget https://repo.zabbix.com/zabbix/7.0/ubuntu/pool/main/z/zabbix-release/zabbix-release_latest+ubuntu26.04_all.deb
dpkg -i zabbix-release_latest+ubuntu26.04_all.deb
apt update

# 2. Instalar el demonio de proxy con motor SQLite3 y fping
apt install -y zabbix-proxy-sqlite3 fping
```

---

### Paso 2: Configuración del Demonio (`/etc/zabbix/zabbix_proxy.conf`)
Editar el archivo de configuración asignando la IP del servidor central y el identificador unívoco de la localidad:

```ini
### Parámetros Principales
Server=172.30.20.61
Hostname=SUCURSAL-ZAB01        # Reemplazar con el nombre unívoco de la sucursal
LogFile=/var/log/zabbix/zabbix_proxy.log
LogFileSize=0
PidFile=/run/zabbix/zabbix_proxy.pid
SocketDir=/run/zabbix

### Base de Datos Embebida SQLite3
DBName=/var/lib/zabbix/zabbix_proxy.db
DBUser=zabbix

### Buffer Híbrido de Alta Disponibilidad
ProxyBufferMode=hybrid
ProxyMemoryBufferSize=16M

### Herramientas de Red y Sondeo
Timeout=4
FpingLocation=/usr/bin/fping
Fping6Location=/usr/bin/fping6
LogSlowQueries=3000
StatsAllowedIP=127.0.0.1
Include=/etc/zabbix/zabbix_proxy.d/*.conf
```

> [!WARNING]
> **Sensibilidad a Mayúsculas/Minúsculas (Case-Sensitive):**
> El parámetro `Hostname` en el archivo `.conf` debe coincidir **exactamente** con el nombre registrado en la consola web de Zabbix. De lo contrario, el servidor descartará las conexiones del proxy.

---

### Paso 3: Permisos de Directorios e Inicialización
El demonio Zabbix inicializa y estructura la base SQLite3 de forma automática en el primer arranque, siempre que cuente con permisos de escritura:

```bash
# Crear directorios operativos
mkdir -p /var/lib/zabbix /run/zabbix

# Aplicar permisos al usuario de servicio
chown -R zabbix:zabbix /var/lib/zabbix /run/zabbix

# Habilitar en el arranque del sistema e iniciar
systemctl enable zabbix-proxy
systemctl restart zabbix-proxy
```

---

## 3. Alta en la Consola Central de Zabbix Server

Acceder a la interfaz web de Zabbix (`http://172.30.20.61` o URL corporativa) y completar los siguientes parámetros:

| Parámetro | Valor Requerido | Descripción |
| :--- | :--- | :--- |
| **Ruta en Menú** | `Data collection → Proxies → Create proxy` | Ubicación en el panel de administración central. |
| **Proxy name** | `SUCURSAL-ZAB01` | Debe coincidir exactamente con el `Hostname=` configurado. |
| **Proxy mode** | `Active` | El proxy se conecta de forma proactiva al Server central. |
| **Address / Port** | *(Dejar en blanco)* | Al ser activo, el servidor no necesita la dirección IP del proxy. |
| **Description** | `Proxy de monitoreo local sucursal / faena` | Metadatos y notas operativas. |

---

## 4. Verificación Operativa y Troubleshooting

### 4.1. Inspección de Logs en Vivo
```bash
tail -f /var/log/zabbix/zabbix_proxy.log
```

### 4.2. Criterio de Éxito
El proxy se encuentra correctamente integrado cuando:
1. En el log local se registra:
   ```text
   received configuration data from server at "172.30.20.61", datalen ...
   ```
2. En la consola web (`Data collection → Proxies`), la columna **Last seen (age)** muestra valores inferiores a `10s` y el estado aparece en verde.

### 4.3. Resolución de Problemas Frecuentes
- **Error: `cannot send list of active checks to "X.X.X.X": host [NOMBRE] not found`**  
  *Causa:* Un equipo de la LAN intenta reportar métricas al proxy, pero aún no fue creado en el servidor central o en su ficha de configuración no tiene seleccionado este proxy en el campo *Monitored by proxy*.
  *Solución:* Dar de alta el host en el Zabbix Server y asignarle el proxy correspondiente.
- **Error: Conexión rechazada o timeout hacia `172.30.20.61:10051`**  
  *Causa:* Bloqueo de firewall saliente en la sucursal o falta de enrutamiento hacia la IP central.
  *Solución:* Verificar conectividad con `nc -zv 172.30.20.61 10051` o validar reglas del FortiGate local.

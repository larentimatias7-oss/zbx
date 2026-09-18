# Guía Estándar: Creación y Alta Correcta de Hosts en Zabbix 7.0 LTS

- **Plataforma:** Zabbix Enterprise Monitoring Platform
- **Entorno:** Producción (`prod` - `https://zabbix.mlccnet.local`)
- **Público:** Administradores de Redes, Administradores de Servidores y Operadores NOC
- **Organización:** Milicic S.A.

---

## 1. Principio Fundamental: Alta Desacoplada de Acciones

En Milicic, **nunca se deben editar las reglas de alertas (*Actions*) para incluir un nuevo host**. 
El ruteo hacia Telegram y las guardias se gestiona automáticamente mediante:
1. La pertenencia al **Host Group** adecuado.
2. La asignación de los **Tags Operacionales Obligatorios** (`team`, `tier`, `component`, `scope`).
3. La configuración correcta de **Macros** y **Templates**.

Si un host se crea sin estos parámetros, el monitoreo recopilará datos pero las alertas no llegarán a los canales correspondientes.

---

## 2. Convención y Taxonomía de Nombres de Host

Todo host debe nombrarse siguiendo el estándar corporativo:

```text
[SEDE]-[TIPO/ROL][NUMERO_CORRELATIVO]
```

### Tabla de Prefijos de Sede:
* **`SRO`**: Sede Rosario (Oficinas centrales / Datacenter principal).
* **`SSJ`**: Sede San Juan.
* **`RMD`**: Proyecto / Faena Rawson / Mina / Campamento.
* **`OBR`**: Obradores y predios temporales.
* **`AZR`**: Cargas de trabajo en Microsoft Azure Cloud.

### Tabla de Roles y Tipos de Equipo:
* **`SW-CORE`**: Switch Core o de Distribución (ej. `SRO-SW-CORE01`).
* **`SW-ACC`**: Switch de Acceso / Borde (ej. `SRO-SW-ACC04`).
* **`FW`**: Firewall perimetral FortiGate (ej. `SRO-FW01`, `SSJ-FW01`).
* **`SRV-APP`**: Servidor de Aplicaciones (ej. `SRO-SRV-APP02`).
* **`SRV-DB`**: Servidor de Base de Datos SQL (ej. `SRO-SRV-DB01`).
* **`SRV-DC`**: Controlador de Dominio Active Directory (ej. `SRO-SRV-DC01`).
* **`HPV`**: Hipervisor físico (ej. `SSJ-HPV01`, `SRO-ESXI01`).
* **`UPS`**: Sistema de alimentación ininterrumpida (ej. `SRO-UPS-DC01`).

---

## 3. Matriz de Host Groups y Templates Oficiales

Al dar de alta el host (`Data collection -> Hosts -> Create host`), seleccione los grupos y templates certificados para Zabbix 7.0:

| Tipo de Dispositivo | Host Groups Obligatorios | Template Principal Recomendado | Protocolo / Interfaz |
| :--- | :--- | :--- | :--- |
| **Switch HP / Comware** | `switch`, `Network` | `HP Comware HH3C by SNMP` | SNMP v2c (Puerto 161) |
| **Switch Cisco / Genérico** | `switch`, `Network` | `Cisco IOS by SNMP` / `Generic by SNMP` | SNMP v2c (Puerto 161) |
| **Firewall FortiGate** | `FortiGate`, `FortiWorld` | `FortiOS by SNMP` o `FortiOS by HTTP` | SNMP v2c (Puerto 161) / HTTPS |
| **Servidor Windows** | `Windows_Server` | `Windows by Zabbix agent` | Zabbix Agent (Puerto 10050) |
| **Servidor Linux** | `Linux_Server` | `Linux by Zabbix agent` | Zabbix Agent (Puerto 10050) |
| **Hipervisor Hyper-V** | `Hypervisors`, `Windows_Server` | `Windows by Zabbix agent` + `Hyper-V` | Zabbix Agent (Puerto 10050) |
| **Hipervisor VMware ESXi** | `Hypervisors` | `VMware` / `VMware FQDN` | HTTPS (API vCenter/ESXi) |
| **Servidor SQL Server** | `Databases`, `Windows_Server` | `MSSQL by Zabbix agent 2` o `ODBC` | Agent 2 / ODBC |
| **Sistema UPS** | `UPS` | `APC Smart-UPS by SNMP` / `UPS by SNMP` | SNMP v2c (Puerto 161) |

---

## 4. Configuración de Interfaces

En la pestaña **Host**:
* **Zabbix Agent:**
  - Connect to: `IP` (Recomendado dentro de la LAN de gestión).
  - Port: `10050`.
* **SNMP:**
  - SNMP version: `SNMPv2`.
  - SNMP community: `{$SNMP_COMMUNITY}` (Macro global configurada en Zabbix).
  - Port: `161`.
  - Max repetition count: `10` (óptimo para switches Comware y FortiGate).

---

## 5. Matriz Obligatoria de Tags Operacionales (*Tag-Driven Routing*)

> [!IMPORTANT]
> **Es MANDATORIO completar la pestaña Tags al crear el host.**
> Las acciones de Zabbix utilizan estos tags para decidir si una alerta va a Redes, Plataforma o Preventivo.

| Tipo de Equipo | Tag `team` | Tag `tier` | Tag `component` | Tag `scope` (Opcional) | Alertas que Recibirá |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Switch Core / Distr.** | `redes` | `core` | `switch` | - | • P1 (High/Disaster)<br>• P2-Redes (Average persistent) |
| **Switch de Acceso** | `redes` | `access` | `switch` | `notice` | • P1 si hay caída total<br>• P3-Preventivo |
| **Firewall Perimetral** | `redes` | `perimeter` | `firewall` | - | • P1 (High/Disaster)<br>• P2-Redes (Average) |
| **Servidor Windows/Linux** | `plataforma` | `core` o `service` | `server` | `capacity` | • P1 (High/Disaster)<br>• P2-Plataforma (Average) |
| **Hipervisor (Host físico)** | `plataforma` | `virtualization` | `hypervisor` | - | • P1 (High/Disaster)<br>• P2-Plataforma (Average) |
| **Servidor SQL Server** | `dba` | `core` | `database` | `capacity` | • P1 (High/Disaster)<br>• P2-Plataforma (Average) |
| **Sistema UPS** | `plataforma` | `facilities` | `ups` | - | • P1 (Corte/Falla batería)<br>• P2-Plataforma (Average) |

---

## 6. Macros Críticas Específicas por Tipo de Equipo

En la pestaña **Macros -> Inherited and host macros**:

### 6.1. Switches HP Comware (Supresión de puertos de usuario)
Para evitar que el apagado de PCs al final de la jornada laboral dispare cientos de alertas de `Link down`:
* **Macro de silenciamiento global:**
  - Macro: `{$IFCONTROL}`
  - Value: `0`
* **Macro de habilitación de Uplinks y Enlaces Troncales:**
  Por cada puerto crítico, fibra óptica o agregación de enlaces (LACP), cree una macro contextual:
  - `{$IFCONTROL:"Bridge-Aggregation1"}` = `1`
  - `{$IFCONTROL:"GigabitEthernet1/0/49"}` = `1`
  - `{$IFCONTROL:"GigabitEthernet1/0/50"}` = `1`

### 6.2. Umbrales de Espacio en Disco en Servidores
Si un servidor requiere tolerancias especiales antes de emitir alerta:
* `{$VFS.FS.PUSED.MAX.WARN:"C:"}` = `85` (Porcentaje warning)
* `{$VFS.FS.PUSED.MAX.CRIT:"C:"}` = `92` (Porcentaje crítico P1)

---

## 7. Checklist de Verificación Post-Alta

Una vez creado el host, verifique en los siguientes 5 a 10 minutos:
1. **Ícono de Disponibilidad (`Availability`):**
   - El ícono `ZBX` o `SNMP` en la lista de hosts debe ponerse en **Verde**. Si está en rojo, revise conectividad, community SNMP o servicio del agente.
2. **Últimos Datos (`Monitoring -> Latest data`):**
   - Filtre por el nombre del host y verifique que ingresen métricas de CPU, memoria, ping e interfaces.
3. **Descubrimiento LLD (`Data collection -> Hosts -> Discovery`):**
   - Confirme que las reglas de descubrimiento de interfaces de red o sistemas de archivos hayan generado los items y triggers correspondientes.
4. **Verificación de Tags:**
   - Asegúrese de que el host tiene los tags `team`, `tier` y `component` visibles en su ficha.

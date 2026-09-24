# Plan de Acción Operativo: Habilitación de Tráfico HTTPS FortiGate hacia Storages HPE MSA y Tratamiento de Alerta P1

- **Identificador de Caso:** `MIL-PND-001`
- **Fecha de Detección:** 23 de Septiembre de 2026, 19:12:25 ART
- **Severidad Original:** `High` (P1 - Incidente Crítico)
- **Veredicto Técnico:** **FALSO POSITIVO DE HARDWARE (Bloqueo de Firewall Inter-VLAN)**
- **Plataformas Involucradas:** Fortinet FortiGate (`milicic-borde1`), Zabbix 7.0.22 LTS, Storages HPE MSA 2040 / 2060
- **Elaborado por:** Especialista en Infraestructura, Seguridad & Observabilidad (Antigravity SRE)

---

## 1. Resumen Ejecutivo del Incidente

A las **19:12:25 ART**, la plataforma Zabbix despachó una notificación de severidad **P1 (Crítica)** alertando sobre la caída de servicio en la cabina de almacenamiento `SRO-STO02 (HPE MSA 2060 Storage: Service is down or unavailable)`.

Tras una auditoría inmediata sobre la infraestructura, se confirmó de manera categórica que:
1. **La cabina física de almacenamiento y sus controladoras NO están caídas.** El equipo responde a nivel de red (ping ICMP) con **0% de pérdida de paquetes y 1.0 ms de latencia**.
2. **Los hipervisores VMware ESXi (172.30.70.131 y 172.30.70.132) operan con total normalidad.** Los datastores de producción están montados y activos sin registrar interrupciones de I/O ni máquinas virtuales afectadas.
3. **Causa Raíz Comprobada:** Los logs de tráfico del firewall perimetral (`Forward Traffic` en `milicic-borde1`) evidencian que el FortiGate descarta de manera sistemática los paquetes **TCP puerto 443 (HTTPS)** enviados desde Zabbix Server (`172.30.20.61`, VLAN 20) hacia las IPs de gestión de los Storages (`172.30.70.134` y `172.30.70.135`, VLAN 70) bajo la regla **`Implicit Deny`**.
4. Al no recibir respuesta en el socket HTTPS, la verificación periódica de Zabbix (`net.tcp.service["https", 172.30.70.135, 443]`) reporta valor `0`, activando la alarma de indisponibilidad.

---

## 2. Ficha Técnica de Objetos y Afectación

| Parámetro | Detalle Técnico |
| :--- | :--- |
| **Host Zabbix Afectado** | `SRO-STO02` (Host ID: `10727`, IP: `172.30.70.135`) |
| **Segundo Host Relacionado** | `SRO-STO01` (Host ID: `10706`, IP: `172.30.70.134`) |
| **Disparador Detonado** | Trigger ID `29355`: *HPE MSA 2060 Storage: Service is down or unavailable* |
| **Evento Generado** | Event ID `174422629` |
| **Métrica / Ítem Subyacente** | Item ID `60442`: `net.tcp.service["{$HPE.MSA.API.SCHEME}","{$HPE.MSA.API.HOST}","{$HPE.MSA.API.PORT}"]` |
| **Origen del Monitoreo** | Zabbix Server (`172.30.20.61`, VLAN 20 Monitoreo) |
| **Equipo Decisor (Firewall)** | FortiGate Border 1 (`milicic-borde1`, Gateway `172.30.70.1:9443`) |
| **Resultado en Firewall** | `Result: Deny` \| `Policy ID: Implicit Deny` \| `Service: HTTPS` |

---

## 3. Matriz de Evidencia Comprobada

| Vector de Prueba | Método / Comando | Resultado Obtenido | Veredicto |
| :--- | :--- | :---: | :--- |
| **Conectividad IP (Capa 3)** | `icmpping` desde Zabbix Server | `1 (1.06 ms rtt, 0% drop)` | **Operativo / OK** |
| **Almacenamiento VMware** | Telemetría ESXi y Datastores | Datastores montados, 0 caídas | **Operativo / OK** |
| **Socket TCP 443 (Capa 4/7)** | `net.tcp.service[https, 443]` | `0 (Falla de conexión)` | **Bloqueado** |
| **API HPE MSA** | `hpe.msa.get.data` (REST) | `Timeout was reached` | **Bloqueado** |
| **Log de Tráfico FortiOS** | `Forward Traffic` (Dest `172.30.70.135`) | `Deny por Implicit Deny` | **Bloqueo Confirmado por Firewall** |

---

## 4. Acciones Requeridas en Fortinet FortiGate

Para permitir que Zabbix supervise la telemetría interna de los storages (salud de discos, fuentes redundantes, ventiladores y controladoras) y habilitar el acceso administrativo seguro a los operadores, se debe implementar una política de seguridad en el FortiGate.

### Opción A: Configuración vía Interfaz Gráfica (FortiOS GUI)

1. **Crear Objetos de Dirección de los Storages (si no existen):**
   - Dirigirse a **Policy & Objects** $\rightarrow$ **Addresses**.
   - Clic en **Create New** $\rightarrow$ **Address**:
     * *Name:* `HPE-MSA-STORAGE-A` \| *IP/Netmask:* `172.30.70.134/32` \| *Interface:* `any`
     * *Name:* `HPE-MSA-STORAGE-B` \| *IP/Netmask:* `172.30.70.135/32` \| *Interface:* `any`
   - Clic en **Create New** $\rightarrow$ **Address Group**:
     * *Name:* `GRP-HPE-MSA-STORAGES`
     * *Members:* `HPE-MSA-STORAGE-A`, `HPE-MSA-STORAGE-B`

2. **Crear la Política de Firewall para Zabbix:**
   - Dirigirse a **Policy & Objects** $\rightarrow$ **Firewall Policy**.
   - Clic en **Create New**:
     * **Name:** `MON-Zabbix-to-MSA-Storages`
     * **Incoming Interface:** Interfaz correspondiente a la VLAN 20 (`servers-sede` o interfaz de monitoreo).
     * **Outgoing Interface:** Interfaz correspondiente a la VLAN 70 (Management Servidores).
     * **Source:** Objeto `Zabbix-Server` (`172.30.20.61/32`).
     * **Destination:** Grupo `GRP-HPE-MSA-STORAGES` (o IPs `172.30.70.134`, `172.30.70.135`).
     * **Schedule:** `always`.
     * **Service:** **`HTTPS`** (TCP 443), **`HTTP`** (TCP 80 opcional), **`PING`** (ICMP).
     * **Action:** **`ACCEPT`**.
     * **NAT:** **Deshabilitado** (el enrutamiento entre VLANs corporativas es directo).
     * **Log Allowed Traffic:** `All Sessions` (o `Security Events`).
   - Clic en **OK**. Ubicar la regla antes de cualquier regla de bloqueo explícito.

3. **(Opcional) Habilitar Acceso Administrativo para Clientes VPN:**
   - En la política existente de VPN SSL (`ssl.root` hacia servidores), agregar `HTTPS` en los servicios permitidos y el grupo `GRP-HPE-MSA-STORAGES` en los destinos permitidos para que el equipo de infraestructura pueda ingresar al portal web de las cabinas desde sus puestos remotos.

---

### Opción B: Configuración Rápida vía CLI de FortiOS

Conectarse por SSH o consola web al FortiGate `milicic-borde1` y ejecutar el siguiente bloque de configuración:

```fortios
config firewall address
    edit "HPE-MSA-STORAGE-A"
        set subnet 172.30.70.134 255.255.255.255
    next
    edit "HPE-MSA-STORAGE-B"
        set subnet 172.30.70.135 255.255.255.255
    next
end

config firewall addrgrp
    edit "GRP-HPE-MSA-STORAGES"
        set member "HPE-MSA-STORAGE-A" "HPE-MSA-STORAGE-B"
    next
end

config firewall policy
    edit 0
        set name "MON-Zabbix-to-MSA-Storages"
        set srcintf "servers-sede"
        set dstintf "servers-sede"
        set srcaddr "172.30.20.61"
        set dstaddr "GRP-HPE-MSA-STORAGES"
        set action accept
        set schedule "always"
        set service "HTTPS" "PING"
        set logtraffic all
    next
end
```

*(Nota: Verificar los nombres exactos de interfaces de entrada/salida para VLAN 20 y VLAN 70 en caso de no compartir el zone 'servers-sede').*

---

## 5. Gestión del Incidente en Zabbix (Falso Positivo)

### A. Reconocimiento Oficial (*Acknowledge*)
En Zabbix 7.0 LTS, un problema de severidad High/Disaster no debe silenciarse a ciegas borrando triggers, sino gestionarse según la gobernanza de auditoría:

1. Ingresar a la consola web de Zabbix:
   👉 URL directa del evento: `https://zabbix.mlccnet.local/tr_events.php?triggerid=29355&eventid=174422629`
2. En la sección inferior **Update problem** (Actualizar problema), completar:
   - **Message (Mensaje):**  
     `Falso positivo de hardware comprobado: cabina HPE MSA 2060 y datastores VMware ESXi funcionando al 100% (ping 1.0 ms). El tráfico HTTPS TCP 443 está siendo bloqueado por regla 'Implicit Deny' en FortiGate Border1. En proceso de aplicación de política de firewall.`
   - **Severity change (Cambiar severidad):** Opcionalmente degradar temporalmente a *Warning* o mantener *High*.
   - **Acknowledge:** Marcar la casilla **Acknowledge (Reconocer)**.
   - Clic en **Update**.

### B. Cierre Automático (*Auto-Recovery*)
El trigger `29355` tiene configurada la propiedad `manual_close: 0` (cierre manual deshabilitado por diseño de plantilla para garantizar que la alerta sólo se cierre cuando la métrica técnica real esté verdaderamente sana).

Por tanto:
- Apenas el administrador de redes aplique la regla en el FortiGate, Zabbix Server ejecutará el siguiente chequeo de `net.tcp.service`.
- La métrica cambiará inmediatamente de `0` a `1`.
- Zabbix marcará el incidente como **RESOLVED (Recuperado)** de forma 100% automática, enviando la notificación de normalización a los canales de Telegram correspondientes sin requerir intervención manual adicional.

---

## 6. Procedimiento de Verificación Posterior (*Post-Change*)

Una vez aplicada la política en FortiOS:

1. **En FortiOS (`Forward Traffic`):**  
   Refrescar el log filtrado por `Destination: 172.30.70.135`. Confirmar que los paquetes provenientes de `172.30.20.61` ahora exhiben **`Result: Accept`** y computan bytes transmitidos y recibidos.
2. **En Zabbix Server:**  
   Verificar que los ítems `Service ping` de `SRO-STO01` y `SRO-STO02` pasan a estado `1`, y que los ítems dependientes de la API REST (`hpe.msa.get.data`) salen del estado *Not Supported* y recolectan la información del chasis con normalidad.

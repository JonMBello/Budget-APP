# Cobertura del objetivo

Todos los requisitos expresos tienen historia y ticket del mismo número. Los detalles están en [features](README.md); las dependencias se explican en [GAPs](api-gaps.md). Esta tabla mide cobertura de planeación, no implementación terminada.

| Requisito del objetivo | HU-FE / TICKET-FE | Observación |
|---|---|---|
| Login y resto de páginas autenticadas | 02.1, 02.2, 01.2 | Validación también en servidor |
| Visualización dinámica y móvil sin spreadsheet | 01.3, 01.4, 08.1 | Tarjetas, listas, agenda y barras |
| Agregar ingresos y gastos en secciones separadas | 07.1, 07.4 | Fuentes y categorías independientes |
| Editar ingresos y gastos | 07.2, 07.5 | Preservar vínculos de deudas |
| Eliminar ingresos y gastos | 07.2, 07.5 | Confirmación y conservación de cobros recibidos |
| Restante mensual actualizado al mutar | 08.1, 08.4 | Proyectado y efectivo diferenciados |
| Historial mensual | 05.2, 05.4 | Cierre/reapertura y lectura por mes |
| Copiar ingresos al siguiente mes | 07.6 | GAP-02: fechas, selección e idempotencia |
| MSI automático y fin del ciclo | 06.2, 06.3 | GAP-01: persistir antes de avanzar |
| Suscripciones sin fecha fin | 06.1, 06.4 | Plantilla indefinida con pausa |
| Servicios sin fecha fin | 06.1 | Monto variable por factura |
| Categorizar servicios, suscripciones, MSI y normales | 07.1, 06.1, 08.2 | Enum real; otros recurrentes GAP-13 |
| Fecha de ingreso y egreso | 07.1, 07.4, 03.3 | Fecha civil y vencimiento separados |
| Varias tarjetas, corte y pago | 03.1–03.3, 08.3 | Preview de ciclo y agenda |
| Fuente nómina, depósito, deuda | 07.4, 07.3 | DEBT_COLLECTION automático vinculado |
| Ligar deuda MSI a persona y retirar ingreso al terminar deuda | 06.2, 04.4, 06.4 | GAP-06; conservar ingreso ya cobrado |
| Deuda total por persona y fecha máxima según tarjeta | 04.2, 08.3 | Próximo vencimiento y detalle por obligación; GAP-05 |
| Recurrentes totales y remanente exclusivo de nómina | 08.2 | GAP-13 para todos los tipos solicitados |
| Push/correo de servicios, tarjetas y créditos | 09.3–09.5, 08.3 | GAP-14; créditos distintos de MSI por aclarar GAP-15 |
| PWA iPad, iPhone y Mac | 09.1, 09.2 | Instalación y actualización verificadas por dispositivo |
| Porcentaje o cantidad asignada a persona en cualquier compra | 07.3, 06.1, 06.2 | Un split por compra/plantilla según contrato |
| Acarrear restante como ahorro editable | 05.3 | GAP-03; decisión proyectado/efectivo |
| Cancelar o terminar MSI antes de tiempo | 06.4, 06.5 | GAP-06; cancelar y pagar son acciones distintas |
| Barra superior iPad e inferior iPhone | 01.3 | Incluye ventanas divididas y safe areas |
| Paleta oscura verde, azul y rojo | 01.4 | Contraste y semántica sin depender solo de color |
| Replicar planeación docs/features de API | 01–09 | Misma estructura: objetivo, HU, tickets, verificación |
| Front React/Next, API Nest, MongoDB, Caddy y Swagger | 01.1, 01.2, 01.5 | Reutilizar API; no crear otra base desde frontend |
| /api y /app en budget.jonmb.com | 01.5, 09.1 | Interpretación de enlace inconsistente documentada |
| Agregar necesidades y aclarar ambigüedades | 02.3, 02.4, 05.4, 09.2 | Registro/perfil, cierre, offline, calidad y decisions.md |

La migración desde Google Sheets es contexto y posible ampliación, no importación solicitada con un archivo disponible. Se mantiene como pregunta explícita antes de estimar un importador.

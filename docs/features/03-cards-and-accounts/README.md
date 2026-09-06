# Feature 03: Cuentas, tarjetas y fechas de pago

## Objetivo

Asociar compras a métodos de pago y anticipar corte y vencimiento.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/03-cards-and-accounts).

## Integración

GET/POST /api/cards; GET/PATCH/DELETE /api/cards/:id; GET /api/cards/:id/preview-statement?date=YYYY-MM-DD.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-03.1: Catálogo de métodos de pago

> Como usuario de Budget-APP, quiero agregar y editar crédito, débito y efectivo, para identificar con qué pago.

Criterios de aceptación:

- [ ] Tarjetas visuales con nombre, tipo, color y últimos cuatro dígitos opcionales; nunca pedir número completo ni CVV.
- [ ] Crédito requiere corte y pago entre 1 y 31; otros tipos no muestran esos campos como obligatorios.
- [ ] Formularios de alta/edición con validaciones de DTO y acciones pendientes sin doble envío.

### HU-FE-03.2: Detalle y archivo de tarjetas

> Como usuario de Budget-APP, quiero consultar y desactivar mis métodos de pago, para mantener el historial ordenado.

Criterios de aceptación:

- [ ] DELETE desactiva; confirmar impacto y conservar referencia visual en gastos existentes.
- [ ] Mostrar archivadas con includeInactive=true y excluirlas de nuevas compras.
- [ ] Detalle agrupa movimientos registrados por vencimiento y estado; no se etiqueta como estado de cuenta real del banco.

### HU-FE-03.3: Simular fecha de compra

> Como usuario de Budget-APP, quiero consultar corte, pago y mes impactado, para planear cuándo hacer una compra.

Criterios de aceptación:

- [ ] Preview devuelve statementCutoffDate, paymentDueDate, impactBudgetYear/Month y daysUntilDue.
- [ ] Se actualiza al cambiar tarjeta o fecha; ignorar respuestas viejas y no guardar durante preview.
- [ ] Distinguir fecha de compra, vencimiento y periodo presupuestario; si destino no existe, ofrecer crearlo explícitamente.

## Tickets técnicos

### TICKET-FE-03.1: Catálogo de métodos de pago

Historia: HU-FE-03.1 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-02.1, FE-01.4. Dependencias de API: —.

Implementación:

- [ ] Implementar repositorio de tarjetas, listado y formulario reutilizable; incluir límite opcional sin inventar saldo bancario.
- [ ] Actualizar selector de tarjeta en gastos y recurrentes tras guardar.
- [ ] Verificar: Alta CREDIT sin corte falla; alta CASH válida; edición se refleja en selectores.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-03.2: Detalle y archivo de tarjetas

Historia: HU-FE-03.2 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-03.1, FE-07.1. Dependencias de API: —.

Implementación:

- [ ] Crear detalle con listas y totales derivados de movimientos disponibles; no usar límite menos gastos como saldo bancario.
- [ ] Mostrar nombre de tarjeta archivada y tratar referencia no encontrada.
- [ ] Verificar: Archivar una tarjeta con gastos no elimina movimientos ni permite nuevas asociaciones desde la UI.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-03.3: Simular fecha de compra

Historia: HU-FE-03.3 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-03.1, FE-05.1. Dependencias de API: GAP-08.

Implementación:

- [ ] Crear panel de simulación e integrarlo al formulario de gasto; endpoint como fuente de ciclos.
- [ ] Usar fecha civil YYYY-MM-DD sin desplazamiento por zona horaria; no reasignar meses silenciosamente.
- [ ] Verificar: Corte 15/pago 5: compra 10/09/2026 impacta octubre; 16/09 impacta noviembre; verificar febrero y diciembre.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

# Feature 08: Balance, nómina y flujo de caja

## Objetivo

Entender presupuesto proyectado, efectivo registrado y margen de nómina.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/08-metrics-and-cashflow).

## Integración

GET /api/budgets/current/summary y /api/budgets/:year/:month/summary.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-08.1: Inicio con balance actualizado

> Como usuario de Budget-APP, quiero ver mi restante al agregar, editar o borrar, para decidir mis siguientes gastos.

Criterios de aceptación:

- [ ] Tarjetas diferenciadas Balance proyectado netBalance y Efectivo según registros cashInPocketBalance.
- [ ] Mostrar carriedSavings, ingresos esperados/recibidos y gastos totales/pagados; valores negativos no se ocultan.
- [ ] Tras éxito de una mutación reconsultar summary del periodo; indicar Actualizando y conservar último dato con aviso si falla.

### HU-FE-08.2: Remanente de nómina

> Como usuario de Budget-APP, quiero ver sueldo menos servicios, suscripciones y MSI, para planear mis compras personales.

Criterios de aceptación:

- [ ] Mostrar payrollSurplus con nómina, servicios, suscripciones, MSI, fijos, remanente inicial, compras regulares y restante.
- [ ] Explicar que la API usa toda nómina prevista, no solo cobrada; no etiquetar remanente como efectivo disponible garantizado.
- [ ] Aclarar categorías incluidas; FOOD y otras no reducen remainingDiscretionaryPayrollSurplus actual.

### HU-FE-08.3: Agenda de pagos y cobros

> Como usuario de Budget-APP, quiero ver próximos compromisos y deudores, para priorizar mis pagos.

Criterios de aceptación:

- [ ] Agenda por fecha con gastos pendientes y cobros; Sin fecha y Vencidos separados.
- [ ] receivables.pendingDebtCollections es del mes; total global por persona procede de debts y no suma cuotas futuras dos veces.
- [ ] Filtros por tarjeta/persona y enlaces a detalle; no afirmar saldo bancario ni mínimo a pagar.

### HU-FE-08.4: Consistencia al cambiar de dispositivo

> Como usuario de Budget-APP, quiero ver datos recientes sin confundir meses o cuentas, para confiar en mis cifras.

Criterios de aceptación:

- [ ] Real time significa actualización tras operación propia y al recuperar foco/conexión; no hay WebSocket/SSE verificado.
- [ ] Si cambia el periodo durante una consulta, la respuesta anterior no sustituye al nuevo mes.
- [ ] Datos obsoletos, API caída y sesión vencida tienen mensajes diferentes; no confirmar guardado por optimismo.

## Tickets técnicos

### TICKET-FE-08.1: Inicio con balance actualizado

Historia: HU-FE-08.1 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-05.1, FE-01.2. Dependencias de API: —.

Implementación:

- [ ] Implementar dashboard con summary real como fuente; no sumar manualmente totales del periodo además de movimientos.
- [ ] Invalidar consultas por usuario/periodo, cancelar respuestas antiguas y revalidar al recuperar foco/conexión.
- [ ] Verificar: Ahorro 1000, ingreso total 5000/recibido 2000, gasto total 3000/pagado 500: proyectado 3000, efectivo 2500.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-08.2: Remanente de nómina

Historia: HU-FE-08.2 · Prioridad: P0 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-08.1. Dependencias de API: GAP-13.

Implementación:

- [ ] Crear tarjeta y barras de desglose con texto numérico; usar campos anidados reales.
- [ ] Resolver GAP-13 para incluir todos los recurrentes y compras personales si se elige ampliar la fórmula.
- [ ] Verificar: Nómina 25000, servicios 1500, suscripciones 600, MSI 4000, regulares 3000: fijos 6100, inicial 18900, restante 15900.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-08.3: Agenda de pagos y cobros

Historia: HU-FE-08.3 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-08.1, FE-04.2, FE-07.2. Dependencias de API: GAP-05.

Implementación:

- [ ] Combinar summary, gastos e ingresos registrados; obtener periodos necesarios explícitamente para agenda fuera del mes.
- [ ] Reconsultar tras pagar/cobrar y mostrar estado de datos incompletos.
- [ ] Verificar: Dos tarjetas con fechas distintas ordenan pagos; pagar gasto retira pendiente sin retirar cobro del tercero.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-08.4: Consistencia al cambiar de dispositivo

Historia: HU-FE-08.4 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-08.1, FE-07.5. Dependencias de API: —.

Implementación:

- [ ] Centralizar invalidaciones de integration.md; caché privada en memoria y coordinación entre pestañas sin datos financieros en mensajes.
- [ ] Medir una reconsulta de resumen por lote de mutación, evitar tormentas de peticiones.
- [ ] Verificar: Guardar en pestaña A, enfocar B actualiza; cambiar usuario vacía caché; respuesta tardía no contamina otro mes.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

# Feature 04: Personas y cuentas por cobrar

## Objetivo

Consultar deuda global, vencimientos y cobros por persona.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/04-people-and-debts).

## Integración

CRUD /api/people; GET /api/people/:id/debts; POST /api/people/:id/settle.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-04.1: Directorio de personas

> Como usuario de Budget-APP, quiero crear, editar y archivar personas, para asignar mis gastos compartidos.

Criterios de aceptación:

- [ ] Nombre requerido; contacto y notas opcionales conforme al DTO; lista con búsqueda local.
- [ ] Archivar no perdona deudas ni elimina historia; activos para nuevas asignaciones e inactivos visibles bajo filtro.
- [ ] Sin personas, el selector permite abrir alta y regresar al gasto conservando borrador en memoria.

### HU-FE-04.2: Resumen global e inmediato

> Como usuario de Budget-APP, quiero ver todo lo que una persona me debe y cuándo vence, para organizar los cobros.

Criterios de aceptación:

- [ ] Mostrar totalDebt, immediateDueAmount y nextPaymentDueDate por separado.
- [ ] Desglosar MSI, servicios/suscripciones y puntuales con cuotas y conceptos; null significa Sin fecha disponible.
- [ ] No sumar totales de plantilla y gastos nuevamente en cliente; no llamar saldo completo a una respuesta incompleta.

### HU-FE-04.3: Registrar cobro específico

> Como usuario de Budget-APP, quiero marcar una deuda cobrada, para reflejar el ingreso recibido sin duplicarlo.

Criterios de aceptación:

- [ ] Confirmar persona, concepto e importe completo; enviar expenseId de esa persona.
- [ ] Al cobrar, deuda deja de estar pendiente y el ingreso vinculado se conserva recibido.
- [ ] Pago al banco isPaid y cobro al tercero son acciones independientes.

### HU-FE-04.4: Abonos, perdón y fin de deuda recurrente

> Como usuario de Budget-APP, quiero registrar un abono o terminar una deuda futura, para ajustar lo que la persona debe realmente.

Criterios de aceptación:

- [ ] Abono menor conserva el saldo restante y registra historial del pago cuando exista contrato persistente.
- [ ] Perdonar deuda y cobrar son acciones distintas: perdonar quita ingreso pendiente, cobrar conserva ingreso recibido.
- [ ] Quitar participación futura de una persona en MSI no cancela mi obligación con la tarjeta; históricos cobrados se preservan.

## Tickets técnicos

### TICKET-FE-04.1: Directorio de personas

Historia: HU-FE-04.1 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-02.1, FE-01.4. Dependencias de API: —.

Implementación:

- [ ] Implementar listado, formulario y detalle básico; includeInactive en consulta.
- [ ] Invalidar nombres en deudas y selectores; confirmar archivo.
- [ ] Verificar: Archivar persona con deuda conserva su consulta y evita selección para nuevo gasto.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-04.2: Resumen global e inmediato

Historia: HU-FE-04.2 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-04.1, FE-07.3. Dependencias de API: GAP-05.

Implementación:

- [ ] Adaptar DebtSummaryResponseDto a tarjetas, acordeones y agenda; manejar nombres genéricos actuales.
- [ ] Cerrar GAP-05 antes de habilitar el saldo global como confiable en producción.
- [ ] Verificar: Persona con MSI y cuota ya instanciada se cuenta una vez; dos tarjetas muestran vencimiento próximo y fechas por concepto.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-04.3: Registrar cobro específico

Historia: HU-FE-04.3 · Prioridad: P0 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-04.2, FE-07.3. Dependencias de API: GAP-04.

Implementación:

- [ ] Implementar settle de gasto completo; reconsultar gasto, ingresos, resumen y deudas tras éxito.
- [ ] No usar PATCH de ingresos vinculados para liquidar; no ofrecer importe parcial con el comportamiento actual.
- [ ] Verificar: Cobrar gasto compartido actualiza ingreso existente sin crear otro y no marca pagada la tarjeta.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-04.4: Abonos, perdón y fin de deuda recurrente

Historia: HU-FE-04.4 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-04.3, FE-06.4. Dependencias de API: GAP-04, GAP-06.

Implementación:

- [ ] Diseñar estados y confirmación de alcance actual/futuro; implementar solo tras GAP-04/GAP-06.
- [ ] Crear adaptadores y pruebas de contrato cuando API defina abonos y desvinculación; no inventar endpoints existentes.
- [ ] Verificar: Deuda 1000, abono 300 deja 700; perdonar 700 elimina solo pendiente; servicio siguiente ya no genera cobro.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

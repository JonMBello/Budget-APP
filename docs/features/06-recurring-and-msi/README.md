# Feature 06: Servicios, suscripciones y MSI

## Objetivo

Administrar compromisos mensuales indefinidos y planes con finalización.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/06-recurring-and-msi).

## Integración

CRUD /api/recurring; POST /instantiate; POST /:id/advance; PATCH /:id/cancel.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-06.1: Servicios y suscripciones

> Como usuario de Budget-APP, quiero crear y editar cargos sin fecha final, para evitar capturarlos cada mes.

Criterios de aceptación:

- [ ] Formularios SERVICE, SUBSCRIPTION y OTHER_RECURRING con monto, fecha de inicio, tarjeta y split opcional.
- [ ] Lista por tipo, activos/pausados/completados; edición de plantilla afecta futuro y edición de factura afecta solo el mes.
- [ ] Servicios variables permiten corregir gasto del periodo sin cambiar plantilla; no prometer frecuencia bimestral existente.

### HU-FE-06.2: Registrar y seguir MSI

> Como usuario de Budget-APP, quiero capturar compra total, plazo y cuota actual, para ver el progreso hasta terminar.

Criterios de aceptación:

- [ ] Plazo entero >=2 y cuota inicial entre 1 y plazo; total y mensualidad coherentes y redondeo visible.
- [ ] Mostrar cuota a generar frente a cuotas pagadas: contador de API no prueba pago al banco.
- [ ] Plan completo deja de generar cargos futuros y permanece consultable en historial.

### HU-FE-06.3: Generación mensual automática

> Como usuario de Budget-APP, quiero tener mis recurrentes en el siguiente mes, para iniciar con mis compromisos preparados.

Criterios de aceptación:

- [ ] Apertura genera gastos y cobros vinculados persistidos una sola vez por plantilla/periodo.
- [ ] Fallo o doble pulsación no avanza cuotas sin gasto; reabrir o recargar no vuelve a instanciar.
- [ ] Solo se incluyen plantillas vigentes; cuota final aparece una vez y no hay cuota posterior.

### HU-FE-06.4: Pausar y cancelar recurrencias

> Como usuario de Budget-APP, quiero detener cobros futuros, para reflejar servicios cancelados o compras devueltas.

Criterios de aceptación:

- [ ] Confirmación muestra plan y alcance; pausa con PATCH isActive=false y cancelación con PATCH cancel según intención.
- [ ] Históricos pagados se conservan; futuros pendientes de la persona se reconcilian con política definida.
- [ ] Reactivar servicio no genera meses omitidos automáticamente; no reactivar MSI completado sin contrato explícito.

### HU-FE-06.5: Adelantar o liquidar MSI

> Como usuario de Budget-APP, quiero terminar un plan antes de tiempo, para reflejar mi pago anticipado.

Criterios de aceptación:

- [ ] Elegir N cuotas o saldo restante con installmentsCount o payAll; mostrar importe y efecto en deuda de terceros.
- [ ] Pago anticipado registra movimiento y cierra correctamente futuras cuotas sin borrar historia.
- [ ] No mostrar Liquidado financieramente solo porque currentInstallment avanzó.

## Tickets técnicos

### TICKET-FE-06.1: Servicios y suscripciones

Historia: HU-FE-06.1 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-03.1, FE-04.1, FE-07.3. Dependencias de API: GAP-01, GAP-13.

Implementación:

- [ ] Implementar listado/formularios y PATCH plantilla; reutilizar tarjeta/persona y split.
- [ ] Resolver fecha de cargo/vencimiento y mapeo OTHER_RECURRING con GAP-01/GAP-13.
- [ ] Verificar: Internet 650 aparece como plantilla; factura de un mes a 700 no altera siguientes al editar solo el gasto.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-06.2: Registrar y seguir MSI

Historia: HU-FE-06.2 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-06.1. Dependencias de API: GAP-01.

Implementación:

- [ ] Crear formulario MSI y tarjeta de progreso; category MSI, totalAmount, totalInstallments, currentInstallment, startDate.
- [ ] Definir ajuste de centavos en cuota final con GAP-01 y no permitir editar libremente contador tras generar movimientos.
- [ ] Verificar: 18000 a 12 genera 1500 por cuota; 1000 a 3 conserva total exacto; entrada cuota 13/12 rechazada.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-06.3: Generación mensual automática

Historia: HU-FE-06.3 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-05.1, FE-06.2, FE-07.1. Dependencias de API: GAP-01.

Implementación:

- [ ] Integrar orquestación del asistente con contrato persistente e idempotente GAP-01.
- [ ] Mostrar conteo y montos realmente guardados; no convertir items de instantiate en gastos desde navegador con múltiples POST no atómicos.
- [ ] Verificar: Abrir dos meses, repetir solicitud y simular interrupción; mismo conjunto persistido y avance único.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-06.4: Pausar y cancelar recurrencias

Historia: HU-FE-06.4 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-06.3. Dependencias de API: GAP-06.

Implementación:

- [ ] Implementar acciones y filtros; cancelar no equivale a registrar devolución o pago.
- [ ] Actualizar plantilla, periodos, deudas e ingresos después de reconciliación del backend.
- [ ] Verificar: Cancelar suscripción compartida impide nuevos cargos; lo recibido anteriormente permanece.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-06.5: Adelantar o liquidar MSI

Historia: HU-FE-06.5 · Prioridad: P1 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-06.3, FE-04.3. Dependencias de API: GAP-06.

Implementación:

- [ ] Integrar POST advance después de GAP-06; confirmar pago, fecha y efecto contable con contrato final.
- [ ] Reconsultar detalle y resumen; no reintentar avance ante respuesta perdida.
- [ ] Verificar: Plan de 6 cuotas, adelantar 2 y liquidar saldo deja importe coherente y ningún cargo futuro duplicado.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

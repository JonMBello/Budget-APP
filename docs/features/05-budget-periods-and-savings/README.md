# Feature 05: Periodos mensuales, historial y ahorro

## Objetivo

Organizar el mes, conservar historial y trasladar remanentes editables.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/05-budget-periods-and-savings).

## Integración

GET /api/budgets, /current, /:year/:month; POST /initialize; PATCH /:year/:month, /savings, /status, /income.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-05.1: Elegir e inicializar un mes

> Como usuario de Budget-APP, quiero abrir mi presupuesto mensual, para registrar datos en el periodo correcto.

Criterios de aceptación:

- [ ] Selector año/mes y acceso a actual; 404 inicial presenta Crear primer mes.
- [ ] Confirmar año y mes explícitos; 409 reutiliza el periodo existente y no repite tareas de inicialización.
- [ ] Mes mostrado es el devuelto, aun si current devuelve el más reciente de otro mes o cerrado.

### HU-FE-05.2: Historial mensual

> Como usuario de Budget-APP, quiero consultar meses anteriores, para revisar mis ingresos y gastos.

Criterios de aceptación:

- [ ] Lista cronológica inversa en tarjetas con estado y resumen; abrir conserva mes en todas las secciones.
- [ ] Vacío de mes no existente no equivale a presupuesto de cero; errores de resumen no se convierten a cero.
- [ ] Comparar dos meses con tarjetas y barras usando summary de cada uno, sin sumar totales persistidos desactualizados.

### HU-FE-05.3: Ahorro acarreado editable

> Como usuario de Budget-APP, quiero trasladar mi restante al mes siguiente y editarlo, para dar continuidad al presupuesto.

Criterios de aceptación:

- [ ] Presentar ahorro anterior y monto inicial antes de abrir; saldo negativo se muestra como déficit, sin truncarlo.
- [ ] PATCH savings edita carriedSavings y actualiza resumen; notas disponibles para explicar ajuste.
- [ ] Ajustar un mes anterior no reescribe automáticamente el ahorro de meses ya abiertos.

### HU-FE-05.4: Cerrar y reabrir un periodo

> Como usuario de Budget-APP, quiero cerrar el mes y reabrirlo deliberadamente, para evitar cambios accidentales en el historial.

Criterios de aceptación:

- [ ] CLOSED muestra vistas de lectura y desactiva altas, ediciones, borrados, copias y liquidaciones que afecten ese mes.
- [ ] Reabrir requiere confirmación explícita; API debe hacer cumplir cierre también en escrituras directas.
- [ ] El cierre informa pendientes de pago/cobro y no convierte proyecciones a efectivo recibido.

## Tickets técnicos

### TICKET-FE-05.1: Elegir e inicializar un mes

Historia: HU-FE-05.1 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-02.1. Dependencias de API: —.

Implementación:

- [ ] Crear contexto de periodo en URL y consultas por periodId; POST initialize con año y mes completos.
- [ ] Mostrar pasos separados de apertura, copia opcional e instanciación; estados de error parcial y recuperación.
- [ ] Verificar: Primer uso, diciembre a enero, mes omitido y dos intentos de abrir el mismo mes.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-05.2: Historial mensual

Historia: HU-FE-05.2 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-05.1, FE-08.1. Dependencias de API: GAP-03.

Implementación:

- [ ] Implementar historial, detalle y comparación básica; cargar resúmenes visibles sin solicitudes ilimitadas.
- [ ] No recalcular el pasado a partir de plantillas actuales.
- [ ] Verificar: Dos meses con importes distintos mantienen resultados al navegar y regresar; probar resumen fallido.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-05.3: Ahorro acarreado editable

Historia: HU-FE-05.3 · Prioridad: P0 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-05.1, FE-08.1. Dependencias de API: GAP-03.

Implementación:

- [ ] Integrar ahorro en asistente y ajuste del mes; summary es referencia de previsualización.
- [ ] Resolver sincronización del servidor GAP-03; no ofrecer edición manual de totalIncome/totalExpenses en paralelo a movimientos.
- [ ] Verificar: Ingreso 15000, gasto 10000 arrastra 5000; ajuste a 4000 persiste; probar mes previo ausente y saldo -500.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-05.4: Cerrar y reabrir un periodo

Historia: HU-FE-05.4 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-05.1, FE-07.2. Dependencias de API: GAP-07.

Implementación:

- [ ] Conectar PATCH status y bloqueo transversal; revalidar estado justo antes de mutar en BFF.
- [ ] Integrar GAP-07 para garantías del servidor y errores de conflicto por estado cambiado en otro dispositivo.
- [ ] Verificar: Cerrar con pestaña de edición abierta rechaza guardar; reabrir permite edición; verificar vía API directa.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

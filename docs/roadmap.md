# Orden de implementación

Las nueve carpetas replican la API; el orden de ejecución del frontend sigue dependencias de experiencia e integración. Todos los tickets comienzan pendientes. P0 es crítico para su flujo y P1 completa producto; P1 no significa descartado.

## Etapas

| Etapa | Tickets | Resultado y puerta de salida |
|---|---|---|
| A. Base y acceso | FE-01.1–01.4, FE-02.1–02.4 | App adaptable, BFF, sesión, perfil; cero exposición de credenciales y aislamiento de cuentas |
| B. Catálogos y mes | FE-03.1, FE-04.1, FE-05.1 | Primer presupuesto con tarjetas/personas; API valida pertenencia (GAP-07) |
| C. Movimientos y balance | FE-07.1–07.5, FE-08.1/08.2/08.4, FE-03.2/03.3 | CRUD, split, dashboard y simulador; cerrar GAP-03/08/09 y decisiones de GAP-10/13 aplicables |
| D. Historia y cobros | FE-04.2/04.3, FE-05.2–05.4, FE-07.6, FE-08.3 | Historial, ahorro, cierre, copia y cobros; GAP-02/04/05/07 resueltos para cada flujo |
| E. Automatismos | FE-06.1–06.5, FE-04.4 | Recurrentes, MSI, cancelación y anticipos; GAP-01/06 resueltos antes de integración final |
| F. PWA y operación | FE-09.1–09.5, FE-01.5 | Instalable, avisos y despliegue revisado; GAP-12/14 y alcance de créditos GAP-15 resueltos |

Dentro de cada etapa, respetar `frontend_dependencies` de [backlog.json](backlog.json). Por ejemplo FE-08.1 puede implementarse antes de FE-07.2 para habilitar su verificación; FE-03.3 depende de un mes creado. El MVP temprano de captura manual no se presenta como el cumplimiento del objetivo completo.

## Dependencias críticas del backend

1. Integridad, pertenencia y cierres: GAP-07/GAP-09.
2. Ahorro coherente con movimientos: GAP-03.
3. Copia y materialización idempotentes: GAP-02/GAP-01.
4. Deudas, cobros, cancelaciones y anticipos: GAP-04/GAP-05/GAP-06.
5. Avisos de vencimiento: GAP-14; producto define GAP-12/GAP-15.

Los GAP se pueden resolver en Budget-API mientras se diseñan componentes y se desarrollan adaptadores con fixtures. No sustituir una garantía faltante de servidor por ocultar un botón. Comparar nuevamente el commit de API y contratos antes de integrar; verificar si el backend ya resolvió el GAP para no duplicar trabajo.

## Gestión y definición de listo

- Cada ticket refiere una HU, criterios, dependencias, alcance técnico, prueba y estimación en puntos relativos.
- Un ticket está listo para implementación integrada cuando sus contratos, decisiones contables y dependencias están definidos; los bloqueados pueden avanzar solo en las partes independientes.
- No se crearon issues en GitHub. `backlog.json` permite importarlos después, conservando IDs y relaciones; no representa trabajo realizado ni un cronograma fechado.
- No se despliega una función financiera con fixtures, datos incompletos tratados como cero o cálculos que contradicen summary. El frontend puede mostrar indisponibilidad explícita mientras la API se corrige.

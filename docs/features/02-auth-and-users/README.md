# Feature 02: Autenticación y perfil

## Objetivo

Proteger todas las páginas financieras y mantener sesiones utilizables.

Estado: planeada. Los checklists describen trabajo futuro; no certifican implementación.

Referencia API: [feature equivalente](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features/02-auth-and-users).

## Integración

POST /api/auth/login, /register, /refresh; GET/PATCH /api/users/me.

Aplican [contratos](../../integration.md), [decisiones](../../decisions.md) y [criterios globales de calidad](../../quality.md). Las dependencias GAP remiten al [registro de diferencias](../../api-gaps.md).

## Historias de usuario

### HU-FE-02.1: Inicio de sesión y protección de rutas

> Como usuario de Budget-APP, quiero iniciar sesión con email y contraseña, para acceder únicamente a mi información.

Criterios de aceptación:

- [ ] Validar campos, permitir gestores de contraseñas y mostrar error discreto sin revelar cuentas.
- [ ] Sin sesión, páginas y handlers financieros rechazan acceso; volver a la ruta solicitada solo si es interna válida.
- [ ] Sesión en servidor con identificador opaco en cookie HttpOnly, Secure, SameSite y Path=/app; tokens permanecen en servidor.

### HU-FE-02.2: Renovación y cierre de sesión

> Como usuario de Budget-APP, quiero mantener la sesión y poder cerrarla, para trabajar sin interrupciones y salir en dispositivos compartidos.

Criterios de aceptación:

- [ ] Renovar una vez ante expiración, con bloqueo por sesión para peticiones concurrentes; refresh fallido lleva a login sin bucle.
- [ ] Cerrar sesión borra sesión de servidor, cookie y datos privados del cliente; botón Atrás no revela datos.
- [ ] Explicar reautenticación cuando otro dispositivo invalide el refresh; no prometer sesiones independientes con el contrato actual.

### HU-FE-02.3: Registro con invitación

> Como usuario de Budget-APP, quiero crear mi cuenta cuando el registro esté habilitado, para tener mi propio espacio.

Criterios de aceptación:

- [ ] Formulario nombre, email, contraseña, moneda e inviteCode; mínimo de contraseña según DTO.
- [ ] Registro deshabilitado e invitación inválida muestran mensajes adecuados; no exponer inviteCode configurado.
- [ ] La disponibilidad visual es configuración del frontend, la API decide 403; registro exitoso inicia sesión.

### HU-FE-02.4: Perfil y moneda

> Como usuario de Budget-APP, quiero editar mi nombre y consultar mi moneda, para personalizar el presupuesto.

Criterios de aceptación:

- [ ] GET/PATCH de perfil; email de solo lectura y nombre mínimo de dos caracteres.
- [ ] MXN inicial propuesto; cambiar la etiqueta de moneda no convierte importes históricos.
- [ ] Mientras no exista política multimoneda, bloquear cambio con movimientos existentes y plantillas en divisa distinta.

## Tickets técnicos

### TICKET-FE-02.1: Inicio de sesión y protección de rutas

Historia: HU-FE-02.1 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-01.2. Dependencias de API: —.

Implementación:

- [ ] Crear login y almacén persistente de sesiones con TTL; middleware/proxy de navegación y validación en cada handler.
- [ ] Implementar POST local de sesión; limpiar caché del cliente al cambiar de identidad; rate limit de login en capa de servidor.
- [ ] Verificar: Abrir detalle sin sesión, manipular returnTo y alternar dos cuentas sin observar datos cruzados.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-02.2: Renovación y cierre de sesión

Historia: HU-FE-02.2 · Prioridad: P0 · Estimación inicial: 5 puntos · Estado: pendiente.

Dependencias de frontend: FE-02.1. Dependencias de API: GAP-11, GAP-12.

Implementación:

- [ ] Implementar coordinador de refresh por sesión y logout local; distinguir fallo de configuración de API key de expiración.
- [ ] Desuscribir push del dispositivo antes del logout cuando sea posible; gestionar revocación pendiente según GAP-12.
- [ ] Verificar: Cinco consultas simultáneas expiran: un refresh; refresh revocado termina sesión; logout offline no restaura datos.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-02.3: Registro con invitación

Historia: HU-FE-02.3 · Prioridad: P1 · Estimación inicial: 3 puntos · Estado: pendiente.

Dependencias de frontend: FE-02.1. Dependencias de API: —.

Implementación:

- [ ] Crear /app/register pública solo si flag visual activo; adaptar respuesta AuthResponseDto.
- [ ] Tratar 409 de email y 400 de validación; ninguna llamada automática crea cuentas.
- [ ] Verificar: Probar flag apagado, invitación inválida, email duplicado y alta autorizada con datos de prueba.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

### TICKET-FE-02.4: Perfil y moneda

Historia: HU-FE-02.4 · Prioridad: P1 · Estimación inicial: 2 puntos · Estado: pendiente.

Dependencias de frontend: FE-02.1. Dependencias de API: GAP-10.

Implementación:

- [ ] Crear Ajustes > Perfil; invalidar perfil al guardar y formato es-MX.
- [ ] No incluir recuperación de contraseña como función disponible: no hay endpoint.
- [ ] Verificar: Editar nombre, recargar y comprobar persistencia; no convertir MXN a USD multiplicando solo en pantalla.
- [ ] Cumplir todos los criterios de la historia y la definición de terminado; adjuntar evidencia al PR.

## Verificación de la feature

Ejecutar los escenarios de cada ticket con fixtures sintéticos, casos de error y dispositivos de la matriz de calidad. Un ticket con GAP puede avanzar en diseño y pruebas con fixtures, pero no se considera integrado hasta cerrar su dependencia y ejecutar el contrato contra staging.

[Volver al índice](../../README.md)

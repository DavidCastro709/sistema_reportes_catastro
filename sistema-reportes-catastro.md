# Sistema de Gestión de Reportes — Catastro

Solución inicial organizada en `backend/` (Express, Prisma y PostgreSQL) y `mobile/` (Expo / React Native). El HTML existente de la carpeta original corresponde a una agencia automotriz y no contiene la plantilla institucional; no se modificó.

## Arquitectura

```text
sistema-reportes-catastro/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config/prisma.js
│   │   ├── controllers/ (auth, reports, users, audit)
│   │   ├── middlewares/ (auth, role, error)
│   │   ├── routes/ (auth, reports, users, audit)
│   │   ├── services/ (audit, report, excel, pdf)
│   │   ├── scripts/bootstrap-admin.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── mobile/
    ├── src/api/client.js
    ├── src/navigation/ (RootNavigator.jsx, AdminMenuScreen.jsx)
    ├── src/screens/LoginScreen.jsx
    ├── src/screens/admin/ (CreateReport, UserManagement, AuditLogs)
    ├── src/screens/user/ViewReportsScreen.jsx
    └── App.js
```

## Autorización y privacidad

- Sin registro público: las cuentas se crean mediante un proceso administrativo fuera de la API.
- Contraseñas con bcrypt (coste 12); JWT HS256 con emisor, audiencia y expiración. El backend consulta usuario/estado/rol actual en cada petición; no confía en el rol incluido en el token.
- Las cuentas inactivas quedan bloqueadas inmediatamente. Tokens en Expo SecureStore.
- Usuarios: solo reportes publicados, visibles para todos o asignados al propio usuario. Administradores: todos los reportes.
- Endpoints admin: crear reportes, desactivar otras cuentas y consultar auditoría. No se permite auto-desactivación.
- Paginación limitada a 100 elementos; índices, claves foráneas, unicidad y creación de reporte/auditoría en una transacción.

## API

- `POST /api/auth/login`; `GET /api/auth/me`
- `GET /api/reports?page=1&limit=20`
- `GET /api/reports/:reportId`
- `GET /api/reports/:reportId/export/pdf` y `/excel`
- `POST /api/reports` (ADMIN)
- `PATCH /api/users/:userId/deactivate` (ADMIN)
- `GET /api/audit-logs?page=1&limit=25` (ADMIN)

Enviar `Authorization: Bearer <token>`. Los formatos distintos de PDF y XLSX no existen.

## Puesta en marcha

1. Instalar Node.js LTS y PostgreSQL; crear base de datos `catastro`.
2. En `backend`, copiar `.env.example` a `.env`, establecer conexión PostgreSQL y un `JWT_SECRET` aleatorio de al menos 32 caracteres.
3. Ejecutar `npm install`, `npm run prisma:generate`, `npm run db:migrate`.
4. Crear el primer administrador localmente con `npm run admin:bootstrap -- correo@institucion.gob.mx "Nombre Apellido" "contraseña-larga"`. El comando no inicia un endpoint de alta; evitar exponer la contraseña en historiales de terminal en producción y usar un procedimiento de secretos aprobado.
5. Iniciar API con `npm run dev`.
6. En `mobile`, copiar `.env.example` a `.env`, configurar `EXPO_PUBLIC_API_URL` y ejecutar `npm install` y `npm start`.

## Producción y aspectos pendientes

- Servir exclusivamente detrás de HTTPS (proxy confiable), restringir CORS a orígenes institucionales y almacenar secretos en un gestor; la app debe usar HTTPS. No habilitar HTTP de producción.
- El código no sustituye pruebas de seguridad, pruebas de integración, revisión legal ni una política de retención/backup. Agregar pruebas antes de operar.
- No se proporcionó el archivo gráfico ni la plantilla real de Catastro. PDF y Excel llevan encabezado institucional, parámetros, totales, fecha/hora y folio, pero para fidelidad exacta faltan los escudos oficiales, dimensiones, textos, colores y reglas de foliación aprobadas.
- El formulario móvil es un andamiaje funcional; los registros se envían en JSON y deben añadirse captura/importación de filas más filtros del dominio según el formato Catastro final.

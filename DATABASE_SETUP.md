# Configuración de Base de Datos - Wishlist para Parejas

## Base de Datos Recomendada

Este proyecto utiliza **Supabase** (PostgreSQL) como base de datos. Supabase es ideal para este proyecto porque:

- ✅ **PostgreSQL**: Base de datos relacional robusta y confiable
- ✅ **Autenticación integrada**: Sistema de autenticación listo para usar
- ✅ **Row Level Security (RLS)**: Seguridad a nivel de fila para proteger datos
- ✅ **Funciones de base de datos**: Permite lógica compleja en el servidor
- ✅ **API REST automática**: Genera APIs automáticamente
- ✅ **Tiempo real**: Soporte para actualizaciones en tiempo real (opcional)
- ✅ **Gratis para empezar**: Plan gratuito generoso

## Pasos para Configurar la Base de Datos

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota tu:
   - **URL del proyecto**: `https://tu-proyecto.supabase.co`
   - **Anon Key**: Clave pública para el cliente
   - **Service Role Key**: Clave privada (solo para operaciones administrativas)

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/wishlist
```

### 3. Ejecutar Scripts SQL

En el panel de Supabase, ve a **SQL Editor** y ejecuta los scripts en este orden:

1. **Primero**: `scripts/001_create_tables.sql` - Crea las tablas básicas
2. **Segundo**: `scripts/002_improvements.sql` - Agrega las mejoras (invitaciones, regalos, lista conjunta)

### 4. Verificar Configuración

Después de ejecutar los scripts, verifica que se hayan creado:

- ✅ Tabla `profiles`
- ✅ Tabla `wishlist_items`
- ✅ Tabla `partner_invitations`
- ✅ Funciones: `handle_new_user()`, `link_partners()`, `accept_partner_invitation()`, `get_user_id_by_email()`
- ✅ Políticas RLS configuradas

### 5. Configurar Autenticación en Supabase

1. Ve a **Authentication** > **URL Configuration**
2. Agrega tu URL de redirección: `http://localhost:3000/wishlist` (desarrollo)
3. Para producción, agrega tu dominio: `https://tu-dominio.com/wishlist`

### 6. Configurar Email (Opcional)

Para que funcionen las invitaciones por email:

1. Ve a **Authentication** > **Email Templates**
2. Configura las plantillas de email o usa el servicio de email de Supabase
3. Para producción, considera usar un servicio como SendGrid o Mailgun

## Estructura de la Base de Datos

### Tabla: `profiles`
- `id` (UUID, PK): ID del usuario (referencia a auth.users)
- `display_name` (TEXT): Nombre mostrado
- `partner_id` (UUID, FK): ID de la pareja vinculada
- `created_at` (TIMESTAMP): Fecha de creación

### Tabla: `wishlist_items`
- `id` (UUID, PK): ID del item
- `user_id` (UUID, FK): ID del usuario propietario
- `title` (TEXT): Título del item
- `description` (TEXT): Descripción opcional
- `is_shared` (BOOLEAN): Si está compartido con la pareja
- `is_completed` (BOOLEAN): Si está completado
- `is_joint` (BOOLEAN): Si es un item conjunto
- `gifted_by` (UUID, FK): ID de quien lo regaló
- `gifted_at` (TIMESTAMP): Fecha en que fue regalado
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización

### Tabla: `partner_invitations`
- `id` (UUID, PK): ID de la invitación
- `inviter_id` (UUID, FK): ID de quien envía la invitación
- `invitee_email` (TEXT): Email del destinatario
- `status` (TEXT): Estado (pending, accepted, rejected, cancelled)
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización

## Funciones de Base de Datos

### `handle_new_user()`
Se ejecuta automáticamente cuando se crea un nuevo usuario. Crea un perfil automáticamente.

### `link_partners(user1_id, user2_id)`
Vincula dos usuarios como pareja mutuamente.

### `accept_partner_invitation(invitation_id)`
Acepta una invitación y vincula a los usuarios como pareja.

### `get_user_id_by_email(user_email)`
Busca el ID de un usuario por su email (sin necesidad de permisos de admin).

## Seguridad (RLS)

El proyecto utiliza Row Level Security (RLS) para proteger los datos:

- Los usuarios solo pueden ver sus propios items o los de su pareja
- Los usuarios solo pueden actualizar sus propios items
- Los partners pueden marcar items como regalados
- Las invitaciones solo son visibles para el remitente y destinatario

## Alternativas a Supabase

Si prefieres usar otra base de datos:

### PostgreSQL (Directo)
- Puedes usar PostgreSQL directamente con un proveedor como:
  - **Neon** (https://neon.tech) - PostgreSQL serverless
  - **Railway** (https://railway.app) - PostgreSQL con un clic
  - **AWS RDS** - Para producción empresarial
  - **DigitalOcean** - Managed PostgreSQL

### Otras Opciones
- **PlanetScale** (MySQL compatible) - Si prefieres MySQL
- **MongoDB Atlas** - Si prefieres NoSQL (requeriría cambios significativos)

## Notas Importantes

⚠️ **Nunca expongas tu Service Role Key** en el código del cliente. Solo úsala en funciones del servidor o en operaciones administrativas.

⚠️ **Backup regular**: Configura backups automáticos en Supabase para no perder datos.

⚠️ **Límites del plan gratuito**: El plan gratuito de Supabase tiene límites. Revisa los límites antes de ir a producción.

## Scripts de Corrección

Si encuentras errores de permisos relacionados con `auth.users`, ejecuta el script de corrección:

1. **003_fix_rls_policies.sql**: Corrige las políticas RLS que intentan acceder directamente a `auth.users`

   Este script:
   - Crea una función helper `get_current_user_email()` que tiene acceso a `auth.users`
   - Actualiza las políticas RLS para usar esta función en lugar de consultar directamente
   - Corrige la función `accept_partner_invitation` para usar la función helper

   **Ejecuta este script si ves errores como:**
   - `permission denied for table users`
   - `permission denied for schema auth`

## Soporte

Para más información sobre Supabase:
- Documentación: https://supabase.com/docs
- Comunidad: https://github.com/supabase/supabase/discussions


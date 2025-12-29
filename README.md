# Couple Wishlist

Plataforma de lista de deseos para parejas - Crea y comparte tus sueños, metas y aspiraciones con tu pareja.

## 🚀 Características

- ✅ **Sistema de Autenticación**: Registro, login y verificación de email
- ✅ **Gestión de Parejas**: Sistema de invitaciones para vincular parejas
- ✅ **Listas Personalizadas**: Cada usuario tiene su propia lista de deseos
- ✅ **Lista Conjunta**: Lista compartida para sueños en común
- ✅ **Sistema de Regalos**: Marca items como regalados cuando se los das a tu pareja
- ✅ **Bilingüe**: Soporte para Español e Inglés
- ✅ **Diseño Responsive**: Optimizado para móviles con enfoque mobile-first
- ✅ **Tiempo Real**: Actualizaciones en tiempo real de las listas

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS
- **UI Components**: Radix UI
- **Autenticación**: Supabase Auth

## 📋 Requisitos Previos

- Node.js 18+ 
- pnpm (o npm/yarn)
- Cuenta de Supabase

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/GiraldoSA/couple-wishlist.git
   cd couple-wishlist
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/wishlist
   ```

4. **Configurar Base de Datos**
   
   Ve a tu proyecto de Supabase y ejecuta los scripts SQL en el SQL Editor:
   - Primero: `scripts/001_create_tables.sql`
   - Segundo: `scripts/002_improvements.sql`
   
   Para más detalles, consulta [DATABASE_SETUP.md](./DATABASE_SETUP.md)

5. **Ejecutar en desarrollo**
   ```bash
   pnpm dev
   # o
   npm run dev
   ```

6. **Abrir en el navegador**
   
   Abre [http://localhost:3000](http://localhost:3000)

## 📚 Estructura del Proyecto

```
couple-wishlist/
├── app/                    # Páginas de Next.js (App Router)
│   ├── auth/              # Páginas de autenticación
│   ├── api/               # API Routes
│   └── wishlist/          # Página principal de wishlist
├── components/            # Componentes React
│   ├── ui/               # Componentes UI reutilizables
│   └── wishlist-client.tsx
├── lib/                   # Utilidades y configuración
│   ├── i18n/             # Sistema de internacionalización
│   └── supabase/         # Clientes de Supabase
├── scripts/              # Scripts SQL para la base de datos
└── public/               # Archivos estáticos
```

## 🌍 Internacionalización

La plataforma soporta Español e Inglés. El idioma se puede cambiar desde el botón en la esquina superior derecha. El idioma seleccionado se guarda en localStorage.

## 📱 Diseño Responsive

La plataforma está completamente optimizada para dispositivos móviles con enfoque mobile-first:
- Diseño adaptativo para todas las pantallas
- Botones con tamaño táctil adecuado (mínimo 44px)
- Navegación optimizada para móviles
- Tipografía responsive

## 🗄️ Base de Datos

La plataforma utiliza Supabase (PostgreSQL) como base de datos. El esquema incluye:

- **profiles**: Perfiles de usuario
- **wishlist_items**: Items de la lista de deseos
- **partner_invitations**: Invitaciones de pareja

Para más detalles sobre la configuración de la base de datos, consulta [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👤 Autor

GiraldoSA

## 🙏 Agradecimientos

- Next.js por el framework
- Supabase por la infraestructura backend
- Radix UI por los componentes accesibles
- Tailwind CSS por el sistema de estilos


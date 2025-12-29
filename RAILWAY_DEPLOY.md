# Guía de Despliegue en Railway

Esta guía te ayudará a desplegar tu plataforma de wishlist en Railway usando Supabase como base de datos.

## 📋 Requisitos Previos

- ✅ Cuenta de Railway (https://railway.app)
- ✅ Proyecto de Supabase configurado y funcionando
- ✅ Scripts SQL ejecutados en Supabase

## 🚀 Pasos para Desplegar

### 1. Preparar el Proyecto

1. Asegúrate de que tu código esté en GitHub (ya está conectado)
2. Verifica que todos los cambios estén commiteados:
   ```bash
   git status
   git push origin main
   ```

### 2. Crear Proyecto en Railway

1. Ve a [Railway](https://railway.app) e inicia sesión
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Selecciona tu repositorio: `GiraldoSA/couple-wishlist`
5. Railway detectará automáticamente que es un proyecto Next.js

### 3. Configurar Variables de Entorno

En Railway, ve a tu proyecto > Settings > Variables y agrega:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://tu-app.railway.app/wishlist
```

**Nota:** Reemplaza `tu-proyecto` y `tu-app.railway.app` con tus valores reales.

### 4. Obtener Credenciales de Supabase

1. Ve a tu proyecto en Supabase
2. Settings > API
3. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: La clave pública

### 5. Configurar URL de Redirección en Supabase

1. Ve a Authentication > URL Configuration en Supabase
2. En "Redirect URLs", agrega:
   - `https://tu-app.railway.app/wishlist`
   - `https://tu-app.railway.app/auth/callback` (si usas OAuth)

### 6. Build y Deploy

Railway construirá automáticamente tu proyecto:

1. Railway detectará `package.json`
2. Instalará dependencias con `pnpm install` o `npm install`
3. Construirá con `npm run build`
4. Desplegará la aplicación

### 7. Obtener tu URL de Railway

1. Ve a Settings > Networking
2. Railway te dará una URL como: `tu-app.railway.app`
3. Opcionalmente puedes configurar un dominio personalizado

### 8. Verificar el Despliegue

1. Visita tu URL de Railway
2. Prueba:
   - Registro de usuarios
   - Login
   - Crear items en wishlist
   - Invitar parejas

## 🔧 Configuración Adicional

### Variables de Entorno Recomendadas

Railway también puede configurar estas variables automáticamente, pero puedes configurarlas manualmente:

```env
NODE_ENV=production
PORT=3000
```

### Monitoreo

Railway proporciona:
- Logs en tiempo real
- Métricas de uso
- Notificaciones de errores

## 📝 Notas Importantes

1. **Base de Datos**: Tu base de datos Supabase seguirá funcionando normalmente. No necesitas desplegar otra base de datos.

2. **Plan Gratuito de Railway**: 
   - 500 horas de uso al mes
   - $5 de crédito mensual
   - Perfecto para proyectos pequeños

3. **Plan Gratuito de Supabase**:
   - 500 MB de base de datos
   - 2 GB de ancho de banda
   - Suficiente para empezar

4. **Seguridad**:
   - ✅ Nunca expongas tu `SERVICE_ROLE_KEY` de Supabase
   - ✅ Solo usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la clave pública)
   - ✅ Las políticas RLS protegen tu base de datos

## 🐛 Solución de Problemas

### La aplicación no se conecta a Supabase

- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que las URLs no tengan espacios extra
- Revisa los logs de Railway para ver errores específicos

### Error de autenticación

- Verifica que la URL de redirección esté configurada en Supabase
- Asegúrate de usar `https://` en producción (no `http://`)

### Build falla

- Revisa los logs de build en Railway
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que no haya errores de TypeScript

## 🔗 Enlaces Útiles

- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## ✅ Checklist Pre-Deploy

- [ ] Código en GitHub
- [ ] Variables de entorno configuradas en Railway
- [ ] URL de redirección configurada en Supabase
- [ ] Build exitoso en Railway
- [ ] Pruebas básicas funcionando
- [ ] Logs sin errores críticos

¡Listo para desplegar! 🚀


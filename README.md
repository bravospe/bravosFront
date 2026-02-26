# 🧡 Bravos Dashboard

Panel de administración principal del sistema Bravos - Sistema de facturación electrónica SaaS para Perú.

## 🚀 Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Zustand + React Query
- TanStack Table + Recharts
- Laravel Echo (WebSockets)

## 📋 Instalación

```bash
# Instalar dependencias
npm install

# Configurar environment
cp .env.example .env.local

# Iniciar desarrollo
npm run dev
```

## 🔧 Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:6001
NEXT_PUBLIC_APP_NAME=Bravos
```

## 📁 Estructura

```
src/
├── app/(protected)/     # Rutas protegidas
├── app/(superadmin)/    # Panel SuperAdmin
├── app/auth/            # Autenticación
├── components/          # Componentes reutilizables
├── hooks/               # Custom hooks
├── services/            # API services
├── stores/              # Zustand stores
└── types/               # TypeScript types
```

## 🎯 Módulos

- Dashboard con métricas en tiempo real
- Gestión de clientes (validación RUC/DNI)
- Inventario multi-almacén
- Facturación electrónica (SUNAT)
- Punto de Venta (POS)
- Reportes y analíticas

## 🧪 Testing

```bash
npm run test:e2e       # Playwright E2E tests
```

## 🚀 Deploy

```bash
# Build producción
npm run build

# Deploy Vercel
vercel --prod
```

## 📄 Licencia

Propietario - Bravos © 2025

---

**Repositorios relacionados:**
- Backend API: [bravos_back](https://github.com/tu-usuario/bravos_back)
- Storefront: [bravos_store](https://github.com/tu-usuario/bravos_store)

# 🧡 Bravos Frontend - Contexto de Desarrollo

Este archivo proporciona instrucciones y contexto esencial para el desarrollo en el repositorio de **Bravos Frontend**, el panel de administración principal del sistema de facturación electrónica SaaS para Perú.

## 🚀 Visión General del Proyecto

- **Propósito:** ERP/POS SaaS diseñado para empresas peruanas, enfocado en facturación electrónica (SUNAT), gestión de inventarios y puntos de venta.
- **Stack Principal:**
  - **Framework:** Next.js 16 (App Router) + React 19.
  - **Lenguaje:** TypeScript.
  - **Estilos:** Tailwind CSS v4 (utilizando `@tailwindcss/postcss`).
  - **Estado Global:** Zustand (con persistencia para auth).
  - **Data Fetching:** React Query (TanStack Query) + Axios.
  - **Tablas/Gráficos:** TanStack Table, Recharts, ApexCharts.
  - **Comunicación:** Laravel Echo (Pusher/WebSockets) para actualizaciones en tiempo real.

## 🏗️ Arquitectura y Estructura

```text
src/
├── app/                  # App Router
│   ├── (protected)/      # Rutas que requieren autenticación y empresa seleccionada
│   ├── (superadmin)/     # Panel de administración global del SaaS
│   ├── auth/             # Login, registro y recuperación
│   └── layout.tsx        # Configuración global y fuentes (Sora)
├── components/           # Componentes React
│   ├── ui/               # Componentes de UI base (Botones, Inputs, etc.)
│   ├── dashboard/        # Widgets y gráficos específicos del dashboard
│   ├── layouts/          # Estructuras de página (DashboardLayout, etc.)
│   └── providers/        # Contextos y providers (QueryClient, Auth, etc.)
├── hooks/                # Custom hooks (permisos, suscripciones, etc.)
├── lib/                  # Utilidades y configuración de librerías (api.ts)
├── services/             # Capa de servicios para llamadas a la API
├── stores/               # Estado global con Zustand (authStore, uiStore, etc.)
├── types/                # Definiciones de interfaces TypeScript
└── utils/                # Funciones de utilidad y configuración de API
```

## 🔐 Autenticación y Multi-tenancy

- **Auth:** Se utiliza Laravel Sanctum. El `token` se almacena en el `authStore` (Zustand) con persistencia en localStorage.
- **CSRF:** El interceptor de Axios maneja automáticamente el handshake de `sanctum/csrf-cookie` y el reintento en caso de error 419.
- **Multi-tenancy:** Es **obligatorio** enviar la cabecera `X-Company-ID` en todas las peticiones protegidas. Esto se gestiona automáticamente en `src/lib/api.ts` usando el `currentCompany` del `authStore`.
- **Permisos:** Utilizar el hook `useUserPermissions` para verificar accesos.
  ```typescript
  const { can, isAdmin, hasPermission } = useUserPermissions();
  if (can.invoices) { /* ... */ }
  ```

## 🛠️ Comandos de Desarrollo

- **Instalación:** `npm install`
- **Desarrollo:** `npm run dev`
- **Build:** `npm run build`
- **Linting:** `npm run lint`
- **Tests E2E:** `npm run test:e2e` (Requiere Playwright)

## 🎨 Convenciones de Desarrollo

1.  **Tipado:** Siempre definir interfaces en `src/types/index.ts` o archivos locales si son específicos. Evitar el uso de `any`.
2.  **Componentes:** Preferir componentes funcionales y *Arrow Functions*. Usar `use client` solo cuando sea necesario para interactividad.
3.  **Estilos:** Seguir el sistema de diseño de Bravos. Colores clave:
    - **Primario:** Verde/Esmeralda (`#22C55E`).
    - **Acento:** Verde Neón (`#85fd37`).
    - **Oscuro:** `#111827` / `#080B12`.
4.  **Iconos:** Usar `lucide-react` para iconos nuevos. El proyecto también utiliza `@heroicons/react`.
5.  **API:** No realizar llamadas directas con `axios` o `fetch` dentro de los componentes. Utilizar la capa de `services/` y `react-query` para manejo de caché y estados de carga.

## 📋 Checklist para Nuevas Funcionalidades

- [ ] Definir los tipos/interfaces necesarios.
- [ ] Crear el servicio en `src/services/`.
- [ ] Implementar el hook de React Query si es necesario.
- [ ] Verificar permisos de usuario mediante `useUserPermissions`.
- [ ] Asegurar que el diseño sea responsivo y soporte modo oscuro (el proyecto prioriza dark mode).
- [ ] Probar el flujo en el POS si la funcionalidad afecta al proceso de venta.

---
*Bravos Dashboard © 2025*

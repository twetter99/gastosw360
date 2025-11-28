# GastosW360

Aplicación de gestión de horas extra y gastos para empresas de servicios técnicos.

## 🚀 Características Principales

### Para Técnicos (Mobile-First)
- **Registro rápido de horas extra** - 3 clics desde el móvil
- **Detección automática del tipo de día** - Laborable, sábado o festivo
- **Registro de gastos con adjuntos** - Foto del ticket directamente
- **Visualización del estado** - Ver qué está pendiente, aprobado o rechazado

### Para Jefes de Equipo
- **Aprobar horas de su equipo** - Vista de pendientes con acciones masivas
- **Registrar sus propias horas** - Con aprobación por Dirección
- **Visualizar registros de su equipo**

### Para Supervisores de Oficina
- **Aprobar gastos de todos los técnicos**
- **Control de dietas y kilometraje**
- **Verificación de adjuntos**

### Para Dirección
- **Dashboard con KPIs globales**
- **Aprobar horas de Jefes de Equipo**
- **Reportes y analíticas completas**
- **Exportación a Excel/PDF**

### Para Administración
- **Configuración de tarifas**
- **Gestión de usuarios y roles**
- **Calendario de festivos**
- **Gestión de proyectos/clientes**

## 📊 Sistema de KPIs

La aplicación proporciona analíticas completas:

- **Horas por año/mes/técnico/proyecto**
- **Costes totales y medios**
- **Desglose por tipo de hora** (laborable, sábado, festivo)
- **Gastos por categoría** (dietas, km, hoteles, etc.)
- **Rankings de técnicos**
- **Evolución mensual**
- **Comparativas interanuales**

> ⚠️ Solo se contabilizan las horas y gastos **APROBADOS**

## 🔐 Sistema de Roles y Aprobaciones

### Jerarquía
```
TÉCNICO (Nivel 1)
    ├── Sus horas → Aprobadas por JEFE_EQUIPO
    └── Sus gastos → Aprobados por SUPERVISOR_OFICINA

JEFE_EQUIPO (Nivel 2)
    ├── Sus horas → Aprobadas por DIRECCION
    └── Sus gastos → Aprobados por DIRECCION

SUPERVISOR_OFICINA (Nivel 3)
    └── Aprueba gastos de técnicos

DIRECCION (Nivel 4)
    └── Aprueba todo

ADMIN (Nivel 5)
    └── Configuración del sistema
```

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Almacenamiento**: Firebase Storage
- **Formularios**: React Hook Form + Zod
- **Gráficos**: Recharts
- **Tablas**: TanStack Table
- **Exportación**: ExcelJS, @react-pdf/renderer

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd gastos-extras-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Firebase

# Ejecutar en desarrollo
npm run dev
```

## ⚙️ Configuración de Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication con Email/Password
3. Crear una base de datos Firestore
4. Crear un bucket en Storage
5. Copiar las credenciales al archivo `.env.local`

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Rutas de Next.js
│   ├── (auth)/            # Páginas de autenticación
│   │   └── login/
│   └── (dashboard)/       # Páginas del dashboard
│       ├── aprobaciones/  # Aprobación de horas y gastos
│       ├── configuracion/ # Configuración del sistema
│       ├── dashboard/     # Dashboard principal
│       ├── registros/     # Registro de horas y gastos
│       └── reportes/      # KPIs y reportes
├── components/            # Componentes React
│   └── forms/             # Formularios
├── lib/                   # Utilidades y servicios
│   ├── db/                # Operaciones de base de datos
│   ├── firebase/          # Configuración de Firebase
│   ├── services/          # Servicios (KPIs, exports)
│   └── utils/             # Funciones auxiliares
├── schemas/               # Schemas de validación Zod
├── types/                 # Tipos TypeScript
└── constants/             # Constantes (tarifas, navegación)
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run start        # Iniciar producción
npm run lint         # Linter
npm run type-check   # Verificar tipos
```

## 📱 PWA Ready

La aplicación está optimizada para funcionar como PWA:
- Diseño responsive mobile-first
- Offline-capable (próximamente)
- Instalable en dispositivos

## 📄 Licencia

Privado - WINFIN Sistemas S.L.

## 👨‍💻 Desarrollo

Desarrollado para WINFIN Sistemas.

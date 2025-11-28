# Arquitectura GastosW360

## Estructura de Carpetas

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas públicas (login)
│   └── (dashboard)/              # Rutas protegidas
│
├── components/
│   ├── dashboard/                # Componentes de dashboard
│   ├── forms/                    # Formularios reutilizables
│   └── providers.tsx             # QueryClient + Auth providers
│
├── hooks/
│   ├── queries/                  # React Query hooks ⭐ NUEVO
│   │   ├── useHoras.ts           # Queries y mutations de horas
│   │   ├── useUsuarios.ts        # Queries y mutations de usuarios
│   │   └── index.ts              # Exportaciones centralizadas
│   └── index.ts                  # Hooks legacy (permisos, etc)
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts             # Configuración Firebase
│   │   ├── auth.tsx              # Provider de autenticación
│   │   ├── services/             # Servicios de datos ⭐ NUEVO
│   │   │   ├── base.ts           # Clase base genérica
│   │   │   ├── horas.ts          # Servicio de horas
│   │   │   ├── usuarios.ts       # Servicio de usuarios
│   │   │   └── index.ts          # Exportaciones
│   │   └── services.ts           # (Legacy - migrar gradualmente)
│   └── utils/                    # Utilidades
│
├── schemas/                      # Validación Zod
└── types/                        # TypeScript types

functions/                        # Cloud Functions ⭐ NUEVO
├── src/
│   └── index.ts                  # Triggers y funciones
├── package.json
└── tsconfig.json
```

## Patrón de Datos (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPONENTE                               │
│                                                                  │
│  const { data, isLoading } = useHorasUsuario(userId);           │
│  const { mutate: crear } = useCrearHoras();                     │
│                                                                  │
│  <Button onClick={() => crear(datos)}>Guardar</Button>          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT QUERY HOOK                              │
│                  (src/hooks/queries/)                            │
│                                                                  │
│  - Maneja caché                                                  │
│  - Estados loading/error                                         │
│  - Invalidación automática                                       │
│  - Evita race conditions                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICIO FIRESTORE                              │
│              (src/lib/firebase/services/)                        │
│                                                                  │
│  - CRUD genérico en base.ts                                      │
│  - Métodos específicos por entidad                               │
│  - Suscripciones en tiempo real                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIRESTORE                                   │
│                                                                  │
│  Colecciones: usuarios, registrosHoras, registrosGastos, etc.   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUD FUNCTIONS                                │
│                    (functions/src/)                              │
│                                                                  │
│  TRIGGERS onWrite:                                               │
│  - calcularImporteHoras: Aplica tarifas al guardar              │
│  - calcularImporteKilometraje: Calcula €/km                     │
│                                                                  │
│  ⚠️ Los importes SOLO se calculan aquí, nunca en el cliente     │
└─────────────────────────────────────────────────────────────────┘
```

## Cómo Añadir una Nueva Entidad

### 1. Crear el Servicio (lib/firebase/services/miEntidad.ts)

```typescript
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS } from '../config';

// 1. Definir tipo
export interface MiEntidadDB extends FirestoreDocument {
  nombre: string;
  // ... campos
}

// 2. Crear clase
class MiEntidadService extends BaseFirestoreService<MiEntidadDB> {
  constructor() {
    super('miEntidad'); // nombre de colección en Firestore
  }

  // 3. Añadir métodos específicos
  async getActivos() {
    return this.getAll([where('activo', '==', true)]);
  }
}

// 4. Exportar singleton
export const miEntidadService = new MiEntidadService();
```

### 2. Crear los Hooks (hooks/queries/useMiEntidad.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { miEntidadService } from '@/lib/firebase/services';

// Query keys para invalidación
export const miEntidadKeys = {
  all: ['miEntidad'] as const,
  lists: () => [...miEntidadKeys.all, 'list'] as const,
  detail: (id: string) => [...miEntidadKeys.all, 'detail', id] as const,
};

// Query
export function useMiEntidad() {
  return useQuery({
    queryKey: miEntidadKeys.lists(),
    queryFn: () => miEntidadService.getAll(),
  });
}

// Mutation
export function useCrearMiEntidad() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => miEntidadService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: miEntidadKeys.all });
    },
  });
}
```

### 3. Exportar (hooks/queries/index.ts)

```typescript
export { useMiEntidad, useCrearMiEntidad, miEntidadKeys } from './useMiEntidad';
```

### 4. Usar en Componente

```tsx
import { useMiEntidad, useCrearMiEntidad } from '@/hooks/queries';

function MiComponente() {
  const { data, isLoading, error } = useMiEntidad();
  const { mutate: crear, isPending } = useCrearMiEntidad();

  if (isLoading) return <Spinner />;
  if (error) return <Error />;

  return (
    <div>
      {data?.map(item => <Item key={item.id} {...item} />)}
      <Button 
        onClick={() => crear({ nombre: 'Nuevo' })} 
        disabled={isPending}
      >
        Crear
      </Button>
    </div>
  );
}
```

## Reglas Importantes

### ✅ HACER

- Usar `useQuery` para lectura de datos
- Usar `useMutation` para crear/editar/eliminar
- Crear servicios extendiendo `BaseFirestoreService`
- Validar datos con Zod antes de enviar
- Cálculos de importes en Cloud Functions

### ❌ NO HACER

- ~~useEffect + onSnapshot directo en componentes~~
- ~~Calcular importes/precios en el cliente~~
- ~~Fetch manual con loading/error states~~
- ~~Duplicar lógica de acceso a datos~~

## Deploy de Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## Variables de Entorno

```env
# .env.local (cliente)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gastosw360
# ...

# functions/.env (Cloud Functions)
# Las funciones usan las credenciales del proyecto automáticamente
```

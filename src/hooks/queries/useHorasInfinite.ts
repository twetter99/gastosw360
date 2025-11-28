/**
 * React Query Hooks con Paginación Infinita para Horas
 * 
 * Usa useInfiniteQuery para cargar datos bajo demanda
 * con scroll infinito o botón "Cargar más"
 * 
 * USO:
 * ```tsx
 * function MisHoras() {
 *   const { 
 *     data, 
 *     fetchNextPage, 
 *     hasNextPage, 
 *     isFetchingNextPage 
 *   } = useHorasInfinitas({ usuarioId: 'xxx' });
 *   
 *   // Aplanar todas las páginas en una lista
 *   const horas = data?.pages.flatMap(p => p.data) ?? [];
 *   
 *   return (
 *     <>
 *       <Lista items={horas} />
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()}>
 *           {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
 *         </button>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { 
  getRegistrosHoras, 
  PAGE_SIZE, 
  PaginatedResult,
  generarPeriodo 
} from '@/lib/db/registros';
import { RegistroHoras, EstadoAprobacion } from '@/types';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

// ============================================
// TIPOS
// ============================================

export interface FiltrosHorasInfinitas {
  usuarioId?: string;
  usuarioIds?: string[];
  año?: number;
  mes?: number;
  periodo?: string;  // Alternativa directa: "2025-01"
  estado?: EstadoAprobacion;
  proyectoId?: string;
  pageSize?: number;
}

// ============================================
// QUERY KEYS
// ============================================

export const horasInfinitasKeys = {
  all: ['horas-infinitas'] as const,
  list: (filters: FiltrosHorasInfinitas) => [...horasInfinitasKeys.all, filters] as const,
  byUsuario: (usuarioId: string) => 
    [...horasInfinitasKeys.all, { usuarioId }] as const,
  byPeriodo: (periodo: string, usuarioId?: string) => 
    [...horasInfinitasKeys.all, { periodo, usuarioId }] as const,
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook principal para obtener horas con paginación infinita
 * 
 * @param filtros - Filtros de búsqueda
 * @returns Resultado de useInfiniteQuery con métodos para paginación
 */
export function useHorasInfinitas(filtros: FiltrosHorasInfinitas = {}) {
  const queryKey = horasInfinitasKeys.list(filtros);
  
  return useInfiniteQuery<
    PaginatedResult<RegistroHoras>,
    Error,
    { pages: PaginatedResult<RegistroHoras>[]; pageParams: (QueryDocumentSnapshot<DocumentData> | null)[] },
    typeof queryKey,
    QueryDocumentSnapshot<DocumentData> | null
  >({
    queryKey,
    queryFn: async ({ pageParam }) => {
      return getRegistrosHoras({
        ...filtros,
        cursor: pageParam ?? undefined,
        pageSize: filtros.pageSize || PAGE_SIZE,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      // Si hay más páginas, devolver el cursor del último documento
      return lastPage.hasMore ? lastPage.lastDoc : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener todas las horas de un usuario con paginación
 */
export function useHorasUsuarioInfinitas(usuarioId: string | undefined, enabled = true) {
  return useHorasInfinitas(
    usuarioId ? { usuarioId } : {},
  );
}

/**
 * Hook para obtener horas de un periodo específico con paginación
 * Usa el campo 'periodo' para consultas optimizadas
 */
export function useHorasPeriodoInfinitas(
  año: number | undefined, 
  mes: number | undefined, 
  usuarioId?: string
) {
  const periodo = año && mes ? generarPeriodo(año, mes) : undefined;
  
  return useHorasInfinitas(
    periodo 
      ? { periodo, usuarioId, año, mes } 
      : {},
  );
}

/**
 * Hook para obtener horas pendientes con paginación
 */
export function useHorasPendientesInfinitas(aprobadorId?: string) {
  return useHorasInfinitas({
    estado: 'pendiente',
    ...(aprobadorId ? { usuarioIds: [aprobadorId] } : {}),
  });
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Aplana todas las páginas en un solo array
 * Útil para componentes que necesitan una lista plana
 */
export function flattenHorasPages(
  data: { pages: PaginatedResult<RegistroHoras>[] } | undefined
): RegistroHoras[] {
  if (!data?.pages) return [];
  return data.pages.flatMap(page => page.data);
}

/**
 * Cuenta el total de registros cargados
 */
export function countLoadedHoras(
  data: { pages: PaginatedResult<RegistroHoras>[] } | undefined
): number {
  if (!data?.pages) return 0;
  return data.pages.reduce((total, page) => total + page.data.length, 0);
}

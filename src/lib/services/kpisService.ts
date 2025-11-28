import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase/config';
import { 
  KPIsGlobales, 
  ResumenMensualUsuario,
  CategoriaGasto,
  FiltrosKPIs,
} from '@/types';

/**
 * Calcula y obtiene KPIs globales para un período
 */
export async function calcularKPIsGlobales(
  año: number,
  mes?: number
): Promise<KPIsGlobales> {
  // Obtener todos los registros de horas aprobados del período
  let queryHoras = query(
    collection(db, COLLECTIONS.REGISTROS_HORAS),
    where('año', '==', año),
    where('estadoHorasExtras', '==', 'aprobado')
  );
  
  if (mes) {
    queryHoras = query(queryHoras, where('mes', '==', mes));
  }
  
  const snapshotHoras = await getDocs(queryHoras);
  
  // Obtener todos los gastos aprobados del período
  let queryGastos = query(
    collection(db, COLLECTIONS.GASTOS),
    where('año', '==', año),
    where('estadoGasto', '==', 'aprobado')
  );
  
  if (mes) {
    queryGastos = query(queryGastos, where('mes', '==', mes));
  }
  
  const snapshotGastos = await getDocs(queryGastos);
  
  // Calcular totales de horas
  let totalHorasExtras = 0;
  let totalHorasExtrasLaborables = 0;
  let totalHorasExtrasSabado = 0;
  let totalHorasExtrasFestivo = 0;
  let costeTotalHorasExtras = 0;
  let importeHorasLaborables = 0;
  let importeHorasSabado = 0;
  let importeHorasFestivo = 0;
  
  const horasPorTecnico: Record<string, { nombre: string; horas: number; importe: number }> = {};
  const horasPorProyecto: Record<string, { nombre: string; horas: number; importe: number }> = {};
  
  snapshotHoras.docs.forEach((d) => {
    const data = d.data();
    
    totalHorasExtras += data.horasExtras || 0;
    costeTotalHorasExtras += data.importeHorasExtras || 0;
    
    switch (data.tipoHoraExtra) {
      case 'HORA_EXTRA_LABORABLE':
        totalHorasExtrasLaborables += data.horasExtras || 0;
        importeHorasLaborables += data.importeHorasExtras || 0;
        break;
      case 'HORA_EXTRA_SABADO':
        totalHorasExtrasSabado += data.horasExtras || 0;
        importeHorasSabado += data.importeHorasExtras || 0;
        break;
      case 'HORA_EXTRA_FESTIVO':
        totalHorasExtrasFestivo += data.horasExtras || 0;
        importeHorasFestivo += data.importeHorasExtras || 0;
        break;
    }
    
    // Agrupar por técnico
    if (!horasPorTecnico[data.usuarioId]) {
      horasPorTecnico[data.usuarioId] = {
        nombre: data.usuarioNombre,
        horas: 0,
        importe: 0,
      };
    }
    horasPorTecnico[data.usuarioId].horas += data.horasExtras || 0;
    horasPorTecnico[data.usuarioId].importe += data.importeHorasExtras || 0;
    
    // Agrupar por proyecto
    if (data.proyectoId) {
      if (!horasPorProyecto[data.proyectoId]) {
        horasPorProyecto[data.proyectoId] = {
          nombre: data.proyectoNombre || 'Sin nombre',
          horas: 0,
          importe: 0,
        };
      }
      horasPorProyecto[data.proyectoId].horas += data.horasExtras || 0;
      horasPorProyecto[data.proyectoId].importe += data.importeHorasExtras || 0;
    }
  });
  
  // Calcular totales de gastos
  let costeTotalDietas = 0;
  let numeroDietas = 0;
  let costeTotalKilometraje = 0;
  let totalKilometros = 0;
  let costeTotalHoteles = 0;
  let costeTotalOtrosGastos = 0;
  
  const gastosPorCategoria: Record<string, { total: number; cantidad: number }> = {};
  const gastosPorTecnico: Record<string, { nombre: string; total: number }> = {};
  const gastosPorProyecto: Record<string, { nombre: string; total: number }> = {};
  
  snapshotGastos.docs.forEach((d) => {
    const data = d.data();
    
    // Por categoría
    if (!gastosPorCategoria[data.categoria]) {
      gastosPorCategoria[data.categoria] = { total: 0, cantidad: 0 };
    }
    gastosPorCategoria[data.categoria].total += data.importe || 0;
    gastosPorCategoria[data.categoria].cantidad++;
    
    // Categorías específicas
    switch (data.categoria) {
      case 'dieta':
        costeTotalDietas += data.importe || 0;
        numeroDietas++;
        break;
      case 'kilometraje':
        costeTotalKilometraje += data.importe || 0;
        totalKilometros += data.kilometros || 0;
        break;
      case 'hotel':
        costeTotalHoteles += data.importe || 0;
        break;
      default:
        costeTotalOtrosGastos += data.importe || 0;
    }
    
    // Por técnico
    if (!gastosPorTecnico[data.usuarioId]) {
      gastosPorTecnico[data.usuarioId] = {
        nombre: data.usuarioNombre,
        total: 0,
      };
    }
    gastosPorTecnico[data.usuarioId].total += data.importe || 0;
    
    // Por proyecto
    if (data.proyectoId) {
      if (!gastosPorProyecto[data.proyectoId]) {
        gastosPorProyecto[data.proyectoId] = {
          nombre: data.proyectoNombre || 'Sin nombre',
          total: 0,
        };
      }
      gastosPorProyecto[data.proyectoId].total += data.importe || 0;
    }
  });
  
  const costeTotalGastos = costeTotalDietas + costeTotalKilometraje + costeTotalHoteles + costeTotalOtrosGastos;
  const costeTotalAnual = costeTotalHorasExtras + costeTotalGastos;
  
  const numeroTecnicos = Object.keys(horasPorTecnico).length;
  const numeroProyectos = Object.keys(horasPorProyecto).length;
  
  const kpis: KPIsGlobales = {
    id: mes ? `${año}_${mes}` : `${año}`,
    año,
    mes,
    
    // Horas
    totalHorasExtras,
    totalHorasExtrasLaborables,
    totalHorasExtrasSabado,
    totalHorasExtrasFestivo,
    porcentajeHorasFestivo: totalHorasExtras > 0 
      ? (totalHorasExtrasFestivo / totalHorasExtras) * 100 
      : 0,
    
    costeTotalHorasExtras,
    costeMedioHoraExtra: totalHorasExtras > 0 
      ? costeTotalHorasExtras / totalHorasExtras 
      : 0,
    costeMedioHoraLaborable: totalHorasExtrasLaborables > 0 
      ? importeHorasLaborables / totalHorasExtrasLaborables 
      : 0,
    costeMedioHoraSabado: totalHorasExtrasSabado > 0 
      ? importeHorasSabado / totalHorasExtrasSabado 
      : 0,
    costeMedioHoraFestivo: totalHorasExtrasFestivo > 0 
      ? importeHorasFestivo / totalHorasExtrasFestivo 
      : 0,
    
    // Horas por técnico
    horasPorTecnico: Object.entries(horasPorTecnico)
      .map(([id, data]) => ({
        usuarioId: id,
        usuarioNombre: data.nombre,
        totalHoras: data.horas,
        totalImporte: data.importe,
      }))
      .sort((a, b) => b.totalHoras - a.totalHoras),
    
    // Horas por proyecto
    horasPorProyecto: Object.entries(horasPorProyecto)
      .map(([id, data]) => ({
        proyectoId: id,
        proyectoNombre: data.nombre,
        totalHoras: data.horas,
        totalImporte: data.importe,
      }))
      .sort((a, b) => b.totalHoras - a.totalHoras),
    
    // Gastos
    costeTotalDietas,
    costeMedioDieta: numeroDietas > 0 ? costeTotalDietas / numeroDietas : 0,
    numeroDietas,
    
    costeTotalKilometraje,
    totalKilometros,
    
    costeTotalHoteles,
    costeTotalOtrosGastos,
    costeTotalGastos,
    
    // Gastos por categoría
    gastosPorCategoria: Object.entries(gastosPorCategoria)
      .map(([cat, data]) => ({
        categoria: cat as CategoriaGasto,
        total: data.total,
        cantidad: data.cantidad,
      }))
      .sort((a, b) => b.total - a.total),
    
    // Gastos por técnico
    gastosPorTecnico: Object.entries(gastosPorTecnico)
      .map(([id, data]) => ({
        usuarioId: id,
        usuarioNombre: data.nombre,
        totalGastos: data.total,
      }))
      .sort((a, b) => b.totalGastos - a.totalGastos),
    
    // Gastos por proyecto
    gastosPorProyecto: Object.entries(gastosPorProyecto)
      .map(([id, data]) => ({
        proyectoId: id,
        proyectoNombre: data.nombre,
        totalGastos: data.total,
      }))
      .sort((a, b) => b.totalGastos - a.totalGastos),
    
    // Totales
    costeTotalAnual,
    costeMedioPorTecnico: numeroTecnicos > 0 ? costeTotalAnual / numeroTecnicos : 0,
    costeMedioPorProyecto: numeroProyectos > 0 ? costeTotalAnual / numeroProyectos : 0,
    
    // Metadata
    numeroTecnicos,
    numeroProyectos,
    
    updatedAt: Timestamp.now(),
  };
  
  // Guardar KPIs calculados
  await setDoc(doc(db, COLLECTIONS.KPIS, kpis.id), kpis);
  
  return kpis;
}

/**
 * Obtiene KPIs guardados
 */
export async function getKPIs(año: number, mes?: number): Promise<KPIsGlobales | null> {
  const id = mes ? `${año}_${mes}` : `${año}`;
  const docRef = doc(db, COLLECTIONS.KPIS, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return docSnap.data() as KPIsGlobales;
}

/**
 * Obtiene ranking de técnicos por horas
 */
export async function getRankingTecnicosPorHoras(
  año: number,
  limite: number = 10
): Promise<{ usuarioId: string; usuarioNombre: string; totalHoras: number; totalImporte: number }[]> {
  const kpis = await getKPIs(año);
  if (!kpis) return [];
  
  return kpis.horasPorTecnico.slice(0, limite);
}

/**
 * Obtiene ranking de técnicos por gastos
 */
export async function getRankingTecnicosPorGastos(
  año: number,
  limite: number = 10
): Promise<{ usuarioId: string; usuarioNombre: string; totalGastos: number }[]> {
  const kpis = await getKPIs(año);
  if (!kpis) return [];
  
  return kpis.gastosPorTecnico.slice(0, limite);
}

/**
 * Compara KPIs entre dos períodos
 */
export async function compararKPIs(
  año1: number,
  año2: number,
  mes?: number
): Promise<{
  variacionHoras: number;
  variacionGastos: number;
  variacionCosteTotal: number;
}> {
  const kpis1 = await getKPIs(año1, mes);
  const kpis2 = await getKPIs(año2, mes);
  
  if (!kpis1 || !kpis2) {
    return { variacionHoras: 0, variacionGastos: 0, variacionCosteTotal: 0 };
  }
  
  const calcularVariacion = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  };
  
  return {
    variacionHoras: calcularVariacion(kpis1.totalHorasExtras, kpis2.totalHorasExtras),
    variacionGastos: calcularVariacion(kpis1.costeTotalGastos, kpis2.costeTotalGastos),
    variacionCosteTotal: calcularVariacion(kpis1.costeTotalAnual, kpis2.costeTotalAnual),
  };
}

/**
 * Obtiene evolución mensual de un año
 */
export async function getEvolucionMensual(
  año: number
): Promise<{
  mes: number;
  horasExtras: number;
  gastos: number;
  total: number;
}[]> {
  const resultados = [];
  
  for (let mes = 1; mes <= 12; mes++) {
    const kpis = await getKPIs(año, mes);
    resultados.push({
      mes,
      horasExtras: kpis?.costeTotalHorasExtras || 0,
      gastos: kpis?.costeTotalGastos || 0,
      total: kpis?.costeTotalAnual || 0,
    });
  }
  
  return resultados;
}

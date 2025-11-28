/**
 * Cloud Functions para GastosW360
 * 
 * Estas funciones manejan lógica de negocio crítica que NO debe
 * ejecutarse en el cliente:
 * 
 * 1. Cálculo de importes de horas extras (aplicar tarifas)
 * 2. Validación de reglas de negocio
 * 3. Triggers de Firestore para mantener datos consistentes
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ============================================
// TIPOS
// ============================================

interface Tarifa {
  id: string;
  codigo: string;
  descripcion: string;
  importe: number;
  activa: boolean;
  vigenciaDesde: admin.firestore.Timestamp;
  vigenciaHasta?: admin.firestore.Timestamp;
}

interface RegistroHoras {
  usuarioId: string;
  horasExtras: number;
  tipoHora: 'laborable' | 'sabado' | 'festivo' | 'nocturno';
  fecha: admin.firestore.Timestamp;
  // Campos calculados por esta función
  tipoTarifa?: string;
  tarifaAplicada?: number;
  importeHorasExtras?: number;
}

// ============================================
// HELPERS
// ============================================

/**
 * Mapea tipo de hora a código de tarifa
 */
function getTipoTarifa(tipoHora: string): string {
  const mapping: Record<string, string> = {
    'laborable': 'HORA_EXTRA_LABORABLE',
    'sabado': 'HORA_EXTRA_SABADO',
    'festivo': 'HORA_EXTRA_FESTIVO',
    'nocturno': 'HORA_EXTRA_NOCTURNA',
  };
  return mapping[tipoHora] || 'HORA_EXTRA_LABORABLE';
}

/**
 * Obtiene la tarifa activa para un código en una fecha
 */
async function obtenerTarifaVigente(
  codigo: string, 
  fecha: Date
): Promise<Tarifa | null> {
  const snapshot = await db.collection('tarifas')
    .where('codigo', '==', codigo)
    .where('activa', '==', true)
    .get();
  
  for (const doc of snapshot.docs) {
    const tarifa = { id: doc.id, ...doc.data() } as Tarifa;
    const vigenciaDesde = tarifa.vigenciaDesde.toDate();
    const vigenciaHasta = tarifa.vigenciaHasta?.toDate();
    
    if (vigenciaDesde <= fecha && (!vigenciaHasta || vigenciaHasta >= fecha)) {
      return tarifa;
    }
  }
  
  return null;
}

/**
 * Obtiene tarifas especiales del usuario (si las tiene)
 */
async function obtenerTarifasEspeciales(
  usuarioId: string
): Promise<Record<string, number> | null> {
  const userDoc = await db.collection('usuarios').doc(usuarioId).get();
  if (!userDoc.exists) return null;
  
  const userData = userDoc.data();
  return userData?.tarifasEspeciales || null;
}

// ============================================
// TRIGGER: Calcular importe al crear/actualizar horas
// ============================================

export const calcularImporteHoras = functions.firestore
  .document('registrosHoras/{registroId}')
  .onWrite(async (change, context) => {
    // Si se eliminó el documento, no hacer nada
    if (!change.after.exists) {
      return null;
    }
    
    const registro = change.after.data() as RegistroHoras;
    const registroId = context.params.registroId;
    
    // Si ya tiene importe calculado y los datos no cambiaron, no recalcular
    const before = change.before.exists ? change.before.data() as RegistroHoras : null;
    if (before && 
        before.horasExtras === registro.horasExtras && 
        before.tipoHora === registro.tipoHora &&
        registro.importeHorasExtras !== undefined) {
      return null;
    }
    
    try {
      const tipoTarifa = getTipoTarifa(registro.tipoHora);
      const fecha = registro.fecha.toDate();
      
      // 1. Buscar tarifa especial del usuario
      const tarifasEspeciales = await obtenerTarifasEspeciales(registro.usuarioId);
      let tarifaAplicada = tarifasEspeciales?.[tipoTarifa];
      
      // 2. Si no hay especial, usar tarifa general vigente
      if (!tarifaAplicada) {
        const tarifa = await obtenerTarifaVigente(tipoTarifa, fecha);
        tarifaAplicada = tarifa?.importe || 0;
      }
      
      // 3. Calcular importe
      const importeHorasExtras = Math.round(registro.horasExtras * tarifaAplicada * 100) / 100;
      
      // 4. Actualizar documento
      await db.collection('registrosHoras').doc(registroId).update({
        tipoTarifa,
        tarifaAplicada,
        importeHorasExtras,
        calculadoEn: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      functions.logger.info(`Importe calculado para ${registroId}:`, {
        horas: registro.horasExtras,
        tarifa: tarifaAplicada,
        importe: importeHorasExtras,
      });
      
      return null;
    } catch (error) {
      functions.logger.error(`Error calculando importe para ${registroId}:`, error);
      throw error;
    }
  });

// ============================================
// TRIGGER: Validar y recalcular gastos de kilometraje
// ============================================

export const calcularImporteKilometraje = functions.firestore
  .document('registrosGastos/{gastoId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;
    
    const gasto = change.after.data();
    const gastoId = context.params.gastoId;
    
    // Solo procesar gastos de kilometraje
    if (gasto.categoria !== 'kilometraje') return null;
    
    // Si no hay kilómetros, no calcular
    if (!gasto.kilometros || gasto.kilometros <= 0) return null;
    
    // Verificar si necesita recalcular
    const before = change.before.exists ? change.before.data() : null;
    if (before && before.kilometros === gasto.kilometros && gasto.importeCalculado) {
      return null;
    }
    
    try {
      // Obtener tarifa de kilometraje vigente
      const tarifa = await obtenerTarifaVigente('KILOMETRAJE', gasto.fecha.toDate());
      const tarifaKm = tarifa?.importe || 0.19; // Default 0.19€/km
      
      const importeCalculado = Math.round(gasto.kilometros * tarifaKm * 100) / 100;
      
      await db.collection('registrosGastos').doc(gastoId).update({
        tarifaKm,
        importeCalculado,
        importe: importeCalculado, // Actualizar el importe principal
        calculadoEn: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return null;
    } catch (error) {
      functions.logger.error(`Error calculando kilometraje para ${gastoId}:`, error);
      throw error;
    }
  });

// ============================================
// HTTP: Recalcular todos los importes (admin)
// ============================================

export const recalcularTodosLosImportes = functions.https.onCall(async (data, context) => {
  // Verificar que el usuario es admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }
  
  const userDoc = await db.collection('usuarios').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  if (userData?.rol !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden ejecutar esto');
  }
  
  // Recalcular horas
  const horasSnapshot = await db.collection('registrosHoras').get();
  let horasActualizadas = 0;
  
  for (const doc of horasSnapshot.docs) {
    const registro = doc.data() as RegistroHoras;
    const tipoTarifa = getTipoTarifa(registro.tipoHora);
    const fecha = registro.fecha.toDate();
    
    const tarifasEspeciales = await obtenerTarifasEspeciales(registro.usuarioId);
    let tarifaAplicada = tarifasEspeciales?.[tipoTarifa];
    
    if (!tarifaAplicada) {
      const tarifa = await obtenerTarifaVigente(tipoTarifa, fecha);
      tarifaAplicada = tarifa?.importe || 0;
    }
    
    const importeHorasExtras = Math.round(registro.horasExtras * tarifaAplicada * 100) / 100;
    
    await doc.ref.update({
      tipoTarifa,
      tarifaAplicada,
      importeHorasExtras,
      calculadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    horasActualizadas++;
  }
  
  return {
    success: true,
    horasActualizadas,
  };
});

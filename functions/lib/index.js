"use strict";
/**
 * Cloud Functions para GastosW360
 *
 * Estas funciones manejan lógica de negocio crítica que NO debe
 * ejecutarse en el cliente:
 *
 * 1. Custom Claims para seguridad (rol, equipoId en token)
 * 2. Cálculo de importes de horas extras (aplicar tarifas)
 * 3. Validación de reglas de negocio
 * 4. Triggers de Firestore para mantener datos consistentes
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceAdminClaims = exports.recalcularTodosLosImportes = exports.calcularImporteKilometraje = exports.calcularImporteHoras = exports.syncMyCustomClaims = exports.refreshCustomClaims = exports.onUserUpdated = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// ============================================
// CUSTOM CLAIMS - SEGURIDAD
// ============================================
/**
 * Actualiza los Custom Claims del token de autenticación
 * Se ejecuta cuando se crea o actualiza un usuario en Firestore
 *
 * BENEFICIOS:
 * - Las reglas de Firestore usan request.auth.token en vez de leer la BD
 * - Reduce costes (0 lecturas extra por regla)
 * - Reduce latencia (no hay llamada a Firestore)
 */
async function actualizarCustomClaims(uid, claims) {
    try {
        await admin.auth().setCustomUserClaims(uid, claims);
        functions.logger.info(`Custom claims actualizados para ${uid}:`, claims);
        // Actualizar timestamp para forzar refresh del token en el cliente
        await db.collection('usuarios').doc(uid).update({
            claimsActualizados: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        functions.logger.error(`Error actualizando claims para ${uid}:`, error);
        throw error;
    }
}
/**
 * Trigger: Cuando se crea un usuario, establecer Custom Claims iniciales
 */
exports.onUserCreated = functions.firestore
    .document('usuarios/{userId}')
    .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    const userData = snapshot.data();
    const claims = {
        rol: userData.rol || 'tecnico',
        equipoId: userData.equipoId,
        responsableHorasId: userData.responsableHorasId,
        supervisorGastosId: userData.supervisorGastosId,
    };
    await actualizarCustomClaims(userId, claims);
    return null;
});
/**
 * Trigger: Cuando se actualiza el rol o equipo de un usuario
 */
exports.onUserUpdated = functions.firestore
    .document('usuarios/{userId}')
    .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();
    // Solo actualizar claims si cambiaron campos relevantes
    const camposRelevantes = ['rol', 'equipoId', 'responsableHorasId', 'supervisorGastosId'];
    const cambioRelevante = camposRelevantes.some(campo => before[campo] !== after[campo]);
    if (!cambioRelevante) {
        return null;
    }
    const claims = {
        rol: after.rol || 'tecnico',
        equipoId: after.equipoId,
        responsableHorasId: after.responsableHorasId,
        supervisorGastosId: after.supervisorGastosId,
    };
    await actualizarCustomClaims(userId, claims);
    return null;
});
/**
 * HTTP Callable: Forzar actualización de claims (para admin)
 * Útil para migración inicial de usuarios existentes
 */
exports.refreshCustomClaims = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    // Verificar que es admin
    if (!((_b = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.rol) || context.auth.token.rol !== 'admin') {
        // Fallback: verificar en BD si no tiene claims aún
        if (context.auth) {
            const userDoc = await db.collection('usuarios').doc(context.auth.uid).get();
            if (((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.rol) !== 'admin') {
                throw new functions.https.HttpsError('permission-denied', 'Solo admins');
            }
        }
        else {
            throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
        }
    }
    const { userId, all } = data;
    if (all) {
        // Actualizar todos los usuarios
        const usersSnapshot = await db.collection('usuarios').get();
        let updated = 0;
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            try {
                await actualizarCustomClaims(doc.id, {
                    rol: userData.rol || 'tecnico',
                    equipoId: userData.equipoId,
                    responsableHorasId: userData.responsableHorasId,
                    supervisorGastosId: userData.supervisorGastosId,
                });
                updated++;
            }
            catch (e) {
                functions.logger.warn(`No se pudo actualizar claims para ${doc.id}:`, e);
            }
        }
        return { success: true, updated };
    }
    if (userId) {
        const userDoc = await db.collection('usuarios').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
        }
        const userData = userDoc.data();
        await actualizarCustomClaims(userId, {
            rol: userData.rol || 'tecnico',
            equipoId: userData.equipoId,
            responsableHorasId: userData.responsableHorasId,
            supervisorGastosId: userData.supervisorGastosId,
        });
        return { success: true, userId };
    }
    throw new functions.https.HttpsError('invalid-argument', 'Especifica userId o all: true');
});
/**
 * HTTP Callable: Permite a un usuario sincronizar sus propios claims
 * Útil cuando el usuario inicia sesión y sus claims están desactualizados
 */
exports.syncMyCustomClaims = functions.https.onCall(async (_, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const userId = context.auth.uid;
    const userDoc = await db.collection('usuarios').doc(userId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Usuario no encontrado en la base de datos');
    }
    const userData = userDoc.data();
    await actualizarCustomClaims(userId, {
        rol: userData.rol || 'tecnico',
        equipoId: userData.equipoId,
        responsableHorasId: userData.responsableHorasId,
        supervisorGastosId: userData.supervisorGastosId,
    });
    return {
        success: true,
        claims: {
            rol: userData.rol || 'tecnico',
            equipoId: userData.equipoId,
        }
    };
});
// ============================================
// HELPERS
// ============================================
/**
 * Mapea tipo de hora a código de tarifa
 */
function getTipoTarifa(tipoHora) {
    const mapping = {
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
async function obtenerTarifaVigente(codigo, fecha) {
    var _a;
    const snapshot = await db.collection('tarifas')
        .where('codigo', '==', codigo)
        .where('activa', '==', true)
        .get();
    for (const doc of snapshot.docs) {
        const tarifa = Object.assign({ id: doc.id }, doc.data());
        const vigenciaDesde = tarifa.vigenciaDesde.toDate();
        const vigenciaHasta = (_a = tarifa.vigenciaHasta) === null || _a === void 0 ? void 0 : _a.toDate();
        if (vigenciaDesde <= fecha && (!vigenciaHasta || vigenciaHasta >= fecha)) {
            return tarifa;
        }
    }
    return null;
}
/**
 * Obtiene tarifas especiales del usuario (si las tiene)
 */
async function obtenerTarifasEspeciales(usuarioId) {
    const userDoc = await db.collection('usuarios').doc(usuarioId).get();
    if (!userDoc.exists)
        return null;
    const userData = userDoc.data();
    return (userData === null || userData === void 0 ? void 0 : userData.tarifasEspeciales) || null;
}
// ============================================
// TRIGGER: Calcular importe al crear/actualizar horas
// ============================================
exports.calcularImporteHoras = functions.firestore
    .document('registrosHoras/{registroId}')
    .onWrite(async (change, context) => {
    // Si se eliminó el documento, no hacer nada
    if (!change.after.exists) {
        return null;
    }
    const registro = change.after.data();
    const registroId = context.params.registroId;
    // Si ya tiene importe calculado y los datos no cambiaron, no recalcular
    const before = change.before.exists ? change.before.data() : null;
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
        let tarifaAplicada = tarifasEspeciales === null || tarifasEspeciales === void 0 ? void 0 : tarifasEspeciales[tipoTarifa];
        // 2. Si no hay especial, usar tarifa general vigente
        if (!tarifaAplicada) {
            const tarifa = await obtenerTarifaVigente(tipoTarifa, fecha);
            tarifaAplicada = (tarifa === null || tarifa === void 0 ? void 0 : tarifa.importe) || 0;
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
    }
    catch (error) {
        functions.logger.error(`Error calculando importe para ${registroId}:`, error);
        throw error;
    }
});
// ============================================
// TRIGGER: Validar y recalcular gastos de kilometraje
// ============================================
exports.calcularImporteKilometraje = functions.firestore
    .document('registrosGastos/{gastoId}')
    .onWrite(async (change, context) => {
    if (!change.after.exists)
        return null;
    const gasto = change.after.data();
    const gastoId = context.params.gastoId;
    if (!gasto)
        return null;
    // Solo procesar gastos de kilometraje
    if (gasto.categoria !== 'kilometraje')
        return null;
    // Si no hay kilómetros, no calcular
    if (!gasto.kilometros || gasto.kilometros <= 0)
        return null;
    // Verificar si necesita recalcular
    const before = change.before.exists ? change.before.data() : null;
    if (before && before.kilometros === gasto.kilometros && gasto.importeCalculado) {
        return null;
    }
    try {
        // Obtener tarifa de kilometraje vigente
        const tarifa = await obtenerTarifaVigente('KILOMETRAJE', gasto.fecha.toDate());
        const tarifaKm = (tarifa === null || tarifa === void 0 ? void 0 : tarifa.importe) || 0.19; // Default 0.19€/km
        const importeCalculado = Math.round(gasto.kilometros * tarifaKm * 100) / 100;
        await db.collection('registrosGastos').doc(gastoId).update({
            tarifaKm,
            importeCalculado,
            importe: importeCalculado, // Actualizar el importe principal
            calculadoEn: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
    }
    catch (error) {
        functions.logger.error(`Error calculando kilometraje para ${gastoId}:`, error);
        throw error;
    }
});
// ============================================
// HTTP: Recalcular todos los importes (admin)
// ============================================
exports.recalcularTodosLosImportes = functions.https.onCall(async (data, context) => {
    // Verificar que el usuario es admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
    }
    const userDoc = await db.collection('usuarios').doc(context.auth.uid).get();
    const userData = userDoc.data();
    if ((userData === null || userData === void 0 ? void 0 : userData.rol) !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden ejecutar esto');
    }
    // Recalcular horas
    const horasSnapshot = await db.collection('registrosHoras').get();
    let horasActualizadas = 0;
    for (const doc of horasSnapshot.docs) {
        const registro = doc.data();
        const tipoTarifa = getTipoTarifa(registro.tipoHora);
        const fecha = registro.fecha.toDate();
        const tarifasEspeciales = await obtenerTarifasEspeciales(registro.usuarioId);
        let tarifaAplicada = tarifasEspeciales === null || tarifasEspeciales === void 0 ? void 0 : tarifasEspeciales[tipoTarifa];
        if (!tarifaAplicada) {
            const tarifa = await obtenerTarifaVigente(tipoTarifa, fecha);
            tarifaAplicada = (tarifa === null || tarifa === void 0 ? void 0 : tarifa.importe) || 0;
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
/**
 * HTTP: Forzar claims de admin (temporal - eliminar después)
 */
exports.forceAdminClaims = functions.https.onRequest(async (req, res) => {
    const uid = 'fVfIYUwwVMPbFS5U9Y3fkYw46h63';
    try {
        await admin.auth().setCustomUserClaims(uid, { rol: 'admin' });
        await db.collection('usuarios').doc(uid).update({
            claimsActualizados: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ success: true, message: 'Claims de admin establecidos. Cierra sesión y entra de nuevo.' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
//# sourceMappingURL=index.js.map
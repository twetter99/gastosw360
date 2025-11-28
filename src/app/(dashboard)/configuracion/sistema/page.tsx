'use client';

import { useState } from 'react';
import { Save, Settings, Bell, Shield, Database, Mail, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';

export default function SistemaPage() {
  const { isAdmin, claims, refreshClaims } = useAuth();
  const [config, setConfig] = useState({
    nombreEmpresa: 'Mi Empresa S.L.',
    emailAdmin: 'admin@empresa.com',
    notificacionesEmail: true,
    notificacionesPush: false,
    aprobarAutoGastosMenores: true,
    limiteGastoAuto: 50,
    diasMaxRetroactivo: 7,
    backupAutomatico: true,
  });
  
  const [propagandoClaims, setPropagandoClaims] = useState(false);
  const [resultadoPropagacion, setResultadoPropagacion] = useState<string | null>(null);

  const handlePropagarClaims = async () => {
    if (!isAdmin) return;
    
    setPropagandoClaims(true);
    setResultadoPropagacion(null);
    
    try {
      const propagarFn = httpsCallable<{ all: boolean }, { success: boolean; updated: number }>(
        functions, 
        'refreshCustomClaims'
      );
      const result = await propagarFn({ all: true });
      setResultadoPropagacion(`✅ Claims actualizados para ${result.data.updated} usuarios`);
    } catch (error) {
      console.error('Error propagando claims:', error);
      setResultadoPropagacion('❌ Error al propagar claims. Ver consola para detalles.');
    } finally {
      setPropagandoClaims(false);
    }
  };

  const handleRefreshMyClaims = async () => {
    try {
      await refreshClaims();
      setResultadoPropagacion('✅ Tus claims han sido refrescados');
    } catch (error) {
      console.error('Error refrescando claims:', error);
      setResultadoPropagacion('❌ Error al refrescar claims');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600">Ajustes generales de la aplicación</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos Empresa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Datos de la Empresa</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la empresa
              </label>
              <input
                type="text"
                value={config.nombreEmpresa}
                onChange={(e) => setConfig({...config, nombreEmpresa: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email administrador
              </label>
              <input
                type="email"
                value={config.emailAdmin}
                onChange={(e) => setConfig({...config, emailAdmin: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Notificaciones por email</span>
              </div>
              <input
                type="checkbox"
                checked={config.notificacionesEmail}
                onChange={(e) => setConfig({...config, notificacionesEmail: e.target.checked})}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Notificaciones push</span>
              </div>
              <input
                type="checkbox"
                checked={config.notificacionesPush}
                onChange={(e) => setConfig({...config, notificacionesPush: e.target.checked})}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
            </label>
          </div>
        </div>

        {/* Reglas de Negocio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Reglas de Negocio</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-700">Auto-aprobar gastos menores</span>
                <p className="text-xs text-gray-500">Aprueba automáticamente gastos bajo un límite</p>
              </div>
              <input
                type="checkbox"
                checked={config.aprobarAutoGastosMenores}
                onChange={(e) => setConfig({...config, aprobarAutoGastosMenores: e.target.checked})}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Límite auto-aprobación (€)
              </label>
              <input
                type="number"
                value={config.limiteGastoAuto}
                onChange={(e) => setConfig({...config, limiteGastoAuto: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días máximo registro retroactivo
              </label>
              <input
                type="number"
                value={config.diasMaxRetroactivo}
                onChange={(e) => setConfig({...config, diasMaxRetroactivo: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Backup y Datos</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-700">Backup automático diario</span>
                <p className="text-xs text-gray-500">Copia de seguridad a las 02:00</p>
              </div>
              <input
                type="checkbox"
                checked={config.backupAutomatico}
                onChange={(e) => setConfig({...config, backupAutomatico: e.target.checked})}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
            </label>

            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Exportar todos los datos
            </button>
          </div>
        </div>

        {/* Administración de Seguridad - Solo Admin */}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Administración de Seguridad</h2>
                <p className="text-sm text-gray-500">Gestión de Custom Claims y permisos</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Info de claims actuales */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tus claims actuales:</h3>
                <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto">
                  {JSON.stringify(claims, null, 2)}
                </pre>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={handleRefreshMyClaims}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refrescar mis Claims
                </button>

                <button
                  onClick={handlePropagarClaims}
                  disabled={propagandoClaims}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {propagandoClaims ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Propagando...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Propagar Claims a TODOS
                    </>
                  )}
                </button>
              </div>

              {resultadoPropagacion && (
                <div className={`p-3 rounded-lg text-sm ${
                  resultadoPropagacion.startsWith('✅') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {resultadoPropagacion}
                </div>
              )}

              <p className="text-xs text-gray-500">
                ⚠️ <strong>Propagar Claims a TODOS</strong> actualizará los Custom Claims de todos los usuarios 
                existentes en la base de datos. Esto es necesario ejecutarlo una vez después de activar el sistema 
                de Custom Claims. Los nuevos usuarios recibirán sus claims automáticamente.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Save className="w-5 h-5" />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}

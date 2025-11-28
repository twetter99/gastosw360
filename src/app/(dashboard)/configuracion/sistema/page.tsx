'use client';

import { useState } from 'react';
import { Save, Settings, Bell, Shield, Database, Mail } from 'lucide-react';

export default function SistemaPage() {
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

'use client';

import { useState } from 'react';
import {
  Settings,
  Users,
  Building2,
  Calendar,
  Euro,
  Save,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { formatearMoneda } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { TARIFAS_POR_DEFECTO } from '@/constants/tarifas';

// Tabs de configuración
type ConfigTab = 'tarifas' | 'usuarios' | 'proyectos' | 'festivos' | 'general';

// Mock data usuarios
const MOCK_USUARIOS = [
  { id: '1', nombre: 'Roberto Burgoa', email: 'roberto@winfin.es', rol: 'tecnico', codigo: 'T001', activo: true },
  { id: '2', nombre: 'Manuel Blanco', email: 'manuel@winfin.es', rol: 'tecnico', codigo: 'T002', activo: true },
  { id: '3', nombre: 'Carlos García', email: 'carlos@winfin.es', rol: 'jefe_equipo', codigo: 'JE001', activo: true },
  { id: '4', nombre: 'Ana Martínez', email: 'ana@winfin.es', rol: 'supervisor_oficina', codigo: 'SO001', activo: true },
  { id: '5', nombre: 'Pedro López', email: 'pedro@winfin.es', rol: 'direccion', codigo: 'D001', activo: true },
];

// Mock festivos
const MOCK_FESTIVOS = [
  { id: '1', fecha: '2025-01-01', nombre: 'Año Nuevo', ambito: 'nacional' },
  { id: '2', fecha: '2025-01-06', nombre: 'Reyes Magos', ambito: 'nacional' },
  { id: '3', fecha: '2025-03-19', nombre: 'San José', ambito: 'autonomico' },
  { id: '4', fecha: '2025-05-01', nombre: 'Día del Trabajo', ambito: 'nacional' },
  { id: '5', fecha: '2025-05-02', nombre: 'Fiesta local', ambito: 'local' },
  { id: '6', fecha: '2025-08-15', nombre: 'Asunción de la Virgen', ambito: 'nacional' },
  { id: '7', fecha: '2025-10-12', nombre: 'Fiesta Nacional', ambito: 'nacional' },
  { id: '8', fecha: '2025-11-01', nombre: 'Todos los Santos', ambito: 'nacional' },
  { id: '9', fecha: '2025-12-06', nombre: 'Constitución', ambito: 'nacional' },
  { id: '10', fecha: '2025-12-08', nombre: 'Inmaculada Concepción', ambito: 'nacional' },
  { id: '11', fecha: '2025-12-25', nombre: 'Navidad', ambito: 'nacional' },
];

export default function ConfiguracionPage() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<ConfigTab>('tarifas');
  
  const tabs: { id: ConfigTab; label: string; icon: any }[] = [
    { id: 'tarifas', label: 'Tarifas', icon: Euro },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'proyectos', label: 'Proyectos', icon: Building2 },
    { id: 'festivos', label: 'Festivos', icon: Calendar },
    { id: 'general', label: 'General', icon: Settings },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Gestiona la configuración del sistema</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Contenido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {activeTab === 'tarifas' && <TarifasConfig />}
        {activeTab === 'usuarios' && <UsuariosConfig />}
        {activeTab === 'proyectos' && <ProyectosConfig />}
        {activeTab === 'festivos' && <FestivosConfig />}
        {activeTab === 'general' && <GeneralConfig />}
      </div>
    </div>
  );
}

// Componente de configuración de tarifas
function TarifasConfig() {
  // Convertir el Record a un array con el código incluido
  const tarifasArray = Object.entries(TARIFAS_POR_DEFECTO).map(([codigo, tarifa]) => ({
    codigo,
    ...tarifa,
  }));
  const [tarifas, setTarifas] = useState(tarifasArray);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setEditingId(null);
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tarifas del Sistema</h2>
          <p className="text-sm text-gray-600">Configura los importes por hora, dieta y kilometraje</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Concepto</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Importe</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Unidad</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {tarifas.map(tarifa => (
              <tr key={tarifa.codigo} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">{tarifa.concepto}</span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{tarifa.codigo}</td>
                <td className="py-3 px-4 text-right">
                  {editingId === tarifa.codigo ? (
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={tarifa.importe}
                      onChange={(e) => {
                        setTarifas(prev => prev.map(t =>
                          t.codigo === tarifa.codigo ? { ...t, importe: parseFloat(e.target.value) } : t
                        ));
                      }}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <span className="font-semibold text-gray-900">{formatearMoneda(tarifa.importe)}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">
                  /{tarifa.unidad}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => setEditingId(editingId === tarifa.codigo ? null : tarifa.codigo)}
                    className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
                  >
                    {editingId === tarifa.codigo ? <Check className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente de configuración de usuarios
function UsuariosConfig() {
  const [usuarios] = useState(MOCK_USUARIOS);
  const [busqueda, setBusqueda] = useState('');
  
  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  const rolLabels: Record<string, { label: string; color: string }> = {
    tecnico: { label: 'Técnico', color: 'bg-blue-100 text-blue-700' },
    jefe_equipo: { label: 'Jefe de Equipo', color: 'bg-purple-100 text-purple-700' },
    supervisor_oficina: { label: 'Supervisor', color: 'bg-green-100 text-green-700' },
    direccion: { label: 'Dirección', color: 'bg-orange-100 text-orange-700' },
    admin: { label: 'Administrador', color: 'bg-red-100 text-red-700' },
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-600">{usuarios.length} usuarios en el sistema</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>
      
      {/* Búsqueda */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
        />
      </div>
      
      {/* Lista */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="w-32"></th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(usuario => (
              <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{usuario.nombre}</p>
                    <p className="text-sm text-gray-500">{usuario.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{usuario.codigo}</td>
                <td className="py-3 px-4">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", rolLabels[usuario.rol].color)}>
                    {rolLabels[usuario.rol].label}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    usuario.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-primary rounded">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente de proyectos
function ProyectosConfig() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gestión de Proyectos</h2>
          <p className="text-sm text-gray-600">Administra los proyectos y clientes</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </div>
      
      <div className="text-center py-12 text-gray-500">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Aquí se gestionarán los proyectos...</p>
      </div>
    </div>
  );
}

// Componente de festivos
function FestivosConfig() {
  const [festivos] = useState(MOCK_FESTIVOS);
  const [año, setAño] = useState(2025);
  
  const ambitoColors: Record<string, string> = {
    nacional: 'bg-red-100 text-red-700',
    autonomico: 'bg-orange-100 text-orange-700',
    local: 'bg-blue-100 text-blue-700',
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Calendario de Festivos</h2>
          <p className="text-sm text-gray-600">Define los días festivos para el cálculo de tarifas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
            <Plus className="w-5 h-5" />
            Añadir Festivo
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {festivos.map(festivo => (
          <div key={festivo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{festivo.nombre}</p>
              <p className="text-sm text-gray-500">{festivo.fecha}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", ambitoColors[festivo.ambito])}>
                {festivo.ambito}
              </span>
              <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de configuración general
function GeneralConfig() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración General</h2>
      
      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la empresa
          </label>
          <input
            type="text"
            defaultValue="WINFIN Sistemas"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email de notificaciones
          </label>
          <input
            type="email"
            defaultValue="admin@winfin.es"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary" />
            <span className="text-sm text-gray-700">Enviar notificaciones por email cuando hay aprobaciones pendientes</span>
          </label>
        </div>
        
        <div>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary" />
            <span className="text-sm text-gray-700">Permitir a los técnicos ver sus propios informes</span>
          </label>
        </div>
        
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
          <Save className="w-5 h-5" />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}

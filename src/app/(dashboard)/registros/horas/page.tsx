'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Send,
  Trash2,
  Building2,
  Euro,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  FileEdit,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { formatearFecha, NOMBRES_MESES } from '@/lib/utils/fechas';
import { formatearMoneda, formatearHoras } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { EstadoAprobacion, TipoHora } from '@/types';
import { RegistroHorasForm } from '@/components/forms/RegistroHorasForm';
import { RegistroHorasInput } from '@/types/forms';

// Mock data
const MOCK_PROYECTOS = [
  { id: 'p1', codigo: 'MAD-001', nombre: 'Instalación Madrid Centro', cliente: 'Telefónica', activo: true },
  { id: 'p2', codigo: 'BCN-002', nombre: 'Mantenimiento Barcelona', cliente: 'Vodafone', activo: true },
  { id: 'p3', codigo: 'VAL-003', nombre: 'Ampliación Valencia', cliente: 'Orange', activo: true },
];

const MOCK_REGISTROS = [
  {
    id: '1',
    fecha: '2025-01-15',
    horaInicio: '18:00',
    horaFin: '21:30',
    horasExtras: 3.5,
    tipoHora: 'laborable' as TipoHora,
    proyectoId: 'p1',
    proyectoNombre: 'Instalación Madrid Centro',
    importeEstimado: 43.75,
    estadoHorasExtras: 'aprobado' as EstadoAprobacion,
    descripcion: 'Urgencia del cliente',
  },
  {
    id: '2',
    fecha: '2025-01-14',
    horaInicio: '09:00',
    horaFin: '14:00',
    horasExtras: 5,
    tipoHora: 'sabado' as TipoHora,
    proyectoId: 'p2',
    proyectoNombre: 'Mantenimiento Barcelona',
    importeEstimado: 90.00,
    estadoHorasExtras: 'pendiente' as EstadoAprobacion,
    descripcion: '',
  },
  {
    id: '3',
    fecha: '2025-01-10',
    horaInicio: '17:00',
    horaFin: '20:00',
    horasExtras: 3,
    tipoHora: 'laborable' as TipoHora,
    proyectoId: 'p1',
    proyectoNombre: 'Instalación Madrid Centro',
    importeEstimado: 37.50,
    estadoHorasExtras: 'borrador' as EstadoAprobacion,
    descripcion: 'Finalización de cableado',
  },
  {
    id: '4',
    fecha: '2025-01-08',
    horaInicio: '18:30',
    horaFin: '21:00',
    horasExtras: 2.5,
    tipoHora: 'laborable' as TipoHora,
    proyectoId: 'p3',
    proyectoNombre: 'Ampliación Valencia',
    importeEstimado: 31.25,
    estadoHorasExtras: 'rechazado' as EstadoAprobacion,
    descripcion: 'Revisión equipos',
    motivoRechazo: 'Faltan datos del proyecto',
  },
];

// Tipo explícito para registros de horas con motivoRechazo opcional
interface Registro {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  horasExtras: number;
  tipoHora: TipoHora;
  proyectoId: string;
  proyectoNombre: string;
  importeEstimado: number;
  estadoHorasExtras: EstadoAprobacion;
  descripcion: string;
  motivoRechazo?: string; // Opcional - solo presente cuando está rechazado
}

export default function RegistrosHorasPage() {
  const { userData } = useAuth();
  const [registros, setRegistros] = useState<Registro[]>(MOCK_REGISTROS);
  const [showForm, setShowForm] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoAprobacion | 'todos'>('todos');
  const [mesActual, setMesActual] = useState(new Date());
  
  // Filtrar registros
  const registrosFiltrados = registros.filter(r => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && r.estadoHorasExtras !== filtroEstado) {
      return false;
    }
    
    // Filtro por mes
    const fechaRegistro = new Date(r.fecha);
    if (fechaRegistro.getMonth() !== mesActual.getMonth() ||
        fechaRegistro.getFullYear() !== mesActual.getFullYear()) {
      return false;
    }
    
    return true;
  });
  
  // Calcular resumen del mes
  const resumenMes = {
    totalHoras: registrosFiltrados.reduce((sum, r) => sum + r.horasExtras, 0),
    totalImporte: registrosFiltrados.reduce((sum, r) => sum + r.importeEstimado, 0),
    aprobados: registrosFiltrados.filter(r => r.estadoHorasExtras === 'aprobado').length,
    pendientes: registrosFiltrados.filter(r => r.estadoHorasExtras === 'pendiente').length,
    borradores: registrosFiltrados.filter(r => r.estadoHorasExtras === 'borrador').length,
    rechazados: registrosFiltrados.filter(r => r.estadoHorasExtras === 'rechazado').length,
  };
  
  // Navegación de mes
  const navegarMes = (direccion: number) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + direccion);
    setMesActual(nuevoMes);
  };
  
  // Handlers de formulario
  const handleSubmit = async (data: RegistroHorasInput) => {
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingRegistro) {
      // Actualizar
      setRegistros(prev => prev.map(r =>
        r.id === editingRegistro.id
          ? { ...r, ...data }
          : r
      ));
    } else {
      // Crear nuevo
      const nuevoRegistro: Registro = {
        id: Date.now().toString(),
        fecha: data.fecha,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        proyectoId: data.proyectoId,
        tipoHora: data.tipoHora || 'laborable',
        horasExtras: 3, // Calcular desde horaInicio y horaFin
        proyectoNombre: MOCK_PROYECTOS.find(p => p.id === data.proyectoId)?.nombre || '',
        importeEstimado: 45,
        estadoHorasExtras: 'borrador' as EstadoAprobacion,
        descripcion: data.descripcion || '',
      };
      setRegistros(prev => [nuevoRegistro, ...prev]);
    }
    
    setShowForm(false);
    setEditingRegistro(null);
  };
  
  const handleEditar = (registro: Registro) => {
    setEditingRegistro(registro);
    setShowForm(true);
  };
  
  const handleEnviar = async (id: string) => {
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 300));
    setRegistros(prev => prev.map(r =>
      r.id === id ? { ...r, estadoHorasExtras: 'pendiente' as EstadoAprobacion } : r
    ));
  };
  
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    setRegistros(prev => prev.filter(r => r.id !== id));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Horas Extra</h1>
          <p className="text-gray-600">
            Registra y gestiona tus horas extra
          </p>
        </div>
        <button
          onClick={() => { setEditingRegistro(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Registro
        </button>
      </div>
      
      {/* Navegación de mes y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Navegación de mes */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {NOMBRES_MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
            </h2>
            <button
              onClick={() => navegarMes(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Filtro por estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoAprobacion | 'todos')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borradores</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
              <option value="devuelto">Devueltos</option>
            </select>
          </div>
        </div>
        
        {/* Resumen del mes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatearHoras(resumenMes.totalHoras)}</p>
            <p className="text-xs text-gray-500">Horas totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{formatearMoneda(resumenMes.totalImporte)}</p>
            <p className="text-xs text-gray-500">Importe estimado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{resumenMes.aprobados}</p>
            <p className="text-xs text-gray-500">Aprobados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{resumenMes.pendientes}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>
      </div>
      
      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingRegistro ? 'Editar Registro' : 'Nuevo Registro de Horas'}
              </h2>
              <RegistroHorasForm
                onSubmit={handleSubmit}
                initialData={editingRegistro ? {
                  fecha: editingRegistro.fecha,
                  horaInicio: editingRegistro.horaInicio,
                  horaFin: editingRegistro.horaFin,
                  proyectoId: editingRegistro.proyectoId,
                  descripcion: editingRegistro.descripcion,
                  tipoHora: editingRegistro.tipoHora,
                } : undefined}
                proyectos={MOCK_PROYECTOS as any}
                isEditing={!!editingRegistro}
                onCancel={() => { setShowForm(false); setEditingRegistro(null); }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de registros */}
      <div className="space-y-3">
        {registrosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay registros en este mes
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza registrando tus horas extra
            </p>
            <button
              onClick={() => { setEditingRegistro(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
            >
              <Plus className="w-5 h-5" />
              Nuevo Registro
            </button>
          </div>
        ) : (
          registrosFiltrados.map(registro => (
            <RegistroCard
              key={registro.id}
              registro={registro}
              onEditar={() => handleEditar(registro)}
              onEnviar={() => handleEnviar(registro.id)}
              onEliminar={() => handleEliminar(registro.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de registro
interface RegistroCardProps {
  registro: Registro;
  onEditar: () => void;
  onEnviar: () => void;
  onEliminar: () => void;
}

function RegistroCard({ registro, onEditar, onEnviar, onEliminar }: RegistroCardProps) {
  const estadoStyles: Record<EstadoAprobacion, { bg: string; text: string; icon: any }> = {
    borrador: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileEdit },
    pendiente: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
    aprobado: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    rechazado: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    devuelto: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: RotateCcw },
  };
  
  const tipoHoraStyles = {
    laborable: 'bg-blue-100 text-blue-700 border-blue-200',
    sabado: 'bg-purple-100 text-purple-700 border-purple-200',
    festivo: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  
  const tipoHoraLabels = {
    laborable: 'Laborable',
    sabado: 'Sábado',
    festivo: 'Festivo',
  };
  
  const estado = estadoStyles[registro.estadoHorasExtras];
  const EstadoIcon = estado.icon;
  
  const puedeEditar = ['borrador', 'devuelto'].includes(registro.estadoHorasExtras);
  const puedeEnviar = ['borrador', 'devuelto'].includes(registro.estadoHorasExtras);
  const puedeEliminar = registro.estadoHorasExtras === 'borrador';
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Indicador tipo de hora */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center border flex-shrink-0",
          tipoHoraStyles[registro.tipoHora]
        )}>
          <Clock className="w-6 h-6" />
        </div>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {formatearFecha(registro.fecha)}
                </h3>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  estado.bg, estado.text
                )}>
                  <EstadoIcon className="w-3 h-3" />
                  {registro.estadoHorasExtras === 'borrador' ? 'Borrador' :
                   registro.estadoHorasExtras === 'pendiente' ? 'Pendiente' :
                   registro.estadoHorasExtras === 'aprobado' ? 'Aprobado' :
                   registro.estadoHorasExtras === 'rechazado' ? 'Rechazado' : 'Devuelto'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {registro.horaInicio} - {registro.horaFin}
                <span className="mx-2">•</span>
                <span className="font-medium">{formatearHoras(registro.horasExtras)}</span>
                <span className="mx-2">•</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded", tipoHoraStyles[registro.tipoHora])}>
                  {tipoHoraLabels[registro.tipoHora]}
                </span>
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {formatearMoneda(registro.importeEstimado)}
              </p>
            </div>
          </div>
          
          {/* Proyecto */}
          {registro.proyectoNombre && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4 text-gray-400" />
              {registro.proyectoNombre}
            </div>
          )}
          
          {/* Descripción */}
          {registro.descripcion && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {registro.descripcion}
            </p>
          )}
          
          {/* Motivo de rechazo */}
          {registro.estadoHorasExtras === 'rechazado' && registro.motivoRechazo && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {registro.motivoRechazo}
            </div>
          )}
          
          {/* Acciones */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {puedeEditar && (
              <button
                onClick={onEditar}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
            {puedeEnviar && (
              <button
                onClick={onEnviar}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Enviar para aprobar
              </button>
            )}
            {puedeEliminar && (
              <button
                onClick={onEliminar}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

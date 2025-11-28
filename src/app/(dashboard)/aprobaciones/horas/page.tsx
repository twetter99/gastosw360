'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Check,
  X,
  RotateCcw,
  ChevronDown,
  Search,
  Filter,
  Eye,
  User,
  Building2,
  Calendar,
  Euro,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { formatearFecha } from '@/lib/utils/fechas';
import { formatearMoneda, formatearHoras } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { EstadoAprobacion, TipoHora } from '@/types';

// Mock data - en producción vendría de Firebase
const MOCK_PENDIENTES = [
  {
    id: '1',
    usuarioId: 'u1',
    usuarioNombre: 'Roberto Burgoa',
    usuarioCodigo: 'T001',
    fecha: '2025-01-15',
    horaInicio: '18:00',
    horaFin: '21:30',
    horasExtras: 3.5,
    tipoHora: 'laborable' as TipoHora,
    proyectoId: 'p1',
    proyectoNombre: 'Instalación Madrid Centro',
    importeEstimado: 43.75,
    estadoHorasExtras: 'pendiente' as EstadoAprobacion,
    observaciones: 'Urgencia del cliente, ampliación de instalación',
    enviadoAt: '2025-01-16T08:00:00',
  },
  {
    id: '2',
    usuarioId: 'u2',
    usuarioNombre: 'Manuel Blanco',
    usuarioCodigo: 'T002',
    fecha: '2025-01-14',
    horaInicio: '09:00',
    horaFin: '14:00',
    horasExtras: 5,
    tipoHora: 'sabado' as TipoHora,
    proyectoId: 'p2',
    proyectoNombre: 'Mantenimiento Barcelona',
    importeEstimado: 90.00,
    estadoHorasExtras: 'pendiente' as EstadoAprobacion,
    observaciones: '',
    enviadoAt: '2025-01-14T14:30:00',
  },
  {
    id: '3',
    usuarioId: 'u3',
    usuarioNombre: 'Carlos García',
    usuarioCodigo: 'T003',
    fecha: '2025-01-12',
    horaInicio: '10:00',
    horaFin: '18:00',
    horasExtras: 8,
    tipoHora: 'festivo' as TipoHora,
    proyectoId: 'p1',
    proyectoNombre: 'Instalación Madrid Centro',
    importeEstimado: 200.00,
    estadoHorasExtras: 'pendiente' as EstadoAprobacion,
    observaciones: 'Guardia urgente por avería',
    enviadoAt: '2025-01-12T20:00:00',
  },
];

type RegistroPendiente = typeof MOCK_PENDIENTES[0];

export default function AprobacionesHorasPage() {
  const { userData } = useAuth();
  const [pendientes, setPendientes] = useState<RegistroPendiente[]>(MOCK_PENDIENTES);
  const [loading, setLoading] = useState(false);
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionDialog, setActionDialog] = useState<{
    type: 'aprobar' | 'rechazar' | 'devolver' | null;
    registros: RegistroPendiente[];
  }>({ type: null, registros: [] });
  const [comentario, setComentario] = useState('');
  const [procesando, setProcesando] = useState(false);
  
  // Filtrar por técnico
  const pendientesFiltrados = pendientes.filter(p =>
    p.usuarioNombre.toLowerCase().includes(filtroTecnico.toLowerCase()) ||
    p.usuarioCodigo.toLowerCase().includes(filtroTecnico.toLowerCase())
  );
  
  // Selección múltiple
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedIds.length === pendientesFiltrados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendientesFiltrados.map(p => p.id));
    }
  };
  
  // Acciones masivas
  const handleAccionMasiva = (tipo: 'aprobar' | 'rechazar' | 'devolver') => {
    const registrosSeleccionados = pendientes.filter(p => selectedIds.includes(p.id));
    setActionDialog({ type: tipo, registros: registrosSeleccionados });
  };
  
  // Acción individual
  const handleAccionIndividual = (tipo: 'aprobar' | 'rechazar' | 'devolver', registro: RegistroPendiente) => {
    setActionDialog({ type: tipo, registros: [registro] });
  };
  
  // Confirmar acción
  const confirmarAccion = async () => {
    if (!actionDialog.type || actionDialog.registros.length === 0) return;
    
    setProcesando(true);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar estado local
      const ids = actionDialog.registros.map(r => r.id);
      setPendientes(prev => prev.filter(p => !ids.includes(p.id)));
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
      
      // Cerrar dialog
      setActionDialog({ type: null, registros: [] });
      setComentario('');
    } finally {
      setProcesando(false);
    }
  };
  
  // Calcular totales
  const totalHorasSeleccionadas = pendientes
    .filter(p => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.horasExtras, 0);
  const totalImporteSeleccionado = pendientes
    .filter(p => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.importeEstimado, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprobación de Horas Extra</h1>
          <p className="text-gray-600">
            {pendientes.length} registros pendientes de aprobación
          </p>
        </div>
      </div>
      
      {/* Barra de filtros y acciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por técnico..."
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Selección masiva */}
          {pendientesFiltrados.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedIds.length === pendientesFiltrados.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                Seleccionar todos
              </label>
              
              {selectedIds.length > 0 && (
                <>
                  <span className="text-sm text-gray-500">
                    ({selectedIds.length} seleccionados)
                  </span>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleAccionMasiva('aprobar')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleAccionMasiva('rechazar')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleAccionMasiva('devolver')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Devolver
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Resumen de selección */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Total horas:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {formatearHoras(totalHorasSeleccionadas)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total importe:</span>
                <span className="ml-2 font-semibold text-primary">
                  {formatearMoneda(totalImporteSeleccionado)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Lista de pendientes */}
      <div className="space-y-3">
        {pendientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay registros pendientes
            </h3>
            <p className="text-gray-600">
              Todos los registros de horas extra han sido procesados.
            </p>
          </div>
        ) : (
          pendientesFiltrados.map(registro => (
            <RegistroCard
              key={registro.id}
              registro={registro}
              isSelected={selectedIds.includes(registro.id)}
              onToggleSelect={() => toggleSelection(registro.id)}
              onAprobar={() => handleAccionIndividual('aprobar', registro)}
              onRechazar={() => handleAccionIndividual('rechazar', registro)}
              onDevolver={() => handleAccionIndividual('devolver', registro)}
            />
          ))
        )}
      </div>
      
      {/* Modal de confirmación */}
      {actionDialog.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
                actionDialog.type === 'aprobar' ? "bg-green-100" :
                actionDialog.type === 'rechazar' ? "bg-red-100" : "bg-orange-100"
              )}>
                {actionDialog.type === 'aprobar' ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : actionDialog.type === 'rechazar' ? (
                  <X className="w-6 h-6 text-red-600" />
                ) : (
                  <RotateCcw className="w-6 h-6 text-orange-600" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {actionDialog.type === 'aprobar' && 'Confirmar aprobación'}
                {actionDialog.type === 'rechazar' && 'Confirmar rechazo'}
                {actionDialog.type === 'devolver' && 'Devolver para corrección'}
              </h3>
              
              <p className="text-gray-600 text-center mb-4">
                {actionDialog.registros.length === 1 ? (
                  <>
                    ¿{actionDialog.type === 'aprobar' ? 'Aprobar' :
                       actionDialog.type === 'rechazar' ? 'Rechazar' : 'Devolver'} el registro de{' '}
                    <strong>{actionDialog.registros[0].usuarioNombre}</strong>?
                  </>
                ) : (
                  <>
                    Se {actionDialog.type === 'aprobar' ? 'aprobarán' :
                        actionDialog.type === 'rechazar' ? 'rechazarán' : 'devolverán'}{' '}
                    <strong>{actionDialog.registros.length} registros</strong>.
                  </>
                )}
              </p>
              
              {/* Comentario obligatorio para rechazo/devolución */}
              {(actionDialog.type === 'rechazar' || actionDialog.type === 'devolver') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo {actionDialog.type === 'rechazar' ? 'del rechazo' : 'de la devolución'} *
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    placeholder="Indica el motivo..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>
              )}
              
              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActionDialog({ type: null, registros: [] });
                    setComentario('');
                  }}
                  disabled={procesando}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAccion}
                  disabled={procesando || ((actionDialog.type === 'rechazar' || actionDialog.type === 'devolver') && !comentario.trim())}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 inline-flex items-center justify-center gap-2",
                    actionDialog.type === 'aprobar' ? "bg-green-600 hover:bg-green-700" :
                    actionDialog.type === 'rechazar' ? "bg-red-600 hover:bg-red-700" :
                    "bg-orange-600 hover:bg-orange-700"
                  )}
                >
                  {procesando ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {actionDialog.type === 'aprobar' && <Check className="w-5 h-5" />}
                      {actionDialog.type === 'rechazar' && <X className="w-5 h-5" />}
                      {actionDialog.type === 'devolver' && <RotateCcw className="w-5 h-5" />}
                    </>
                  )}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de tarjeta de registro
interface RegistroCardProps {
  registro: RegistroPendiente;
  isSelected: boolean;
  onToggleSelect: () => void;
  onAprobar: () => void;
  onRechazar: () => void;
  onDevolver: () => void;
}

function RegistroCard({
  registro,
  isSelected,
  onToggleSelect,
  onAprobar,
  onRechazar,
  onDevolver,
}: RegistroCardProps) {
  const tipoHoraStyles = {
    laborable: 'bg-blue-100 text-blue-700',
    sabado: 'bg-purple-100 text-purple-700',
    festivo: 'bg-orange-100 text-orange-700',
  };
  
  const tipoHoraLabels = {
    laborable: 'Laborable',
    sabado: 'Sábado',
    festivo: 'Festivo',
  };
  
  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border-2 transition-all",
      isSelected ? "border-primary" : "border-gray-200"
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          
          <div className="flex-1 min-w-0">
            {/* Nombre y código */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{registro.usuarioNombre}</h3>
                <p className="text-sm text-gray-500">{registro.usuarioCodigo}</p>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                tipoHoraStyles[registro.tipoHora]
              )}>
                {tipoHoraLabels[registro.tipoHora]}
              </span>
            </div>
            
            {/* Detalles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{formatearFecha(registro.fecha)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{registro.horaInicio} - {registro.horaFin}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{formatearHoras(registro.horasExtras)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Euro className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-primary">{formatearMoneda(registro.importeEstimado)}</span>
              </div>
            </div>
            
            {/* Proyecto */}
            {registro.proyectoNombre && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{registro.proyectoNombre}</span>
              </div>
            )}
            
            {/* Observaciones */}
            {registro.observaciones && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <MessageSquare className="w-4 h-4 text-gray-400 inline mr-2" />
                {registro.observaciones}
              </div>
            )}
          </div>
          
          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAprobar}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              title="Aprobar"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={onDevolver}
              className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
              title="Devolver"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onRechazar}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Rechazar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

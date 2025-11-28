'use client';

import { useState } from 'react';
import {
  Plus,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  Car,
  Hotel,
  Utensils,
  Fuel,
  ParkingCircle,
  MapPin,
  Image,
  File,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { formatearFecha, NOMBRES_MESES } from '@/lib/utils/fechas';
import { formatearMoneda } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { EstadoAprobacion, CategoriaGasto } from '@/types';
import { GastoForm } from '@/components/forms/GastoForm';

// Mock data
const MOCK_PROYECTOS = [
  { id: 'p1', codigo: 'MAD-001', nombre: 'Instalación Madrid Centro', cliente: 'Telefónica', activo: true },
  { id: 'p2', codigo: 'BCN-002', nombre: 'Mantenimiento Barcelona', cliente: 'Vodafone', activo: true },
  { id: 'p3', codigo: 'VAL-003', nombre: 'Ampliación Valencia', cliente: 'Orange', activo: true },
];

const MOCK_GASTOS = [
  {
    id: '1',
    fecha: '2025-01-15',
    categoria: 'dieta' as CategoriaGasto,
    descripcion: 'Dieta completa',
    importe: 55.80,
    proyectoId: 'p1',
    proyectoNombre: 'Instalación Madrid Centro',
    estadoGasto: 'aprobado' as EstadoAprobacion,
    tieneAdjunto: true,
  },
  {
    id: '2',
    fecha: '2025-01-14',
    categoria: 'kilometraje' as CategoriaGasto,
    descripcion: 'Desplazamiento Madrid-Barcelona',
    importe: 156.00,
    kilometros: 600,
    origen: 'Madrid',
    destino: 'Barcelona',
    proyectoId: 'p2',
    proyectoNombre: 'Mantenimiento Barcelona',
    estadoGasto: 'pendiente' as EstadoAprobacion,
    tieneAdjunto: false,
  },
  {
    id: '3',
    fecha: '2025-01-12',
    categoria: 'hotel' as CategoriaGasto,
    descripcion: 'Hotel NH Barcelona',
    importe: 89.00,
    proyectoId: 'p2',
    proyectoNombre: 'Mantenimiento Barcelona',
    estadoGasto: 'pendiente' as EstadoAprobacion,
    tieneAdjunto: true,
  },
  {
    id: '4',
    fecha: '2025-01-10',
    categoria: 'parking' as CategoriaGasto,
    descripcion: 'Parking centro comercial',
    importe: 8.50,
    proyectoId: 'p1',
    proyectoNombre: 'Instalación Madrid Centro',
    estadoGasto: 'borrador' as EstadoAprobacion,
    tieneAdjunto: true,
  },
  {
    id: '5',
    fecha: '2025-01-08',
    categoria: 'combustible' as CategoriaGasto,
    descripcion: 'Gasoil vehículo empresa',
    importe: 65.00,
    proyectoId: 'p1',
    proyectoNombre: 'Instalación Madrid Centro',
    estadoGasto: 'rechazado' as EstadoAprobacion,
    tieneAdjunto: false,
    motivoRechazo: 'Falta ticket del combustible',
  },
];

type Gasto = typeof MOCK_GASTOS[0];

const CATEGORIA_INFO: Record<CategoriaGasto, { icon: any; label: string; color: string }> = {
  dieta: { icon: Utensils, label: 'Dieta', color: 'bg-green-100 text-green-700 border-green-200' },
  kilometraje: { icon: Car, label: 'Kilometraje', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  combustible: { icon: Fuel, label: 'Combustible', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  hotel: { icon: Hotel, label: 'Hotel', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  parking: { icon: ParkingCircle, label: 'Parking', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  peaje: { icon: Receipt, label: 'Peaje', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  transporte_publico: { icon: Receipt, label: 'Transporte', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  comida: { icon: Utensils, label: 'Comida', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  material: { icon: Receipt, label: 'Material', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  otro: { icon: Receipt, label: 'Otro', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function GastosPage() {
  const { userData } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>(MOCK_GASTOS);
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoAprobacion | 'todos'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaGasto | 'todos'>('todos');
  const [mesActual, setMesActual] = useState(new Date());
  
  // Filtrar gastos
  const gastosFiltrados = gastos.filter(g => {
    if (filtroEstado !== 'todos' && g.estadoGasto !== filtroEstado) return false;
    if (filtroCategoria !== 'todos' && g.categoria !== filtroCategoria) return false;
    
    const fechaGasto = new Date(g.fecha);
    if (fechaGasto.getMonth() !== mesActual.getMonth() ||
        fechaGasto.getFullYear() !== mesActual.getFullYear()) {
      return false;
    }
    
    return true;
  });
  
  // Calcular resumen
  const resumenMes = {
    totalImporte: gastosFiltrados.reduce((sum, g) => sum + g.importe, 0),
    totalKm: gastosFiltrados.filter(g => g.categoria === 'kilometraje').reduce((sum, g) => sum + ((g as any).kilometros || 0), 0),
    aprobados: gastosFiltrados.filter(g => g.estadoGasto === 'aprobado').length,
    pendientes: gastosFiltrados.filter(g => g.estadoGasto === 'pendiente').length,
    borradores: gastosFiltrados.filter(g => g.estadoGasto === 'borrador').length,
  };
  
  // Navegación
  const navegarMes = (direccion: number) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + direccion);
    setMesActual(nuevoMes);
  };
  
  // Handlers
  const handleSubmit = async (data: any, adjuntos: File[]) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingGasto) {
      setGastos(prev => prev.map(g =>
        g.id === editingGasto.id ? { ...g, ...data, tieneAdjunto: adjuntos.length > 0 } : g
      ));
    } else {
      const nuevoGasto: Gasto = {
        id: Date.now().toString(),
        ...data,
        proyectoNombre: MOCK_PROYECTOS.find(p => p.id === data.proyectoId)?.nombre || '',
        estadoGasto: 'borrador' as EstadoAprobacion,
        tieneAdjunto: adjuntos.length > 0,
      };
      setGastos(prev => [nuevoGasto, ...prev]);
    }
    
    setShowForm(false);
    setEditingGasto(null);
  };
  
  const handleEditar = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setShowForm(true);
  };
  
  const handleEnviar = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setGastos(prev => prev.map(g =>
      g.id === id ? { ...g, estadoGasto: 'pendiente' as EstadoAprobacion } : g
    ));
  };
  
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    setGastos(prev => prev.filter(g => g.id !== id));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Gastos</h1>
          <p className="text-gray-600">Registra y gestiona tus gastos de trabajo</p>
        </div>
        <button
          onClick={() => { setEditingGasto(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Nuevo Gasto
        </button>
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Navegación de mes */}
          <div className="flex items-center gap-4">
            <button onClick={() => navegarMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {NOMBRES_MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
            </h2>
            <button onClick={() => navegarMes(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-3">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value as CategoriaGasto | 'todos')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todas las categorías</option>
              {Object.entries(CATEGORIA_INFO).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoAprobacion | 'todos')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borradores</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
            </select>
          </div>
        </div>
        
        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{formatearMoneda(resumenMes.totalImporte)}</p>
            <p className="text-xs text-gray-500">Total gastos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{resumenMes.totalKm} km</p>
            <p className="text-xs text-gray-500">Kilómetros</p>
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
      
      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <GastoForm
                onSubmit={handleSubmit}
                initialData={editingGasto ? {
                  fecha: editingGasto.fecha,
                  categoria: editingGasto.categoria,
                  descripcion: editingGasto.descripcion,
                  importe: editingGasto.importe,
                  kilometros: (editingGasto as any).kilometros,
                  origen: (editingGasto as any).origen,
                  destino: (editingGasto as any).destino,
                  proyectoId: editingGasto.proyectoId,
                } : undefined}
                proyectos={MOCK_PROYECTOS as any}
                isEditing={!!editingGasto}
                onCancel={() => { setShowForm(false); setEditingGasto(null); }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de gastos */}
      <div className="space-y-3">
        {gastosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay gastos en este mes</h3>
            <p className="text-gray-600 mb-4">Comienza registrando tus gastos</p>
            <button
              onClick={() => { setEditingGasto(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
            >
              <Plus className="w-5 h-5" />
              Nuevo Gasto
            </button>
          </div>
        ) : (
          gastosFiltrados.map(gasto => (
            <GastoCard
              key={gasto.id}
              gasto={gasto}
              onEditar={() => handleEditar(gasto)}
              onEnviar={() => handleEnviar(gasto.id)}
              onEliminar={() => handleEliminar(gasto.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Card de gasto
interface GastoCardProps {
  gasto: Gasto;
  onEditar: () => void;
  onEnviar: () => void;
  onEliminar: () => void;
}

function GastoCard({ gasto, onEditar, onEnviar, onEliminar }: GastoCardProps) {
  const catInfo = CATEGORIA_INFO[gasto.categoria];
  const CatIcon = catInfo.icon;
  
  const estadoStyles: Record<EstadoAprobacion, { bg: string; text: string; icon: any }> = {
    borrador: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileEdit },
    pendiente: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Receipt },
    aprobado: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    rechazado: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    devuelto: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: RotateCcw },
  };
  
  const estado = estadoStyles[gasto.estadoGasto];
  const EstadoIcon = estado.icon;
  
  const puedeEditar = ['borrador', 'devuelto'].includes(gasto.estadoGasto);
  const puedeEnviar = ['borrador', 'devuelto'].includes(gasto.estadoGasto);
  const puedeEliminar = gasto.estadoGasto === 'borrador';
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icono categoría */}
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center border flex-shrink-0", catInfo.color)}>
          <CatIcon className="w-6 h-6" />
        </div>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{gasto.descripcion}</h3>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", estado.bg, estado.text)}>
                  <EstadoIcon className="w-3 h-3" />
                  {gasto.estadoGasto === 'borrador' ? 'Borrador' :
                   gasto.estadoGasto === 'pendiente' ? 'Pendiente' :
                   gasto.estadoGasto === 'aprobado' ? 'Aprobado' :
                   gasto.estadoGasto === 'rechazado' ? 'Rechazado' : 'Devuelto'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {formatearFecha(gasto.fecha)}
                <span className="mx-2">•</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded", catInfo.color)}>{catInfo.label}</span>
                {gasto.tieneAdjunto && (
                  <>
                    <span className="mx-2">•</span>
                    <Image className="w-4 h-4 inline text-gray-400" />
                  </>
                )}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{formatearMoneda(gasto.importe)}</p>
              {gasto.categoria === 'kilometraje' && (gasto as any).kilometros && (
                <p className="text-xs text-gray-500">{(gasto as any).kilometros} km</p>
              )}
            </div>
          </div>
          
          {/* Origen-Destino para kilometraje */}
          {gasto.categoria === 'kilometraje' && (gasto as any).origen && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {(gasto as any).origen} → {(gasto as any).destino}
            </div>
          )}
          
          {/* Proyecto */}
          {gasto.proyectoNombre && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4 text-gray-400" />
              {gasto.proyectoNombre}
            </div>
          )}
          
          {/* Motivo rechazo */}
          {gasto.estadoGasto === 'rechazado' && (gasto as any).motivoRechazo && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {(gasto as any).motivoRechazo}
            </div>
          )}
          
          {/* Acciones */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {puedeEditar && (
              <button onClick={onEditar} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
            {puedeEnviar && (
              <button onClick={onEnviar} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-lg">
                <Send className="w-4 h-4" />
                Enviar para aprobar
              </button>
            )}
            {puedeEliminar && (
              <button onClick={onEliminar} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg ml-auto">
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

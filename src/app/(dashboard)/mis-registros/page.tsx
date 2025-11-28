'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  Receipt,
  Car,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileEdit,
  Euro,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { NOMBRES_MESES } from '@/lib/utils/fechas';
import { formatearMoneda, formatearHoras } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { EstadoAprobacion } from '@/types';
import TecnicoLayout from '@/components/layout/TecnicoLayout';

// Mock data - en producción vendría de Firebase
const MOCK_MIS_REGISTROS = {
  horas: [
    { id: 'h1', fecha: '2025-01-15', descripcion: '3h extras - Proyecto ABC', horas: 3, importe: 45, estado: 'aprobado' as EstadoAprobacion },
    { id: 'h2', fecha: '2025-01-12', descripcion: '2h nocturnas', horas: 2, importe: 40, estado: 'pendiente' as EstadoAprobacion },
    { id: 'h3', fecha: '2025-01-08', descripcion: '5h sábado', horas: 5, importe: 100, estado: 'aprobado' as EstadoAprobacion },
    { id: 'h4', fecha: '2025-01-05', descripcion: '4h festivo', horas: 4, importe: 120, estado: 'borrador' as EstadoAprobacion },
  ],
  gastos: [
    { id: 'g1', fecha: '2025-01-14', descripcion: 'Dieta completa', categoria: 'dieta', importe: 55.80, estado: 'aprobado' as EstadoAprobacion },
    { id: 'g2', fecha: '2025-01-13', descripcion: 'Hotel Barcelona', categoria: 'hotel', importe: 89.00, estado: 'pendiente' as EstadoAprobacion },
    { id: 'g3', fecha: '2025-01-10', descripcion: 'Parking cliente', categoria: 'parking', importe: 12.50, estado: 'rechazado' as EstadoAprobacion },
  ],
  desplazamientos: [
    { id: 'd1', fecha: '2025-01-15', descripcion: 'Madrid - Barcelona', km: 600, importe: 156.00, estado: 'pendiente' as EstadoAprobacion },
    { id: 'd2', fecha: '2025-01-10', descripcion: 'Gasoil', km: 0, importe: 65.00, estado: 'aprobado' as EstadoAprobacion },
  ],
};

const estadoConfig = {
  borrador: { label: 'Borrador', icon: FileEdit, className: 'bg-gray-100 text-gray-700' },
  pendiente: { label: 'Pendiente', icon: AlertCircle, className: 'bg-amber-100 text-amber-700' },
  aprobado: { label: 'Aprobado', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  rechazado: { label: 'Rechazado', icon: XCircle, className: 'bg-red-100 text-red-700' },
  devuelto: { label: 'Devuelto', icon: AlertCircle, className: 'bg-orange-100 text-orange-700' },
};

export default function MisRegistrosPage() {
  const { userData } = useAuth();
  const [mesActual, setMesActual] = useState(() => {
    const now = new Date();
    return { mes: now.getMonth(), año: now.getFullYear() };
  });

  const [tabActiva, setTabActiva] = useState<'horas' | 'gastos' | 'km'>('horas');

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    setMesActual(prev => {
      let nuevoMes = direccion === 'anterior' ? prev.mes - 1 : prev.mes + 1;
      let nuevoAño = prev.año;
      
      if (nuevoMes < 0) {
        nuevoMes = 11;
        nuevoAño--;
      } else if (nuevoMes > 11) {
        nuevoMes = 0;
        nuevoAño++;
      }
      
      return { mes: nuevoMes, año: nuevoAño };
    });
  };

  // Calcular totales
  const totales = useMemo(() => {
    const totalHoras = MOCK_MIS_REGISTROS.horas.reduce((sum, r) => sum + r.horas, 0);
    const importeHoras = MOCK_MIS_REGISTROS.horas.reduce((sum, r) => sum + r.importe, 0);
    const importeGastos = MOCK_MIS_REGISTROS.gastos.reduce((sum, r) => sum + r.importe, 0);
    const importeKm = MOCK_MIS_REGISTROS.desplazamientos.reduce((sum, r) => sum + r.importe, 0);
    const totalKm = MOCK_MIS_REGISTROS.desplazamientos.reduce((sum, r) => sum + r.km, 0);
    
    return {
      horas: totalHoras,
      importeHoras,
      gastos: importeGastos,
      km: totalKm,
      importeKm,
      total: importeHoras + importeGastos + importeKm,
    };
  }, []);

  const tabs = [
    { id: 'horas' as const, label: 'Horas', icon: Clock, count: MOCK_MIS_REGISTROS.horas.length },
    { id: 'gastos' as const, label: 'Gastos', icon: Receipt, count: MOCK_MIS_REGISTROS.gastos.length },
    { id: 'km' as const, label: 'Km', icon: Car, count: MOCK_MIS_REGISTROS.desplazamientos.length },
  ];

  return (
    <TecnicoLayout title="Mis registros" showBack backHref="/dashboard">
      <div className="max-w-2xl mx-auto px-4 py-4">

      {/* Selector de mes */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3 mb-6">
        <button
          onClick={() => cambiarMes('anterior')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-900 capitalize">
          {NOMBRES_MESES[mesActual.mes]} {mesActual.año}
        </span>
        <button
          onClick={() => cambiarMes('siguiente')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Resumen de totales */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>Horas extras</span>
          </div>
          <p className="text-2xl font-bold">{formatearHoras(totales.horas)}</p>
          <p className="text-sm text-blue-100">{formatearMoneda(totales.importeHoras)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
            <Receipt className="w-4 h-4" />
            <span>Gastos</span>
          </div>
          <p className="text-2xl font-bold">{formatearMoneda(totales.gastos)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-orange-100 text-sm mb-1">
            <Car className="w-4 h-4" />
            <span>Km / Combustible</span>
          </div>
          <p className="text-2xl font-bold">{totales.km} km</p>
          <p className="text-sm text-orange-100">{formatearMoneda(totales.importeKm)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 text-purple-100 text-sm mb-1">
            <Euro className="w-4 h-4" />
            <span>Total mes</span>
          </div>
          <p className="text-2xl font-bold">{formatearMoneda(totales.total)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors',
                tabActiva === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                tabActiva === tab.id ? 'bg-white/20' : 'bg-gray-200'
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de registros */}
      <div className="space-y-3">
        {tabActiva === 'horas' && MOCK_MIS_REGISTROS.horas.map((registro) => {
          const estado = estadoConfig[registro.estado];
          const EstadoIcon = estado.icon;
          return (
            <div key={registro.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{registro.descripcion}</p>
                  <p className="text-sm text-gray-500">{registro.fecha}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full flex items-center gap-1', estado.className)}>
                  <EstadoIcon className="w-3 h-3" />
                  {estado.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{formatearHoras(registro.horas)}</span>
                <span className="font-semibold text-gray-900">{formatearMoneda(registro.importe)}</span>
              </div>
            </div>
          );
        })}

        {tabActiva === 'gastos' && MOCK_MIS_REGISTROS.gastos.map((registro) => {
          const estado = estadoConfig[registro.estado];
          const EstadoIcon = estado.icon;
          return (
            <div key={registro.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{registro.descripcion}</p>
                  <p className="text-sm text-gray-500">{registro.fecha} · {registro.categoria}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full flex items-center gap-1', estado.className)}>
                  <EstadoIcon className="w-3 h-3" />
                  {estado.label}
                </span>
              </div>
              <div className="flex items-center justify-end">
                <span className="font-semibold text-gray-900">{formatearMoneda(registro.importe)}</span>
              </div>
            </div>
          );
        })}

        {tabActiva === 'km' && MOCK_MIS_REGISTROS.desplazamientos.map((registro) => {
          const estado = estadoConfig[registro.estado];
          const EstadoIcon = estado.icon;
          return (
            <div key={registro.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{registro.descripcion}</p>
                  <p className="text-sm text-gray-500">{registro.fecha}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full flex items-center gap-1', estado.className)}>
                  <EstadoIcon className="w-3 h-3" />
                  {estado.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                {registro.km > 0 && <span className="text-gray-500">{registro.km} km</span>}
                <span className="font-semibold text-gray-900 ml-auto">{formatearMoneda(registro.importe)}</span>
              </div>
            </div>
          );
        })}

        {/* Estado vacío */}
        {((tabActiva === 'horas' && MOCK_MIS_REGISTROS.horas.length === 0) ||
          (tabActiva === 'gastos' && MOCK_MIS_REGISTROS.gastos.length === 0) ||
          (tabActiva === 'km' && MOCK_MIS_REGISTROS.desplazamientos.length === 0)) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay registros para este mes</p>
          </div>
        )}
      </div>
    </div>
    </TecnicoLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Receipt,
  Euro,
  Calendar,
  Download,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { formatearMoneda, formatearHoras, formatearPorcentaje } from '@/lib/utils/formatters';
import { NOMBRES_MESES } from '@/lib/utils/fechas';
import { cn } from '@/lib/utils';

// Datos de ejemplo para la UI
const MOCK_KPIS = {
  año: 2025,
  
  // Horas
  totalHorasExtras: 1245.5,
  totalHorasExtrasLaborables: 856,
  totalHorasExtrasSabado: 234.5,
  totalHorasExtrasFestivo: 155,
  porcentajeHorasFestivo: 12.4,
  
  costeTotalHorasExtras: 18678.50,
  costeMedioHoraExtra: 15.00,
  costeMedioHoraLaborable: 12.50,
  costeMedioHoraSabado: 18.00,
  costeMedioHoraFestivo: 25.00,
  
  // Gastos
  costeTotalDietas: 12450,
  costeMedioDieta: 55.80,
  numeroDietas: 223,
  
  costeTotalKilometraje: 4520.60,
  totalKilometros: 17387,
  
  costeTotalHoteles: 8920,
  costeTotalOtrosGastos: 3250,
  costeTotalGastos: 29140.60,
  
  // Totales
  costeTotalAnual: 47819.10,
  costeMedioPorTecnico: 4781.91,
  costeMedioPorProyecto: 6831.30,
  
  // Variaciones
  variacionVsAñoAnterior: 8.5,
  
  // Rankings
  horasPorTecnico: [
    { usuarioId: '1', usuarioNombre: 'Roberto Burgoa', totalHoras: 245.5, totalImporte: 3682.50 },
    { usuarioId: '2', usuarioNombre: 'Manuel Blanco', totalHoras: 198, totalImporte: 2970.00 },
    { usuarioId: '3', usuarioNombre: 'Carlos García', totalHoras: 167.5, totalImporte: 2512.50 },
    { usuarioId: '4', usuarioNombre: 'Ana Martínez', totalHoras: 145, totalImporte: 2175.00 },
    { usuarioId: '5', usuarioNombre: 'Pedro López', totalHoras: 132, totalImporte: 1980.00 },
  ],
  
  gastosPorCategoria: [
    { categoria: 'dieta', nombre: 'Dietas', total: 12450, cantidad: 223 },
    { categoria: 'hotel', nombre: 'Hoteles', total: 8920, cantidad: 45 },
    { categoria: 'kilometraje', nombre: 'Kilometraje', total: 4520.60, cantidad: 189 },
    { categoria: 'parking', nombre: 'Parking', total: 1850, cantidad: 156 },
    { categoria: 'peaje', nombre: 'Peajes', total: 890, cantidad: 78 },
    { categoria: 'otro', nombre: 'Otros', total: 510, cantidad: 23 },
  ],
  
  evolucionMensual: [
    { mes: 1, horasExtras: 1250, gastos: 2100, total: 3350 },
    { mes: 2, horasExtras: 1450, gastos: 2300, total: 3750 },
    { mes: 3, horasExtras: 1680, gastos: 2450, total: 4130 },
    { mes: 4, horasExtras: 1520, gastos: 2200, total: 3720 },
    { mes: 5, horasExtras: 1890, gastos: 2650, total: 4540 },
    { mes: 6, horasExtras: 1750, gastos: 2500, total: 4250 },
    { mes: 7, horasExtras: 1420, gastos: 2100, total: 3520 },
    { mes: 8, horasExtras: 980, gastos: 1800, total: 2780 },
    { mes: 9, horasExtras: 1650, gastos: 2400, total: 4050 },
    { mes: 10, horasExtras: 1820, gastos: 2600, total: 4420 },
    { mes: 11, horasExtras: 1568.50, gastos: 2540.60, total: 4108.10 },
    { mes: 12, horasExtras: 0, gastos: 0, total: 0 },
  ],
};

export default function KPIsPage() {
  const { userData } = useAuth();
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState(MOCK_KPIS);
  
  const años = [2025, 2024, 2023];
  
  const handleRefresh = async () => {
    setLoading(true);
    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPIs y Analíticas</h1>
          <p className="text-gray-600">
            Resumen ejecutivo de horas y gastos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector de año */}
          <div className="relative">
            <select
              value={añoSeleccionado}
              onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {años.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualizar
          </button>
          
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
      
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Coste Total Anual"
          value={formatearMoneda(kpis.costeTotalAnual)}
          subtitle={`${añoSeleccionado}`}
          icon={Euro}
          trend={kpis.variacionVsAñoAnterior}
          trendLabel="vs año anterior"
          color="blue"
        />
        <KPICard
          title="Total Horas Extras"
          value={formatearHoras(kpis.totalHorasExtras)}
          subtitle={formatearMoneda(kpis.costeTotalHorasExtras)}
          icon={Clock}
          color="purple"
        />
        <KPICard
          title="Total Gastos"
          value={formatearMoneda(kpis.costeTotalGastos)}
          subtitle={`${kpis.numeroDietas} dietas registradas`}
          icon={Receipt}
          color="green"
        />
        <KPICard
          title="Coste Medio/Técnico"
          value={formatearMoneda(kpis.costeMedioPorTecnico)}
          subtitle="10 técnicos activos"
          icon={Users}
          color="orange"
        />
      </div>
      
      {/* Desglose de horas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horas por tipo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Desglose de Horas Extra
          </h3>
          <div className="space-y-4">
            <HorasBar
              label="Laborables"
              horas={kpis.totalHorasExtrasLaborables}
              importe={kpis.totalHorasExtrasLaborables * kpis.costeMedioHoraLaborable}
              total={kpis.totalHorasExtras}
              color="bg-blue-500"
            />
            <HorasBar
              label="Sábados"
              horas={kpis.totalHorasExtrasSabado}
              importe={kpis.totalHorasExtrasSabado * kpis.costeMedioHoraSabado}
              total={kpis.totalHorasExtras}
              color="bg-purple-500"
            />
            <HorasBar
              label="Festivos"
              horas={kpis.totalHorasExtrasFestivo}
              importe={kpis.totalHorasExtrasFestivo * kpis.costeMedioHoraFestivo}
              total={kpis.totalHorasExtras}
              color="bg-orange-500"
            />
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearMoneda(kpis.costeMedioHoraLaborable)}
                </p>
                <p className="text-xs text-gray-500">€/h laborable</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearMoneda(kpis.costeMedioHoraSabado)}
                </p>
                <p className="text-xs text-gray-500">€/h sábado</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatearMoneda(kpis.costeMedioHoraFestivo)}
                </p>
                <p className="text-xs text-gray-500">€/h festivo</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Gastos por categoría */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Gastos por Categoría
          </h3>
          <div className="space-y-3">
            {kpis.gastosPorCategoria.map((cat, idx) => (
              <div key={cat.categoria} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORES_CATEGORIAS[idx % COLORES_CATEGORIAS.length] }}
                  />
                  <span className="text-sm text-gray-700">{cat.nombre}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatearMoneda(cat.total)}
                  </p>
                  <p className="text-xs text-gray-500">{cat.cantidad} registros</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Gastos</span>
              <span className="text-lg font-bold text-gray-900">
                {formatearMoneda(kpis.costeTotalGastos)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ranking de técnicos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 5 Técnicos por Horas Extra
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Técnico</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Horas</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Importe</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">% Total</th>
              </tr>
            </thead>
            <tbody>
              {kpis.horasPorTecnico.map((tecnico, idx) => (
                <tr key={tecnico.usuarioId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                      idx === 0 ? "bg-yellow-100 text-yellow-700" :
                      idx === 1 ? "bg-gray-100 text-gray-700" :
                      idx === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-500"
                    )}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{tecnico.usuarioNombre}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatearHoras(tecnico.totalHoras)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {formatearMoneda(tecnico.totalImporte)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatearPorcentaje((tecnico.totalHoras / kpis.totalHorasExtras) * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Evolución mensual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Evolución Mensual {añoSeleccionado}
        </h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {kpis.evolucionMensual.map((mes, idx) => {
            const maxTotal = Math.max(...kpis.evolucionMensual.map(m => m.total));
            const heightPercent = maxTotal > 0 ? (mes.total / maxTotal) * 100 : 0;
            const horasPercent = mes.total > 0 ? (mes.horasExtras / mes.total) * 100 : 0;
            
            return (
              <div key={mes.mes} className="flex-1 flex flex-col items-center">
                <div className="w-full h-48 flex flex-col justify-end">
                  <div 
                    className="w-full rounded-t-md overflow-hidden transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                    title={`Total: ${formatearMoneda(mes.total)}`}
                  >
                    <div 
                      className="bg-blue-500 w-full" 
                      style={{ height: `${horasPercent}%` }}
                    />
                    <div 
                      className="bg-green-500 w-full"
                      style={{ height: `${100 - horasPercent}%` }}
                    />
                  </div>
                </div>
                <span className="mt-2 text-xs text-gray-500">
                  {NOMBRES_MESES[idx].substring(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600">Horas Extra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-sm text-gray-600">Gastos</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
const COLORES_CATEGORIAS = [
  '#3B82F6', // blue
  '#10B981', // green  
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#6B7280', // gray
];

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function KPICard({ title, value, subtitle, icon: Icon, trend, trendLabel, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend >= 0 ? "text-red-600" : "text-green-600"
            )}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">{trendLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface HorasBarProps {
  label: string;
  horas: number;
  importe: number;
  total: number;
  color: string;
}

function HorasBar({ label, horas, importe, total, color }: HorasBarProps) {
  const porcentaje = total > 0 ? (horas / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">
          {formatearHoras(horas)} ({formatearPorcentaje(porcentaje)})
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">
        {formatearMoneda(importe)}
      </p>
    </div>
  );
}

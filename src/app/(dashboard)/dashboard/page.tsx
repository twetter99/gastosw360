'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Receipt,
  TrendingUp,
  TrendingDown,
  Euro,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { formatearMoneda, formatearHoras } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import DashboardTecnico from '@/components/dashboard/DashboardTecnico';

// Datos de ejemplo (en producción vendrían de Firebase)
const MOCK_STATS = {
  horasExtrasMes: 24.5,
  horasExtrasAñoAnterior: 22,
  gastosMes: 485.50,
  gastosAñoAnterior: 420,
  pendientesAprobacion: 3,
  totalAprobadoMes: 1250.75,
};

const MOCK_REGISTROS_RECIENTES = [
  { id: '1', fecha: '2025-11-25', tipo: 'horas', descripcion: '3h extras - Proyecto ABC', importe: 45, estado: 'pendiente' },
  { id: '2', fecha: '2025-11-24', tipo: 'gasto', descripcion: 'Dieta completa', importe: 60, estado: 'aprobado' },
  { id: '3', fecha: '2025-11-23', tipo: 'horas', descripcion: '2h extras + nocturnidad', importe: 80, estado: 'aprobado' },
  { id: '4', fecha: '2025-11-22', tipo: 'gasto', descripcion: 'Parking cliente', importe: 12.50, estado: 'pendiente' },
];

const MOCK_PENDIENTES_APROBAR = [
  { id: '1', usuario: 'Juan García', tipo: 'horas', descripcion: '4h extras', importe: 60, fecha: '2025-11-25' },
  { id: '2', usuario: 'María López', tipo: 'gasto', descripcion: 'Hotel Barcelona', importe: 89, fecha: '2025-11-24' },
  { id: '3', usuario: 'Carlos Ruiz', tipo: 'horas', descripcion: '2h extras festivo', importe: 50, fecha: '2025-11-24' },
];

export default function DashboardPage() {
  const { userData, isJefeEquipo, isSupervisor } = useAuth();
  const [mesActual] = useState(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(now);
  });

  const calcularVariacion = (actual: number, anterior: number) => {
    if (anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  };

  const variacionHoras = calcularVariacion(MOCK_STATS.horasExtrasMes, MOCK_STATS.horasExtrasAñoAnterior);
  const variacionGastos = calcularVariacion(MOCK_STATS.gastosMes, MOCK_STATS.gastosAñoAnterior);

  // Si es técnico, mostrar dashboard simplificado mobile-first
  if (userData?.rol === 'tecnico') {
    return <DashboardTecnico />;
  }

  return (
    <div className="space-y-6">
      {/* Saludo y acciones rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {userData?.nombre}!
          </h1>
          <p className="text-gray-600">
            Resumen de {mesActual}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/registros/horas/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar horas
          </Link>
          <Link
            href="/registros/gastos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo gasto
          </Link>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Horas extras"
          value={formatearHoras(MOCK_STATS.horasExtrasMes)}
          subtitle="este mes"
          icon={Clock}
          trend={variacionHoras}
          trendLabel="vs mes anterior"
        />
        <StatCard
          title="Gastos"
          value={formatearMoneda(MOCK_STATS.gastosMes)}
          subtitle="este mes"
          icon={Receipt}
          trend={variacionGastos}
          trendLabel="vs mes anterior"
        />
        <StatCard
          title="Total aprobado"
          value={formatearMoneda(MOCK_STATS.totalAprobadoMes)}
          subtitle="este mes"
          icon={Euro}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Pendientes"
          value={MOCK_STATS.pendientesAprobacion.toString()}
          subtitle="registros por aprobar"
          icon={AlertCircle}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos registros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Mis últimos registros</h2>
            <Link
              href="/registros/horas"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {MOCK_REGISTROS_RECIENTES.map((registro) => (
              <div key={registro.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      registro.tipo === 'horas' ? "bg-blue-100" : "bg-green-100"
                    )}>
                      {registro.tipo === 'horas' ? (
                        <Clock className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Receipt className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {registro.descripcion}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(registro.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatearMoneda(registro.importe)}
                    </p>
                    <span className={cn(
                      "inline-flex px-2 py-0.5 text-xs font-medium rounded-full",
                      registro.estado === 'aprobado' 
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    )}>
                      {registro.estado === 'aprobado' ? 'Aprobado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pendientes de aprobar (solo para jefes y supervisores) */}
        {(isJefeEquipo || isSupervisor) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Pendientes de aprobar</h2>
              <Link
                href="/aprobaciones/horas"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {MOCK_PENDIENTES_APROBAR.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.usuario}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.descripcion} • {new Date(item.fecha).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatearMoneda(item.importe)}
                      </p>
                      <div className="flex gap-1">
                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Si no es aprobador, mostrar calendario resumen */}
        {!isJefeEquipo && !isSupervisor && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Resumen semanal</h2>
              <Link
                href="/calendario"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                Ver calendario <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dia, idx) => (
                  <div key={dia} className="text-xs font-medium text-gray-500 py-2">
                    {dia}
                  </div>
                ))}
                {[...Array(7)].map((_, idx) => {
                  const hasData = idx < 5; // Simular que hay datos L-V
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center text-sm",
                        hasData 
                          ? "bg-primary/10 text-primary font-medium cursor-pointer hover:bg-primary/20" 
                          : "bg-gray-50 text-gray-400"
                      )}
                    >
                      {20 + idx}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total semana:</span>
                  <span className="font-semibold text-gray-900">{formatearHoras(12.5)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de estadísticas
interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
  trend, 
  trendLabel 
}: StatCardProps) {
  const isPositive = trend && trend > 0;
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? '+' : ''}{trend.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">{trendLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

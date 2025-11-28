'use client';

import Link from 'next/link';
import { Clock, Receipt, Car, ChevronRight, CheckCircle2, Clock3, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import TecnicoLayout from '@/components/layout/TecnicoLayout';
import { cn } from '@/lib/utils';

// Helper para obtener el periodo actual (YYYY-MM)
function getCurrentPeriodo() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Hook para obtener resumen del mes
function useResumenMes(userId: string | undefined) {
  return useQuery({
    queryKey: ['resumen-mes', userId, getCurrentPeriodo()],
    queryFn: async () => {
      if (!userId) return null;
      
      const periodo = getCurrentPeriodo();
      
      // Consultar horas del mes
      const horasRef = collection(db, 'horasExtras');
      const horasQuery = query(
        horasRef,
        where('usuarioId', '==', userId),
        where('periodo', '==', periodo)
      );
      const horasSnap = await getDocs(horasQuery);
      
      let totalHoras = 0;
      let horasPendientes = 0;
      let horasAprobadas = 0;
      
      horasSnap.docs.forEach(doc => {
        const data = doc.data();
        totalHoras += data.horas || 0;
        if (data.estado === 'pendiente') horasPendientes++;
        if (data.estado === 'aprobado') horasAprobadas++;
      });

      // Consultar gastos del mes
      const gastosRef = collection(db, 'gastos');
      const gastosQuery = query(
        gastosRef,
        where('usuarioId', '==', userId),
        where('periodo', '==', periodo)
      );
      const gastosSnap = await getDocs(gastosQuery);
      
      let totalGastos = 0;
      let gastosPendientes = 0;
      let gastosAprobados = 0;
      
      gastosSnap.docs.forEach(doc => {
        const data = doc.data();
        totalGastos += data.importe || 0;
        if (data.estado === 'pendiente') gastosPendientes++;
        if (data.estado === 'aprobado') gastosAprobados++;
      });

      return {
        horas: {
          total: totalHoras,
          pendientes: horasPendientes,
          aprobadas: horasAprobadas,
        },
        gastos: {
          total: totalGastos,
          pendientes: gastosPendientes,
          aprobados: gastosAprobados,
        },
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export default function DashboardTecnico() {
  const { userData, user } = useAuth();
  const { data: resumen, isLoading: loadingResumen } = useResumenMes(user?.uid);
  
  const currentMonth = new Intl.DateTimeFormat('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  // Hora del día para saludo personalizado
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <TecnicoLayout>
      <div className="flex flex-col px-4 py-6 max-w-lg mx-auto">
        {/* Saludo principal */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {saludo}, {userData?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500">
            ¿Qué quieres registrar hoy?
          </p>
        </div>

        {/* Botones de acción principales */}
        <div className="space-y-3 mb-6">
          {/* Registrar horas extras */}
          <Link
            href="/registros/horas/nuevo"
            className="flex items-center gap-4 w-full p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] touch-manipulation"
          >
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block text-lg font-semibold">Registrar horas extras</span>
              <span className="block text-sm text-blue-100 truncate">Nocturnas, festivos, sábados...</span>
            </div>
            <ChevronRight className="w-6 h-6 text-white/70 flex-shrink-0" />
          </Link>

          {/* Añadir gasto */}
          <Link
            href="/registros/gastos/nuevo"
            className="flex items-center gap-4 w-full p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] touch-manipulation"
          >
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Receipt className="w-7 h-7" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block text-lg font-semibold">Añadir gasto</span>
              <span className="block text-sm text-emerald-100 truncate">Dietas, hotel, parking...</span>
            </div>
            <ChevronRight className="w-6 h-6 text-white/70 flex-shrink-0" />
          </Link>

          {/* Registrar km / combustible */}
          <Link
            href="/registros/gastos/nuevo?tipo=desplazamiento"
            className="flex items-center gap-4 w-full p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] touch-manipulation"
          >
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Car className="w-7 h-7" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block text-lg font-semibold">Registrar km / combustible</span>
              <span className="block text-sm text-orange-100 truncate">Desplazamientos en vehículo</span>
            </div>
            <ChevronRight className="w-6 h-6 text-white/70 flex-shrink-0" />
          </Link>
        </div>

        {/* Resumen del mes - Card con datos reales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header del resumen */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Mi resumen del mes</h2>
              <span className="text-sm text-gray-500 capitalize">{currentMonth}</span>
            </div>
          </div>

          {/* Stats del mes */}
          {loadingResumen ? (
            <div className="p-5 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : resumen ? (
            <div className="p-4 space-y-4">
              {/* Horas */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Horas extras</p>
                    <p className="text-xl font-bold text-gray-900">{resumen.horas.total}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {resumen.horas.pendientes > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      <Clock3 className="w-3 h-3" />
                      {resumen.horas.pendientes}
                    </span>
                  )}
                  {resumen.horas.aprobadas > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {resumen.horas.aprobadas}
                    </span>
                  )}
                </div>
              </div>

              {/* Gastos */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gastos</p>
                    <p className="text-xl font-bold text-gray-900">
                      {new Intl.NumberFormat('es-ES', { 
                        style: 'currency', 
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(resumen.gastos.total)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {resumen.gastos.pendientes > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      <Clock3 className="w-3 h-3" />
                      {resumen.gastos.pendientes}
                    </span>
                  )}
                  {resumen.gastos.aprobados > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {resumen.gastos.aprobados}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Sin registros este mes</p>
            </div>
          )}

          {/* Link a detalle */}
          <Link
            href="/mis-registros"
            className="flex items-center justify-between w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-100"
          >
            <span className="font-medium text-gray-700">Ver todos mis registros</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>

        {/* Leyenda estados */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock3 className="w-3 h-3 text-amber-500" /> Pendiente
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" /> Aprobado
          </span>
        </div>
      </div>
    </TecnicoLayout>
  );
}

'use client';

import Link from 'next/link';
import { Clock, Receipt, Car, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';

export default function DashboardTecnico() {
  const { userData } = useAuth();
  
  const currentMonth = new Intl.DateTimeFormat('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col px-4 py-6 max-w-lg mx-auto">
      {/* Saludo principal */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Hola, {userData?.nombre} 👋
        </h1>
        <p className="text-gray-600 text-lg">
          ¿En qué te puedo ayudar hoy?
        </p>
      </div>

      {/* Botones de acción principales */}
      <div className="flex-1 space-y-4 mb-8">
        {/* Registrar horas extras */}
        <Link
          href="/registros/horas"
          className="flex items-center gap-4 w-full p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div className="flex-1 text-left">
            <span className="block text-lg font-semibold">Registrar horas extras</span>
            <span className="block text-sm text-blue-100">Nocturnas, festivos, sábados...</span>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70" />
        </Link>

        {/* Añadir gasto */}
        <Link
          href="/registros/gastos"
          className="flex items-center gap-4 w-full p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Receipt className="w-7 h-7" />
          </div>
          <div className="flex-1 text-left">
            <span className="block text-lg font-semibold">Añadir gasto</span>
            <span className="block text-sm text-emerald-100">Dietas, hotel, parking...</span>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70" />
        </Link>

        {/* Registrar km / combustible */}
        <Link
          href="/registros/gastos?tipo=desplazamiento"
          className="flex items-center gap-4 w-full p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Car className="w-7 h-7" />
          </div>
          <div className="flex-1 text-left">
            <span className="block text-lg font-semibold">Registrar km / combustible</span>
            <span className="block text-sm text-orange-100">Desplazamientos en vehículo</span>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70" />
        </Link>
      </div>

      {/* Resumen del mes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Mi resumen del mes</h2>
              <p className="text-sm text-gray-500 capitalize">{currentMonth}</p>
            </div>
          </div>
        </div>

        <Link
          href="/mis-registros"
          className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-700">Ver todos mis registros</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Ayuda rápida */}
      <p className="text-center text-sm text-gray-400 mt-6">
        ¿Dudas? Contacta con tu supervisor
      </p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Clock, Receipt, Car, ChevronRight } from 'lucide-react';
import TecnicoLayout from '@/components/layout/TecnicoLayout';

export default function RegistrosPage() {
  return (
    <TecnicoLayout title="Nuevo registro" showBack backHref="/dashboard">
      <div className="flex flex-col px-4 py-6 max-w-lg mx-auto">
        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            ¿Qué quieres registrar?
          </h1>
          <p className="text-gray-500 text-sm">
            Selecciona el tipo de registro
          </p>
        </div>

        {/* Opciones de registro */}
        <div className="space-y-3">
          {/* Horas extras */}
          <Link
            href="/registros/horas/nuevo"
            className="flex items-center gap-4 w-full p-5 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl transition-all active:scale-[0.98] touch-manipulation"
          >
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block text-lg font-semibold text-gray-900">Horas extras</span>
              <span className="block text-sm text-gray-500 truncate">Nocturnas, festivos, sábados...</span>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
          </Link>

          {/* Gasto */}
          <Link
            href="/registros/gastos/nuevo"
            className="flex items-center gap-4 w-full p-5 bg-white border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-2xl transition-all active:scale-[0.98] touch-manipulation"
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Receipt className="w-7 h-7" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block text-lg font-semibold text-gray-900">Gasto</span>
              <span className="block text-sm text-gray-500 truncate">Dietas, hotel, parking, material...</span>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
          </Link>

          {/* Kilometraje */}
          <Link
            href="/registros/gastos/nuevo?tipo=desplazamiento"
            className="flex items-center gap-4 w-full p-5 bg-white border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 rounded-2xl transition-all active:scale-[0.98] touch-manipulation"
          >
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Car className="w-7 h-7" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block text-lg font-semibold text-gray-900">Kilometraje / Combustible</span>
              <span className="block text-sm text-gray-500 truncate">Desplazamientos en vehículo</span>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
          </Link>
        </div>

        {/* Acceso rápido a historial */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/mis-registros"
            className="flex items-center justify-center gap-2 w-full py-3 text-primary font-medium hover:underline"
          >
            Ver mis registros anteriores
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </TecnicoLayout>
  );
}

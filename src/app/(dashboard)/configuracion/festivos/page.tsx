'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, X, Loader2, Calendar, CalendarDays } from 'lucide-react';
import { useFestivos } from '@/hooks/useFirebase';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface FestivoForm {
  nombre: string;
  fecha: string;
  tipo: 'nacional' | 'autonomico' | 'local';
  descripcion: string;
}

const initialForm: FestivoForm = {
  nombre: '',
  fecha: '',
  tipo: 'nacional',
  descripcion: '',
};

const tiposFestivo = [
  { value: 'nacional', label: 'Nacional', color: 'bg-red-100 text-red-700' },
  { value: 'autonomico', label: 'Autonómico', color: 'bg-orange-100 text-orange-700' },
  { value: 'local', label: 'Local', color: 'bg-blue-100 text-blue-700' },
];

export default function FestivosPage() {
  const { data: festivos, loading, create, update, delete: eliminar } = useFestivos();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FestivoForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const festivosFiltrados = festivos
    .filter((f: any) => f.fecha?.startsWith(yearFilter))
    .sort((a: any, b: any) => (a.fecha || '').localeCompare(b.fecha || ''));

  const openModal = (festivo?: any) => {
    if (festivo) {
      setEditingId(festivo.id);
      setForm({
        nombre: festivo.nombre || '',
        fecha: festivo.fecha || '',
        tipo: festivo.tipo || 'nacional',
        descripcion: festivo.descripcion || '',
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.fecha) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await update(editingId, form);
      } else {
        await create(form);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eliminar(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getTipoInfo = (tipo: string) => {
    return tiposFestivo.find(t => t.value === tipo) || tiposFestivo[0];
  };

  const formatFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), "EEEE, d 'de' MMMM", { locale: es });
    } catch {
      return fecha;
    }
  };

  if (loading && festivos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Días Festivos</h1>
          <p className="text-gray-600">Calendario de días no laborables</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Festivo
        </button>
      </div>

      {/* Year Filter */}
      <div className="flex gap-2">
        {years.map(year => (
          <button
            key={year}
            onClick={() => setYearFilter(year.toString())}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              yearFilter === year.toString()
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {festivosFiltrados.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No hay festivos configurados para {yearFilter}</p>
          <button onClick={() => openModal()} className="mt-4 text-primary hover:underline">
            Añadir festivo
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {festivosFiltrados.map((festivo: any) => {
            const tipoInfo = getTipoInfo(festivo.tipo);
            return (
              <div key={festivo.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{festivo.nombre}</h3>
                      <p className="text-sm text-gray-500 capitalize">{formatFecha(festivo.fecha)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openModal(festivo)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(festivo.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${tipoInfo.color}`}>
                    {tipoInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Festivo' : 'Nuevo Festivo'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Día de la Constitución"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({...form, fecha: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({...form, tipo: e.target.value as FestivoForm['tipo']})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  {tiposFestivo.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({...form, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar festivo?</h3>
            <p className="text-gray-600 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

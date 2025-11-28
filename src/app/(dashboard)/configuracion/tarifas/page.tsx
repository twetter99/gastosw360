'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, X, Loader2, Euro, Clock, Car } from 'lucide-react';
import { useTarifas } from '@/hooks/queries/compat';
import { toast } from 'sonner';

interface TarifaForm {
  nombre: string;
  tipo: 'hora_normal' | 'hora_extra' | 'hora_festivo' | 'dieta' | 'kilometraje';
  valor: number;
  descripcion: string;
  activo: boolean;
}

const initialForm: TarifaForm = {
  nombre: '',
  tipo: 'hora_normal',
  valor: 0,
  descripcion: '',
  activo: true,
};

const tiposTarifa = [
  { value: 'hora_normal', label: 'Hora Normal', icon: Clock },
  { value: 'hora_extra', label: 'Hora Extra', icon: Clock },
  { value: 'hora_festivo', label: 'Hora Festivo', icon: Clock },
  { value: 'dieta', label: 'Dieta', icon: Euro },
  { value: 'kilometraje', label: 'Kilometraje', icon: Car },
];

export default function TarifasPage() {
  const { data: tarifas, loading, create, update, delete: eliminar } = useTarifas();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TarifaForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openModal = (tarifa?: any) => {
    if (tarifa) {
      setEditingId(tarifa.id);
      setForm({
        nombre: tarifa.nombre || '',
        tipo: tarifa.tipo || 'hora_normal',
        valor: tarifa.valor || 0,
        descripcion: tarifa.descripcion || '',
        activo: tarifa.activo ?? true,
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
    if (!form.nombre || form.valor <= 0) {
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
    return tiposTarifa.find(t => t.value === tipo) || tiposTarifa[0];
  };

  if (loading && tarifas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifas</h1>
          <p className="text-gray-600">Configuración de tarifas y precios</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Tarifa
        </button>
      </div>

      {tarifas.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <Euro className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No hay tarifas configuradas</p>
          <button onClick={() => openModal()} className="mt-4 text-primary hover:underline">
            Crear la primera tarifa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tarifas.map((tarifa: any) => {
                const tipoInfo = getTipoInfo(tarifa.tipo);
                const IconComponent = tipoInfo.icon;
                return (
                  <tr key={tarifa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{tarifa.nombre}</div>
                      {tarifa.descripcion && (
                        <div className="text-sm text-gray-500">{tarifa.descripcion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        <IconComponent className="w-3 h-3" />
                        {tipoInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-semibold text-gray-900">
                        {tarifa.valor?.toFixed(2)} €
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        {tarifa.tipo === 'kilometraje' ? '/km' : tarifa.tipo?.includes('hora') ? '/h' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tarifa.activo !== false ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Activa</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Inactiva</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(tarifa)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(tarifa.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Tarifa' : 'Nueva Tarifa'}
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({...form, tipo: e.target.value as TarifaForm['tipo']})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  {tiposTarifa.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm({...form, valor: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({...form, activo: e.target.checked})}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">Tarifa activa</label>
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
            <h3 className="text-lg font-semibold mb-2">¿Eliminar tarifa?</h3>
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

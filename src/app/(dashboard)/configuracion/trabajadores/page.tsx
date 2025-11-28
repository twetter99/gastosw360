'use client';

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, X, Loader2, Key, Mail, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import { useUsuarios } from '@/hooks/useFirebase';
import { toast } from 'sonner';
import { crearUsuarioAuth, generarPasswordTemporal, enviarEmailRestablecimiento } from '@/lib/firebase/admin-auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase/config';

const rolesLabels: Record<string, string> = {
  tecnico: 'Técnico',
  jefe_equipo: 'Jefe de Equipo',
  supervisor_oficina: 'Supervisor',
  direccion: 'Dirección',
  admin: 'Administrador',
};

const rolesOptions = [
  { value: 'tecnico', label: 'Técnico' },
  { value: 'jefe_equipo', label: 'Jefe de Equipo' },
  { value: 'supervisor_oficina', label: 'Supervisor de Oficina' },
  { value: 'direccion', label: 'Dirección' },
  { value: 'admin', label: 'Administrador' },
];

interface TrabajadorForm {
  codigo: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  departamento: string;
  activo: boolean;
  crearAcceso: boolean;
  passwordInicial: string;
}

const initialForm: TrabajadorForm = {
  codigo: '',
  nombre: '',
  apellidos: '',
  email: '',
  rol: 'tecnico',
  departamento: '',
  activo: true,
  crearAcceso: true,
  passwordInicial: '',
};

// Genera el siguiente código disponible (T001, T002, etc.)
const generarSiguienteCodigo = (trabajadores: any[]): string => {
  const codigos = trabajadores
    .map((t: any) => t.codigo)
    .filter((c: string) => c && /^T\d{3}$/.test(c))
    .map((c: string) => parseInt(c.substring(1), 10));
  
  const maxCodigo = codigos.length > 0 ? Math.max(...codigos) : 0;
  const siguiente = maxCodigo + 1;
  return `T${siguiente.toString().padStart(3, '0')}`;
};

export default function TrabajadoresPage() {
  const { data: trabajadores, loading, refresh, delete: eliminar } = useUsuarios();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTrabajador, setEditingTrabajador] = useState<any>(null);
  const [form, setForm] = useState<TrabajadorForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal de éxito con contraseña
  const [successModal, setSuccessModal] = useState<{ open: boolean; password: string; email: string }>({
    open: false,
    password: '',
    email: '',
  });
  const [copied, setCopied] = useState(false);

  // Modal de restablecer contraseña
  const [resetModal, setResetModal] = useState<{ open: boolean; trabajador: any | null }>({
    open: false,
    trabajador: null,
  });
  const [sendingReset, setSendingReset] = useState(false);

  const trabajadoresFiltrados = trabajadores.filter((t: any) => {
    const matchSearch = 
      t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchActivo = 
      filtroActivo === 'todos' ? true :
      filtroActivo === 'activos' ? t.activo :
      !t.activo;

    return matchSearch && matchActivo;
  });

  const openModal = (trabajador?: any) => {
    if (trabajador) {
      setEditingId(trabajador.id);
      setEditingTrabajador(trabajador);
      setForm({
        codigo: trabajador.codigo || '',
        nombre: trabajador.nombre || '',
        apellidos: trabajador.apellidos || '',
        email: trabajador.email || '',
        rol: trabajador.rol || 'tecnico',
        departamento: trabajador.departamento || '',
        activo: trabajador.activo ?? true,
        crearAcceso: false,
        passwordInicial: '',
      });
    } else {
      setEditingId(null);
      setEditingTrabajador(null);
      const codigoGenerado = generarSiguienteCodigo(trabajadores);
      setForm({ ...initialForm, codigo: codigoGenerado });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setEditingTrabajador(null);
    setForm(initialForm);
    setShowPassword(false);
  };

  const handleGenerarPassword = () => {
    const password = generarPasswordTemporal();
    setForm({ ...form, passwordInicial: password });
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nombre || !form.email || !form.codigo) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    setSaving(true);
    
    try {
      if (editingId) {
        // EDITAR trabajador existente
        const data = {
          codigo: form.codigo,
          nombre: form.nombre,
          apellidos: form.apellidos,
          email: form.email,
          rol: form.rol,
          departamento: form.departamento,
          activo: form.activo,
          nombreCompleto: `${form.apellidos}, ${form.nombre}`,
          updatedAt: Timestamp.now(),
        };
        
        await setDoc(doc(db, COLLECTIONS.USUARIOS, editingId), data, { merge: true });
        toast.success('Trabajador actualizado correctamente');
        await refresh();
        closeModal();
      } else {
        // CREAR nuevo trabajador
        if (form.crearAcceso) {
          // Con acceso a la app: crear en Firebase Auth + Firestore
          const password = form.passwordInicial || generarPasswordTemporal();
          
          console.log('Creando usuario con email:', form.email);
          const { uid, error } = await crearUsuarioAuth(form.email, password);
          console.log('Resultado creación Auth:', { uid, error });
          
          if (error || !uid) {
            toast.error(error || 'Error: No se obtuvo UID del usuario');
            setSaving(false);
            return;
          }

          // Crear documento en Firestore con el UID como ID
          const data = {
            codigo: form.codigo,
            nombre: form.nombre,
            apellidos: form.apellidos,
            email: form.email,
            rol: form.rol,
            departamento: form.departamento,
            activo: form.activo,
            nombreCompleto: `${form.apellidos}, ${form.nombre}`,
            fechaAlta: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          console.log('Creando documento Firestore con UID:', uid);
          console.log('Datos:', data);
          
          await setDoc(doc(db, COLLECTIONS.USUARIOS, uid), data);
          console.log('Documento creado exitosamente');
          
          await refresh();
          closeModal();
          
          // Mostrar modal con la contraseña
          setSuccessModal({
            open: true,
            password: password,
            email: form.email,
          });
        } else {
          // Sin acceso a la app: solo crear en Firestore con ID automático
          const data = {
            codigo: form.codigo,
            nombre: form.nombre,
            apellidos: form.apellidos,
            email: form.email,
            rol: form.rol,
            departamento: form.departamento,
            activo: form.activo,
            nombreCompleto: `${form.apellidos}, ${form.nombre}`,
            fechaAlta: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          const { addDoc, collection } = await import('firebase/firestore');
          await addDoc(collection(db, COLLECTIONS.USUARIOS), data);
          toast.success('Trabajador creado (sin acceso a la app)');
          await refresh();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error al guardar el trabajador');
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

  const handleEnviarResetPassword = async () => {
    if (!resetModal.trabajador?.email) return;
    
    setSendingReset(true);
    const { success, error } = await enviarEmailRestablecimiento(resetModal.trabajador.email);
    setSendingReset(false);
    
    if (success) {
      toast.success(`Email de restablecimiento enviado a ${resetModal.trabajador.email}`);
      setResetModal({ open: false, trabajador: null });
    } else {
      toast.error(error || 'Error al enviar el email');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && trabajadores.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verificar si un trabajador tiene acceso (tiene UID válido de Firebase Auth)
  const tieneAcceso = (trabajador: any) => {
    return trabajador?.id && trabajador.id.length >= 20;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-gray-600">Gestión de empleados y accesos</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Trabajador
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'activos', 'inactivos'] as const).map((filtro) => (
            <button
              key={filtro}
              onClick={() => setFiltroActivo(filtro)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroActivo === filtro
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filtro.charAt(0).toUpperCase() + filtro.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acceso</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trabajadoresFiltrados.map((trabajador: any) => (
                <tr key={trabajador.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-900">{trabajador.codigo || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                        {trabajador.nombre?.[0]}{trabajador.apellidos?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{trabajador.nombre} {trabajador.apellidos}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{trabajador.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {rolesLabels[trabajador.rol] || trabajador.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tieneAcceso(trabajador) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        <Key className="w-3 h-3" /> Con acceso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                        Sin acceso
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {trabajador.activo !== false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        <UserCheck className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        <UserX className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {tieneAcceso(trabajador) && (
                        <button 
                          onClick={() => setResetModal({ open: true, trabajador })}
                          className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Restablecer contraseña"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => openModal(trabajador)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(trabajador.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {trabajadoresFiltrados.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron trabajadores</p>
            <button 
              onClick={() => openModal()}
              className="mt-4 text-primary hover:underline"
            >
              Crear el primer trabajador
            </button>
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Trabajador' : 'Nuevo Trabajador'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm({...form, codigo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="T001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({...form, rol: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    {rolesOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    value={form.apellidos}
                    onChange={(e) => setForm({...form, apellidos: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  required
                  disabled={editingId !== null && tieneAcceso(editingTrabajador)}
                />
                {editingId && tieneAcceso(editingTrabajador) && (
                  <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar porque tiene acceso activo</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={form.departamento}
                  onChange={(e) => setForm({...form, departamento: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
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
                <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
              </div>

              {/* Sección de acceso - Solo para nuevos trabajadores */}
              {!editingId && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="crearAcceso"
                      checked={form.crearAcceso}
                      onChange={(e) => setForm({...form, crearAcceso: e.target.checked})}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <label htmlFor="crearAcceso" className="text-sm font-medium text-gray-700">
                      Dar acceso a la app de gastos
                    </label>
                  </div>

                  {form.crearAcceso && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                      <p className="text-sm text-blue-800">
                        Se creará una cuenta para que este trabajador pueda iniciar sesión.
                      </p>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contraseña inicial (opcional)
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={form.passwordInicial}
                              onChange={(e) => setForm({...form, passwordInicial: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary pr-10"
                              placeholder="Dejar vacío para generar automática"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleGenerarPassword}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-1"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Generar
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Si no introduces contraseña, se generará una automática que verás al crear el usuario.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info de acceso - Para trabajadores existentes con acceso */}
              {editingId && tieneAcceso(editingTrabajador) && (
                <div className="border-t pt-4 mt-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-800">Este trabajador tiene acceso a la app</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Para restablecer su contraseña, usa el botón en la lista de trabajadores.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Guardar Cambios' : 'Crear Trabajador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito con Contraseña */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">¡Trabajador creado!</h3>
              <p className="text-gray-600 mt-2">
                Se ha creado el acceso para <strong>{successModal.email}</strong>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <Key className="w-5 h-5" />
                Contraseña inicial
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-lg">
                  {successModal.password}
                </code>
                <button
                  onClick={() => copyToClipboard(successModal.password)}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                  title="Copiar"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-amber-700" />}
                </button>
              </div>
              <p className="text-sm text-amber-700 mt-3">
                ⚠️ <strong>Importante:</strong> Esta contraseña solo se muestra una vez. 
                Anótala y comunícasela al trabajador de forma segura.
              </p>
            </div>

            <button
              onClick={() => setSuccessModal({ open: false, password: '', email: '' })}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Restablecer Contraseña */}
      {resetModal.open && resetModal.trabajador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Restablecer contraseña</h3>
                <p className="text-sm text-gray-600">{resetModal.trabajador.nombre} {resetModal.trabajador.apellidos}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Se enviará un email a <strong>{resetModal.trabajador.email}</strong> con un enlace 
              para que el trabajador establezca una nueva contraseña.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetModal({ open: false, trabajador: null })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarResetPassword}
                disabled={sendingReset}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sendingReset && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar trabajador?</h3>
            <p className="text-gray-600 mb-6">
              Esta acción eliminará el registro del trabajador.
              {tieneAcceso(trabajadores.find((t: any) => t.id === deleteConfirm)) && (
                <span className="block mt-2 text-amber-600 text-sm">
                  ⚠️ El acceso a la app permanecerá activo hasta que se elimine manualmente en Firebase Console.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

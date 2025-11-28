/**
 * Servicio de Usuarios/Trabajadores
 */

import { where, orderBy, QueryConstraint } from 'firebase/firestore';
import { BaseFirestoreService, FirestoreDocument } from './base';
import { COLLECTIONS } from '../config';
import { RolUsuario } from '@/types';

// ============================================
// TIPOS
// ============================================

export interface UsuarioDB extends FirestoreDocument {
  // Identificación
  email: string;
  codigo: string;
  nombre: string;
  apellidos?: string;
  
  // Rol y permisos
  rol: RolUsuario;
  equipoId?: string;
  departamento?: string;
  
  // Estado
  activo: boolean;
  
  // Contacto
  telefono?: string;
  
  // Tarifas especiales (override de tarifas generales)
  tarifasEspeciales?: Record<string, number>;
  
  // Metadatos
  fechaAlta?: Date;
  fechaBaja?: Date;
}

export interface CreateUsuarioInput {
  email: string;
  nombre: string;
  apellidos?: string;
  rol: RolUsuario;
  telefono?: string;
  departamento?: string;
  equipoId?: string;
  tarifasEspeciales?: Record<string, number>;
}

// ============================================
// SERVICIO
// ============================================

class UsuariosService extends BaseFirestoreService<UsuarioDB> {
  constructor() {
    super(COLLECTIONS.USUARIOS);
  }

  /**
   * Obtener usuarios activos
   */
  async getActivos(): Promise<UsuarioDB[]> {
    return this.getAll([
      where('activo', '==', true),
      orderBy('nombre', 'asc'),
    ]);
  }

  /**
   * Obtener usuarios por rol
   */
  async getByRol(rol: RolUsuario): Promise<UsuarioDB[]> {
    return this.getAll([
      where('rol', '==', rol),
      where('activo', '==', true),
      orderBy('nombre', 'asc'),
    ]);
  }

  /**
   * Obtener técnicos
   */
  async getTecnicos(): Promise<UsuarioDB[]> {
    return this.getByRol('tecnico');
  }

  /**
   * Obtener usuario por email
   */
  async getByEmail(email: string): Promise<UsuarioDB | null> {
    const usuarios = await this.getAll([where('email', '==', email)]);
    return usuarios[0] || null;
  }

  /**
   * Obtener usuarios de un equipo
   */
  async getByEquipo(equipoId: string): Promise<UsuarioDB[]> {
    return this.getAll([
      where('equipoId', '==', equipoId),
      where('activo', '==', true),
    ]);
  }

  /**
   * Generar código único para nuevo trabajador
   */
  async generarCodigo(): Promise<string> {
    const usuarios = await this.getAll([orderBy('codigo', 'desc')]);
    
    if (usuarios.length === 0) {
      return 'T001';
    }
    
    // Buscar el código más alto
    let maxNum = 0;
    for (const u of usuarios) {
      if (u.codigo?.startsWith('T')) {
        const num = parseInt(u.codigo.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    return `T${String(maxNum + 1).padStart(3, '0')}`;
  }

  /**
   * Crear usuario con código auto-generado
   */
  async createUsuario(input: CreateUsuarioInput): Promise<string> {
    const codigo = await this.generarCodigo();
    
    return this.create({
      ...input,
      codigo,
      activo: true,
      fechaAlta: new Date(),
    } as Omit<UsuarioDB, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Desactivar usuario (baja)
   */
  async desactivar(id: string): Promise<void> {
    await this.update(id, {
      activo: false,
      fechaBaja: new Date(),
    });
  }

  /**
   * Reactivar usuario
   */
  async reactivar(id: string): Promise<void> {
    await this.update(id, {
      activo: true,
      fechaBaja: undefined,
    });
  }
}

// Exportar instancia singleton
export const usuariosService = new UsuariosService();

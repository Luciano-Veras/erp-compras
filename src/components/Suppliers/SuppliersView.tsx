/**
 * @file src/components/Suppliers/SuppliersView.tsx
 * @description Gestión de catálogo de Proveedores y Registro/Edición de Materias Primas e Insumos con vinculación de proveedores.
 */

import React, { useState } from 'react';
import { 
  Users, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  AlertCircle,
  Building2,
  Boxes
} from 'lucide-react';
import { Supplier, Ingredient } from '../../types';
import { saveSupplier, deleteSupplier, saveIngredient, deleteIngredient } from '../../services/dbService';
import { Modal } from '../Common/Modal';
import { Badge } from '../Common/Badge';
import { formatCurrency } from '../../utils/formatters';

interface SuppliersViewProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
}

/**
 * Componente principal para el catálogo de Proveedores y Productos.
 */
export const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, ingredients }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ingredients' | 'suppliers'>('ingredients');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Partial<Ingredient> | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrado de búsquedas
  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal Proveedor
  const handleOpenSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
    } else {
      setEditingSupplier({
        name: '',
        contactEmail: '',
        phone: '',
        address: '',
        suppliedItemIds: [],
        avgLeadTimeDays: 2,
        fulfillmentRate: 95
      });
    }
    setIsSupplierModalOpen(true);
  };

  // Abrir modal Ingrediente
  const handleOpenIngredientModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingIngredient(ing);
    } else {
      setEditingIngredient({
        name: '',
        category: 'Harinas',
        unit: 'kg',
        currentStock: 100,
        minStock: 50,
        reorderQuantity: 200,
        preferredSupplierIds: [],
        unitCost: 1000
      });
    }
    setIsIngredientModalOpen(true);
  };

  // Guardar Proveedor
  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier?.name || !editingSupplier?.contactEmail) return;
    setIsSubmitting(true);
    try {
      await saveSupplier(editingSupplier as any);
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guardar Ingrediente
  const handleSubmitIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient?.name) return;
    setIsSubmitting(true);
    try {
      await saveIngredient(editingIngredient as any);
      setIsIngredientModalOpen(false);
      setEditingIngredient(null);
    } catch (err) {
      console.error('Error al guardar materia prima:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar
  const handleDeleteSupplier = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      await deleteSupplier(id);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta materia prima del catálogo?')) {
      await deleteIngredient(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Sub-navegación y Acciones de Alta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('ingredients')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'ingredients'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Materias Primas e Insumos ({ingredients.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'suppliers'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Proveedores ({suppliers.length})</span>
          </button>
        </div>

        {/* Buscador e Inputs de Alta */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={activeSubTab === 'ingredients' ? 'Buscar insumo o categoría...' : 'Buscar proveedor o email...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-64"
            />
          </div>

          {activeSubTab === 'ingredients' ? (
            <button
              onClick={() => handleOpenIngredientModal()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Alta Materia Prima</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenSupplierModal()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Alta Proveedor</span>
            </button>
          )}
        </div>

      </div>

      {/* PESTAÑA 1: TABLA Y CATALOGO DE MATERIAS PRIMAS */}
      {activeSubTab === 'ingredients' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Materia Prima / Categoría</th>
                  <th className="p-4">Stock Físico Actual</th>
                  <th className="p-4">Stock Mínimo</th>
                  <th className="p-4">Cant. Reorden</th>
                  <th className="p-4">Costo Ref.</th>
                  <th className="p-4">Proveedores Vinculados</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No se encontraron materias primas en el catálogo.
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map((item) => {
                    const isLowStock = item.currentStock <= item.minStock;
                    const linkedSuppliers = suppliers.filter(s => item.preferredSupplierIds?.includes(s.id));

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            <Badge variant="neutral" size="sm">{item.category}</Badge>
                          </div>
                        </td>

                        <td className="p-4 font-bold">
                          <span className={isLowStock ? 'text-rose-600 dark:text-rose-400 font-black flex items-center gap-1' : ''}>
                            {item.currentStock} {item.unit}
                            {isLowStock && <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline" />}
                          </span>
                        </td>

                        <td className="p-4 text-slate-500">{item.minStock} {item.unit}</td>
                        <td className="p-4 text-slate-500">{item.reorderQuantity} {item.unit}</td>
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(item.unitCost)} / {item.unit}</td>

                        <td className="p-4">
                          {linkedSuppliers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {linkedSuppliers.map(s => (
                                <span key={s.id} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Sin vincular</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenIngredientModal(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar materia prima"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteIngredient(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Eliminar del catálogo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: LISTADO DE PROVEEDORES */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No se encontraron proveedores registrados.
            </div>
          ) : (
            filteredSuppliers.map((s) => {
              const suppliedItems = ingredients.filter(i => s.suppliedItemIds?.includes(i.id) || i.preferredSupplierIds?.includes(s.id));

              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="success" size="sm">Demora ~{s.avgLeadTimeDays || 2} días</Badge>
                          <Badge variant="info" size="sm">Cumplimiento {s.fulfillmentRate || 95}%</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenSupplierModal(s)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Editar Proveedor"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Eliminar Proveedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.phone || 'Sin teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.address || 'Sin dirección'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Materias Primas que Suministra ({suppliedItems.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {suppliedItems.length > 0 ? (
                          suppliedItems.map(item => (
                            <span key={item.id} className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200/50 dark:border-amber-800/40">
                              {item.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Ninguna materia prima asignada.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL FORMULARIO PROVEEDOR */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier?.id ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
        subtitle="Complete los datos de contacto del proveedor"
      >
        <form onSubmit={handleSubmitSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre / Razón Social *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Lácteos La Serenísima"
              value={editingSupplier?.name || ''}
              onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico de Pedidos *
              </label>
              <input
                type="email"
                required
                placeholder="pedidos@proveedor.com"
                value={editingSupplier?.contactEmail || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                placeholder="+54 11 4000-0000"
                value={editingSupplier?.phone || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dirección de Entrega / Despacho
            </label>
            <input
              type="text"
              placeholder="Ruta 5 Km 68, General Rodríguez"
              value={editingSupplier?.address || ''}
              onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Demora Promedio (Días)
              </label>
              <input
                type="number"
                min={1}
                value={editingSupplier?.avgLeadTimeDays || 2}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, avgLeadTimeDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Índice de Cumplimiento (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={editingSupplier?.fulfillmentRate || 95}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, fulfillmentRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Materias Primas / Insumos que Suministra este Proveedor
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              {ingredients.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay materias primas registradas en el catálogo.</p>
              ) : (
                ingredients.map(ing => {
                  const isChecked = editingSupplier?.suppliedItemIds?.includes(ing.id) || false;
                  return (
                    <label key={ing.id} className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentList = editingSupplier?.suppliedItemIds || [];
                          const updated = e.target.checked 
                            ? [...currentList, ing.id] 
                            : currentList.filter(id => id !== ing.id);
                          setEditingSupplier({ ...editingSupplier, suppliedItemIds: updated });
                        }}
                        className="rounded-xs text-indigo-600 focus:ring-indigo-500"
                      />
                      <span><strong>{ing.name}</strong> ({ing.category})</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL FORMULARIO MATERIA PRIMA / INGREDIENTE */}
      <Modal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        title={editingIngredient?.id ? 'Editar Materia Prima' : 'Alta de Materia Prima / Ingrediente'}
        subtitle="Configure parámetros de stock, unidad de medida y proveedores preferidos"
      >
        <form onSubmit={handleSubmitIngredient} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Materia Prima *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Harina 0000 Pastelería"
              value={editingIngredient?.name || ''}
              onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoría *
              </label>
              <select
                value={editingIngredient?.category || 'Harinas'}
                onChange={(e) => setEditingIngredient({ ...editingIngredient, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="Harinas">Harinas & Almidones</option>
                <option value="Lácteos">Lácteos & Grasas</option>
                <option value="Secos">Azúcares & Polvos</option>
                <option value="Huevos">Huevos & Ovoproductos</option>
                <option value="Chocolates">Chocolates & Coberturas</option>
                <option value="Esencias">Esencias & Colorantes</option>
                <option value="Empaques">Cajas & Empaques</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unidad de Medida *
              </label>
              <select
                value={editingIngredient?.unit || 'kg'}
                onChange={(e) => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="litros">Litros</option>
                <option value="unidades">Unidades</option>
                <option value="gramos">Gramos (g)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Stock Físico Inicial
              </label>
              <input
                type="number"
                min={0}
                value={editingIngredient?.currentStock ?? 100}
                onChange={(e) => setEditingIngredient({ ...editingIngredient, currentStock: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Stock Mín. Seguridad
              </label>
              <input
                type="number"
                min={0}
                value={editingIngredient?.minStock ?? 50}
                onChange={(e) => setEditingIngredient({ ...editingIngredient, minStock: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cantidad Reorden
              </label>
              <input
                type="number"
                min={1}
                value={editingIngredient?.reorderQuantity ?? 200}
                onChange={(e) => setEditingIngredient({ ...editingIngredient, reorderQuantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Costo Unitario de Referencia ($)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={editingIngredient?.unitCost ?? 1000}
              onChange={(e) => setEditingIngredient({ ...editingIngredient, unitCost: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Vincular Proveedores Preferidos / Alternativos
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              {suppliers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay proveedores registrados para vincular.</p>
              ) : (
                suppliers.map(s => {
                  const isChecked = editingIngredient?.preferredSupplierIds?.includes(s.id) || false;
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentList = editingIngredient?.preferredSupplierIds || [];
                          const updated = e.target.checked 
                            ? [...currentList, s.id] 
                            : currentList.filter(id => id !== s.id);
                          setEditingIngredient({ ...editingIngredient, preferredSupplierIds: updated });
                        }}
                        className="rounded-xs text-amber-500 focus:ring-amber-500"
                      />
                      <span>{s.name} ({s.contactEmail})</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsIngredientModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Materia Prima'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

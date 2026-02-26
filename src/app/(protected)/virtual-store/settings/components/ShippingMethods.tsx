import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useShippingStore } from '@/stores/shippingStore';
import { ShippingProvider } from '@/services/shippingService';

export default function StoreShippingMethodsPage() {
  const { currentCompany } = useAuthStore();
  const { providers, fetchProviders, createProvider, updateProvider, deleteProvider, toggleProvider, isLoadingProviders } = useShippingStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchProviders(currentCompany.id);
    }
  }, [currentCompany?.id]);

  const handleToggle = async (provider: ShippingProvider) => {
    if (!currentCompany?.id) return;
    await toggleProvider(currentCompany.id, provider.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este método de envío?')) return;
    if (!currentCompany?.id) return;
    try {
      await deleteProvider(currentCompany.id, id);
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar (puede tener envíos asociados).');
    }
  };

  const openAddModal = () => {
    setEditingProvider(null);
    setIsModalOpen(true);
  };

  const openEditModal = (provider: ShippingProvider) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentCompany?.id) return;

    const formData = new FormData(e.currentTarget);
    const rawCode = formData.get('code') as string;
    // Si es manual, le damos un código único para evitar conflictos en base de datos
    const finalCode = (rawCode === 'manual' && !editingProvider) ? `manual_${Date.now()}` : rawCode;

    const data = {
      code: finalCode,
      name: formData.get('name') as string,
      type: formData.get('type') as any,
      is_active: formData.get('is_active') === '1'
    };

    try {
      if (editingProvider) {
        await updateProvider(currentCompany.id, editingProvider.id, data);
      } else {
        await createProvider(currentCompany.id, data);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Hubo un error al guardar el método de envío.');
    }
  };

  if (isLoadingProviders) {
    return <div className="p-8 text-center text-gray-500">Cargando métodos de envío...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Métodos de Envío</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configura couriers (Olva, Shalom) y opciones como Recojo en Tienda o métodos propios.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Método
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
        {providers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No hay métodos de envío configurados.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
            {providers.map((provider) => (
              <li key={provider.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {provider.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Tipo: <span className="uppercase font-semibold tracking-wider text-[10px] bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded">{provider.code}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(provider)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      provider.is_active
                        ? 'text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-zinc-700'
                    )}
                  >
                    {provider.is_active ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                    {provider.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button onClick={() => openEditModal(provider)} className="p-1.5 text-gray-500 hover:text-emerald-600">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(provider.id)} className="p-1.5 text-gray-500 hover:text-red-600">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-[#0D1117] p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-6"
                  >
                    {editingProvider ? 'Editar Método de Envío' : 'Nuevo Método de Envío'}
                  </Dialog.Title>
                  <form onSubmit={handleSave}>
                    
                    <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Envío / Courier</label>
                    <select
                      name="code"
                      defaultValue={editingProvider?.code || 'olva'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="olva">Olva Courier</option>
                      <option value="shalom">Shalom</option>
                      <option value="manual">Recojo en Tienda / Otro / Manual</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Selecciona 'Manual' para métodos como "Recojo en Tienda" o "Envío Express Propio".</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre a mostrar (Ej: "Recojo en San Isidro" o "Shalom Express")
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingProvider?.name}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <input type="hidden" name="type" value="manual" /> 

                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      value="1"
                      defaultChecked={editingProvider ? editingProvider.is_active : true}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Activo en tienda
                    </label>
                  </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-black dark:text-gray-300 dark:border-[#232834] dark:hover:bg-[#161A22]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
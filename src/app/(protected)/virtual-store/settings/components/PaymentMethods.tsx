import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import virtualStoreService, { PaymentMethod } from '@/services/virtualStoreService';
import toast from 'react-hot-toast';
import { YapeIcon, PlinIcon } from '@/components/ui/WalletIcons';

export default function StorePaymentMethodsPage() {
  const { currentCompany } = useAuthStore();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [selectedType, setSelectedType] = useState<'wallet' | 'bank'>('wallet');
  const [selectedProvider, setSelectedProvider] = useState<string>('yape');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchPaymentMethods();
    }
  }, [currentCompany?.id]);

  const fetchPaymentMethods = async () => {
    if (!currentCompany?.id) return;
    try {
      setIsLoading(true);
      const res = await virtualStoreService.getPaymentMethods(currentCompany.id);
      setPaymentMethods(res.data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (method: PaymentMethod) => {
    if (!currentCompany?.id) return;
    try {
      await virtualStoreService.togglePaymentMethod(currentCompany.id, method.id);
      setPaymentMethods(methods => 
        methods.map(m => m.id === method.id ? { ...m, is_active: !m.is_active } : m)
      );
    } catch (error) {
      console.error('Error toggling payment method:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este método de pago?')) return;
    if (!currentCompany?.id) return;
    
    try {
      await virtualStoreService.deletePaymentMethod(currentCompany.id, id);
      setPaymentMethods(methods => methods.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const openAddModal = () => {
    setEditingMethod(null);
    setSelectedType('wallet');
    setSelectedProvider('yape');
    setIsModalOpen(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setSelectedType(method.type as 'wallet' | 'bank');
    setSelectedProvider(method.provider);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("handleSave called! currentCompany:", currentCompany);
    if (!currentCompany?.id) {
      console.log("No currentCompany.id, aborting.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    console.log("Submitting form with provider:", formData.get('provider'));

    try {
      if (editingMethod) {
        await virtualStoreService.updatePaymentMethod(currentCompany.id, editingMethod.id, formData);
        toast.success('Método actualizado con éxito');
      } else {
        await virtualStoreService.createPaymentMethod(currentCompany.id, formData);
        toast.success('Método creado con éxito');
      }
      setIsModalOpen(false);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Hubo un error al guardar el método de pago.');
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'yape': return 'bg-[#742284] text-white';
      case 'plin': return 'bg-[#00C3CC] text-white';
      case 'bcp': return 'bg-[#002A8D] text-white';
      case 'bbva': return 'bg-[#004481] text-white';
      case 'interbank': return 'bg-[#00A4E4] text-white';
      case 'scotiabank': return 'bg-[#ED0006] text-white';
      default: return 'bg-gray-200 text-gray-800 dark:bg-zinc-700 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando métodos de pago...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Métodos de Pago Manuales</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configura billeteras digitales (Yape, Plin) y cuentas bancarias.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Método
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
        {paymentMethods.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No hay métodos de pago configurados. Haz clic en "Nuevo Método" para agregar uno.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
            {paymentMethods.map((method) => (
              <li key={method.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                {/* Drag Handle placeholder */}
                <button className="hidden sm:block text-gray-400 hover:text-gray-500 cursor-move">
                  <ArrowsUpDownIcon className="w-5 h-5" />
                </button>

                {/* Identity */}
                <div className={clsx(
                  'flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-bold text-lg',
                  getProviderColor(method.provider)
                )}>
                  {method.provider.toLowerCase() === 'yape' ? (
                    <YapeIcon className="w-10 h-10" />
                  ) : method.provider.toLowerCase() === 'plin' ? (
                    <PlinIcon className="w-10 h-10" />
                  ) : (
                    method.provider.toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {method.provider.toUpperCase()} - {method.account_number}
                    </h3>
                    <span className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      method.type === 'wallet' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      {method.type === 'wallet' ? 'Billetera' : 'Transferencia'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Titular: {method.account_name}
                  </p>
                  {method.cci && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      CCI: {method.cci}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                  <button
                    onClick={() => handleToggle(method)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      method.is_active
                        ? 'text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/30 dark:hover:bg-green-900/50'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                    )}
                  >
                    {method.is_active ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                    {method.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => openEditModal(method)}
                    className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal Form */}
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
                    {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                  </Dialog.Title>
                  <form onSubmit={handleSave}>
                    
                    <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                      <select
                        name="type"
                        value={selectedType}
                        onChange={(e) => {
                          const type = e.target.value as 'wallet' | 'bank';
                          setSelectedType(type);
                          setSelectedProvider(type === 'wallet' ? 'yape' : 'bcp');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="wallet">Billetera Digital</option>
                        <option value="bank">Transferencia Bancaria</option>
                      </select>
                    </div>

                    {selectedType === 'wallet' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billetera</label>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Yape */}
                          <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none dark:bg-[#1E2230] ${selectedProvider === 'yape' ? 'border-[#742284] ring-1 ring-[#742284]' : 'border-gray-300 dark:border-zinc-700'}`}>
                            <input
                              type="radio"
                              name="provider"
                              value="yape"
                              className="sr-only"
                              checked={selectedProvider === 'yape'}
                              onChange={() => setSelectedProvider('yape')}
                            />
                            <span className="flex flex-1 items-center justify-center">
                              <span className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#742284] text-white mb-2">
                                  <YapeIcon className="w-8 h-8" />
                                </div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Yape</span>
                              </span>
                            </span>
                            <CheckCircleIcon className={`h-5 w-5 absolute top-2 right-2 ${selectedProvider === 'yape' ? 'text-[#742284]' : 'hidden'}`} aria-hidden="true" />
                          </label>

                          {/* Plin */}
                          <label className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none dark:bg-[#1E2230] ${selectedProvider === 'plin' ? 'border-[#00C3CC] ring-1 ring-[#00C3CC]' : 'border-gray-300 dark:border-zinc-700'}`}>
                            <input
                              type="radio"
                              name="provider"
                              value="plin"
                              className="sr-only"
                              checked={selectedProvider === 'plin'}
                              onChange={() => setSelectedProvider('plin')}
                            />
                            <span className="flex flex-1 items-center justify-center">
                              <span className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#00C3CC] text-white mb-2">
                                  <PlinIcon className="w-8 h-8" />
                                </div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Plin</span>
                              </span>
                            </span>
                            <CheckCircleIcon className={`h-5 w-5 absolute top-2 right-2 ${selectedProvider === 'plin' ? 'text-[#00C3CC]' : 'hidden'}`} aria-hidden="true" />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco</label>
                        <select
                          name="provider"
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="bcp">BCP</option>
                          <option value="bbva">BBVA</option>
                          <option value="interbank">Interbank</option>
                          <option value="scotiabank">Scotiabank</option>
                        </select>
                      </div>
                    )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número ({selectedType === 'wallet' ? 'Celular' : 'Cuenta'})
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      required
                      defaultValue={editingMethod?.account_number}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      name="account_name"
                      required
                      defaultValue={editingMethod?.account_name}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {selectedType === 'bank' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CCI (Opcional, solo bancos)
                      </label>
                      <input
                        type="text"
                        name="cci"
                        defaultValue={editingMethod?.cci}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código QR (Opcional)
                    </label>
                    <input
                      type="file"
                      name="qr_image"
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100
                        dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
                    />
                    {editingMethod?.qr_url && (
                      <div className="mt-2">
                        <img src={editingMethod.qr_url} alt="QR actual" className="w-20 h-20 object-cover rounded-md border" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instrucciones adicionales (Opcional)
                    </label>
                    <textarea
                      name="instructions"
                      rows={2}
                      defaultValue={editingMethod?.instructions}
                      placeholder="Ej: Recuerda adjuntar el voucher indicando el número de pedido."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      value="1"
                      defaultChecked={editingMethod ? editingMethod.is_active : true}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Activo
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
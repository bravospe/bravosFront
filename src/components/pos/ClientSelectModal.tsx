'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MagnifyingGlassIcon, UserPlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useClientStore } from '@/stores/clientStore';
import type { Client } from '@/types';
import clsx from 'clsx';

interface ClientSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  onCreateNew: () => void;
}

export const ClientSelectModal = ({ isOpen, onClose, onSelect, onCreateNew }: ClientSelectModalProps) => {
  const { clients, fetchClients, isLoading } = useClientStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchClients({ per_page: 10 });
    }
  }, [isOpen, fetchClients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    fetchClients({ search: value, per_page: 10 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Cliente" size="md">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o RUC..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
            autoFocus
          />
          {search && (
            <button 
              onClick={() => { setSearch(''); fetchClients({ per_page: 10 }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Client List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Buscando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 font-medium mb-4">No se encontraron clientes</p>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm"
              >
                <UserPlusIcon className="w-4 h-4" />
                Crear Nuevo Cliente
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => { onSelect({ id: '', name: 'Cliente General', document_type: 'DNI', document_number: '00000000', is_active: true } as any); }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left border border-transparent hover:border-emerald-200"
              >
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Cliente General</p>
                  <p className="text-xs text-gray-500">Sin identificación</p>
                </div>
              </button>
              
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => onSelect(client)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left border border-transparent hover:border-emerald-200"
                >
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.document_type}: {client.document_number}</p>
                  </div>
                  <CheckIcon className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer Action */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCreateNew}
            className="w-full py-3 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/5 rounded-xl transition-all"
          >
            <UserPlusIcon className="w-5 h-5" />
            ¿No encuentras al cliente? Crea uno nuevo
          </button>
        </div>
      </div>
    </Modal>
  );
};

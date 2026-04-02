'use client';

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  CalendarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Input, Avatar } from '@/components/ui';
import api from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  roles?: { name: string }[];
  companies?: { name: string }[];
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data || data); // Handle both paginated and flat responses
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('No se pudieron cargar los usuarios');
      setLoading(false);
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      await api.post(`/admin/users/${user.id}/toggle-status`);
      toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`);
      fetchUsers();
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400">Administra todos los usuarios registrados en el sistema</p>
        </div>
        <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700 border-none">
          Nuevo Usuario
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-[#232834] bg-gray-50/50 dark:bg-[#0D1117]/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Input 
              placeholder="Buscar por Email o Nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
              className="h-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-[#0D1117] border-b border-gray-200 dark:border-[#232834]">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Empresas</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Registro</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#232834]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(r => (
                            <Badge key={r.name} variant="secondary" className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 border-none text-[10px]">
                              {r.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Sin rol</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.companies && user.companies.length > 0 ? (
                          user.companies.map((c, idx) => (
                            <span key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                              • {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Ninguna</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <Badge variant="success" className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 border-none flex items-center w-fit gap-1">
                          <CheckCircleIcon className="w-3 h-3" /> Activo
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="bg-rose-100 dark:bg-rose-900/20 text-rose-600 border-none flex items-center w-fit gap-1">
                          <XCircleIcon className="w-3 h-3" /> Suspendido
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="xs"
                          onClick={() => toggleStatus(user)}
                          className={user.is_active ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}
                        >
                          {user.is_active ? 'Suspender' : 'Activar'}
                        </Button>
                        <Button variant="ghost" size="xs">
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
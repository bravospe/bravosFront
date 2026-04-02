'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Button, Input } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { IllustrationStats, IllustrationPOS } from '@/components/dashboard/DashboardIllustrations';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

const LoginPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      email: 'demo@bravos.pe',
      password: 'demo123',
      remember: true,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      setAuth(response.user, response.token);
      toast.success('¡Bienvenido de nuevo!');
      
      // Explicitly check for superadmin role
      const isSuperAdmin = response.user.roles?.some((r: any) => r.name === 'superadmin');
      
      if (isSuperAdmin) {
        router.push('/superadmin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side: Illustration/Cover */}
      <div className="hidden lg:flex lg:w-2/3 items-center justify-center bg-gray-50 dark:bg-[#0D1117] p-12 relative">
        <div className="absolute top-10 left-10 flex items-center gap-2">
          <img src="/logo_bravos.png" alt="Bravos Logo" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Bravos</span>
        </div>
        
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white dark:bg-[#1E2230] rounded-2xl p-8 shadow-2xl">
              <IllustrationStats className="w-full h-auto max-h-[400px] dark:hidden" />
              <IllustrationPOS className="w-full h-auto max-h-[400px] hidden dark:block" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestiona tu negocio como un profesional</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">La plataforma más completa para facturación, inventario y ventas.</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-8 bg-white dark:bg-[#080B12] shadow-2xl z-10">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo_bravos.png" alt="Bravos Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Bravos</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">¡Bienvenido a Bravos! 👋</h1>
            <p className="text-gray-500 dark:text-gray-400">Por favor, inicia sesión en tu cuenta y comienza la aventura</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="juan@ejemplo.com"
                {...register('email', { required: 'El email es requerido' })}
                error={errors.email?.message}
                className="h-12"
              />

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                  <Link href="/auth/forgot-password" size="sm" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`
                      w-full px-4 h-12 rounded-xl border bg-white dark:bg-[#1E2230] 
                      text-gray-900 dark:text-white text-sm transition-all
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                      ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-[#232834]'}
                    `}
                    {...register('password', { required: 'La contraseña es requerida' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 dark:border-[#232834] dark:bg-[#1E2230]"
                {...register('remember')}
              />
              <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                Recordarme
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="h-12 rounded-xl text-md font-bold shadow-lg shadow-emerald-500/20"
              loading={loading}
            >
              Iniciar Sesión
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Nuevo en nuestra plataforma?{' '}
                <Link href="/auth/register" className="font-bold text-emerald-500 hover:text-emerald-400">
                  Crea una cuenta
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

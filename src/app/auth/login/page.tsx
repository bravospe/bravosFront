'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
// import { handleDomainChange } from '@/utils/cookieHelper'; // Asumiré que este archivo existe porque copié utils

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

const LoginPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if domain changed and clear cookies if needed
  useEffect(() => {
    // Solo importar cookieHelper si es necesario y existe
    // handleDomainChange();
  }, []);

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
      setError(null);

      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      setAuth(response.user, response.token);
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[370px] w-full">
      <div className="bg-white dark:bg-black rounded-xl shadow-lg border border-gray-200 dark:border-[#232834]">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-10">
          {/* Header */}
          <div className="text-center mb-2.5">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white leading-none mb-2.5">
              Iniciar Sesión
            </h3>
            <div className="flex items-center justify-center font-medium">
              <span className="text-sm text-gray-500 dark:text-gray-400 me-1.5">
                ¿No tienes cuenta?
              </span>
              <Link href="/auth/register" className="text-sm text-emerald-500 hover:text-emerald-400 dark:text-emerald-400">
                Regístrate
              </Link>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
            >
              <svg className="w-4 h-4 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <span className="border-t border-gray-200 dark:border-[#232834] w-full"></span>
            <span className="text-xs text-gray-400 font-medium uppercase">O</span>
            <span className="border-t border-gray-200 dark:border-[#232834] w-full"></span>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-normal text-gray-900 dark:text-white">
              Email
            </label>
            <input
              type="email"
              placeholder="email@empresa.com"
              autoComplete="email"
              className={`
                w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-black 
                text-gray-900 dark:text-white text-sm
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                ${errors.email
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-[#232834]'
                }
              `}
              {...register('email', {
                required: 'El correo es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo inválido',
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <label className="text-sm font-normal text-gray-900 dark:text-white">
                Contraseña
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-emerald-500 hover:text-emerald-400 dark:text-emerald-400 shrink-0"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                className={`
                  w-full px-4 py-2.5 pr-12 rounded-lg border bg-white dark:bg-black 
                  text-gray-900 dark:text-white text-sm
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                  ${errors.password
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-[#232834]'
                  }
                `}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'Mínimo 6 caracteres',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 dark:border-[#232834] dark:bg-black"
              {...register('remember')}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Recordarme
            </span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-emerald-400 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

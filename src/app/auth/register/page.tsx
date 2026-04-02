'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Building2, 
  ShieldCheck, 
  Smartphone,
  EyeOff,
  Eye,
  Loader2,
  Zap,
  Star,
  Trophy,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from 'react-hot-toast';
import validationService from '@/services/validationService';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import clsx from 'clsx';

type Step = 1 | 2 | 3 | 4;

interface RegisterFormData {
  // Step 1: Identity
  document_type: 'DNI' | 'RUC';
  document_number: string;
  name: string;
  phone: string;
  
  // Step 2: Verification
  otp_code: string;
  
  // Step 3: Account
  email: string;
  password: string;
  password_confirmation: string;
  company_name: string;

  // Step 4: Plan
  plan_slug: string;
}

const RegisterPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { availablePlans, fetchPlans } = useSubscriptionStore();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingDoc, setIsValidatingDoc] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDocValidated, setIsDocValidated] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailPlan, setSelectedDetailPlan] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      document_type: 'DNI',
      document_number: '',
      name: '',
      phone: '',
      otp_code: '',
      email: '',
      password: '',
      password_confirmation: '',
      company_name: '',
      plan_slug: 'basico',
    },
  });

  const documentType = watch('document_type');
  const documentNumber = watch('document_number');
  const phone = watch('phone');
  const selectedPlan = watch('plan_slug');

  // Step 1: Auto-validate document
  useEffect(() => {
    const cleanDoc = documentNumber.replace(/\D/g, '');
    if (cleanDoc !== documentNumber) {
      setValue('document_number', cleanDoc);
    }

    if (
      (documentType === 'DNI' && cleanDoc.length !== 8) ||
      (documentType === 'RUC' && cleanDoc.length !== 11)
    ) {
      if (isDocValidated) {
        setIsDocValidated(false);
        setValue('name', '');
      }
    }

    const timer = setTimeout(async () => {
      if (
        (documentType === 'DNI' && cleanDoc.length === 8) ||
        (documentType === 'RUC' && cleanDoc.length === 11)
      ) {
        try {
          setIsValidatingDoc(true);
          const response = documentType === 'DNI' 
            ? await validationService.validateDni(cleanDoc)
            : await validationService.validateRuc(cleanDoc);
          
          if (response.valid && response.data) {
            setValue('name', response.data.name);
            setIsDocValidated(true);
            toast.success('Documento validado');
          } else {
            setIsDocValidated(false);
            setValue('name', '');
            toast.error('No se encontró información para este documento');
          }
        } catch (error) {
          setIsDocValidated(false);
          setValue('name', '');
          console.error(error);
        } finally {
          setIsValidatingDoc(false);
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [documentNumber, documentType, setValue, isDocValidated]);

  const handleNextStep1 = async () => {
    if (!isDocValidated) {
      toast.error('Por favor, valida tu DNI o RUC primero');
      return;
    }

    const isStepValid = await trigger(['document_number', 'name', 'phone']);
    if (!isStepValid) return;

    try {
      setIsSendingOtp(true);
      const response = await authService.sendOTP(phone);
      if (response.success) {
        toast.success('Código de verificación enviado a tu WhatsApp');
        setCurrentStep(2);
      } else {
        toast.error(response.message || 'Error al enviar el código');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const isStepValid = await trigger(['otp_code']);
    if (!isStepValid) return;

    try {
      setIsVerifyingOtp(true);
      const response = await authService.verifyOTP(phone, watch('otp_code'));
      
      if (response.success) {
        toast.success('WhatsApp verificado correctamente');
        setCurrentStep(3);
      } else {
        toast.error(response.message || 'Código inválido');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error de verificación');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleNextStep3 = async () => {
    const isStepValid = await trigger(['email', 'password', 'password_confirmation', 'company_name']);
    if (isStepValid) {
      setCurrentStep(4);
    }
  };

  const handleShowDetails = (e: React.MouseEvent, plan: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDetailPlan(plan);
    setIsDetailModalOpen(true);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      
      const ruc = data.document_type === 'RUC' 
        ? data.document_number 
        : `000${data.document_number}`;

      const response = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        phone: data.phone,
        document_type: data.document_type,
        document_number: data.document_number,
        company_name: data.company_name,
        company_ruc: ruc,
        company_address: 'Dirección por defecto',
        plan_slug: data.plan_slug,
      } as any);

      setAuth(response.user, response.token);
      toast.success('¡Cuenta creada exitosamente!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const PlanIcon = ({ slug, active }: { slug: string, active?: boolean }) => {
    const color = active ? 'text-white' : '';
    if (slug === 'profesional') return <Trophy className={clsx("w-6 h-6", active ? color : "text-amber-500")} />;
    if (slug === 'medio' || slug === 'negocio') return <Star className={clsx("w-6 h-6", active ? color : "text-emerald-500")} />;
    return <Zap className={clsx("w-6 h-6", active ? color : "text-blue-500")} />;
  };

  const planFeaturesList = (plan: any) => {
    const features = [];
    if (plan.slug === 'basico' || plan.slug === 'emprendedor') {
      features.push('Hasta 50 comprobantes/mes');
      features.push('1 Usuario / 1 Sede');
      features.push('Punto de Venta (POS)');
      features.push('Inventario Básico');
      features.push('Soporte vía Chat');
    } else if (plan.slug === 'medio' || plan.slug === 'negocio') {
      features.push('Comprobantes ILIMITADOS');
      features.push('3 Usuarios / 1 Sede');
      features.push('Inventario Profesional (Kardex)');
      features.push('Punto de Venta Pro');
      features.push('Soporte prioritario');
    } else if (plan.slug === 'profesional') {
      features.push('Comprobantes ILIMITADOS');
      features.push('15 Usuarios / 5 Sedes');
      features.push('Tienda Virtual FULL (Shopify Style)');
      features.push('Alertas WhatsApp para Dueño');
      features.push('Multi-almacén avanzado');
      features.push('Soporte VIP WhatsApp');
    }
    return features;
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#080B12]">
      {/* Sidebar: Progress - ALWAYS DARK */}
      <div className="hidden lg:flex lg:w-1/4 bg-[#080B12] p-12 flex-col border-r border-[#232834]">
        <div className="mb-auto">
          <div className="flex items-center gap-2">
            <img src="/logo_bravos.png" alt="Bravos Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-white tracking-tight">Bravos</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-8 relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#232834]"></div>

            {[
              { id: 1, title: 'Identidad', sub: 'Datos de contacto', icon: User },
              { id: 2, title: 'Verificación', sub: 'Validar WhatsApp', icon: ShieldCheck },
              { id: 3, title: 'Cuenta', sub: 'Acceso y Empresa', icon: Building2 },
              { id: 4, title: 'Plan', sub: 'Elige tu potencia', icon: Trophy },
            ].map((s) => (
              <div key={s.id} className="relative flex items-start gap-4 group">
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all duration-300",
                  currentStep === s.id ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110" : 
                  currentStep > (s.id as any) ? "bg-emerald-900/40 text-emerald-400" :
                  "bg-[#1E2230] text-gray-500 border border-[#232834]"
                )}>
                  {currentStep > (s.id as any) ? <Check size={20} /> : <s.icon size={20} />}
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className={clsx(
                    "text-sm font-bold transition-colors",
                    currentStep === s.id ? "text-white" : "text-gray-500"
                  )}>{s.title}</span>
                  <span className="text-xs text-gray-600">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 overflow-y-auto">
        <div className="max-w-2xl w-full">
          {/* Mobile Steps (Hidden on desktop) */}
          <div className="lg:hidden flex justify-between mb-8">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className={clsx(
                 "h-1.5 flex-1 rounded-full mx-1",
                 currentStep >= i ? "bg-emerald-500" : "bg-gray-200 dark:bg-[#232834]"
               )}></div>
             ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* STEP 1: Identity */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Información de Identidad</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa tus datos de identificación para comenzar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Tipo Doc.</label>
                    <select 
                      {...register('document_type')}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#1E2230] text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      <option value="DNI">DNI (Persona)</option>
                      <option value="RUC">RUC (Empresa)</option>
                    </select>
                  </div>
                  <div className="md:col-span-8 relative">
                    <Input 
                      label="Número de Documento"
                      placeholder={documentType === 'DNI' ? 'Ej: 7245...' : 'Ej: 2060...'}
                      {...register('document_number', { 
                        required: 'Requerido',
                        minLength: { 
                          value: documentType === 'DNI' ? 8 : 11, 
                          message: `Debe tener ${documentType === 'DNI' ? 8 : 11} dígitos` 
                        }
                      })}
                      maxLength={documentType === 'DNI' ? 8 : 11}
                      error={errors.document_number?.message}
                      className="h-12"
                    />
                    {isValidatingDoc && (
                      <div className="absolute right-3 top-9 text-emerald-500 animate-spin">
                        <Loader2 size={18} />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-12">
                    <Input 
                      label="Nombre o Razón Social"
                      placeholder="Autocompletado al validar..."
                      {...register('name', { required: 'Requerido' })}
                      error={errors.name?.message}
                      className="h-12 bg-gray-50 dark:bg-[#0D1117] opacity-70"
                      readOnly
                    />
                  </div>

                  <div className="md:col-span-12">
                    <Input 
                      label="Teléfono WhatsApp (9 dígitos)"
                      placeholder="987654321"
                      {...register('phone', { 
                        required: 'Requerido',
                        pattern: { value: /^9\d{8}$/, message: 'Número de WhatsApp inválido (9 dígitos)' }
                      })}
                      error={errors.phone?.message}
                      leftIcon={<Smartphone size={18} />}
                      className="h-12"
                      disabled={!isDocValidated}
                    />
                    <p className="mt-2 text-xs text-gray-400 italic">Te enviaremos un código de seguridad a este número.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="button" 
                    variant="primary" 
                    size="lg" 
                    className={clsx(
                      "rounded-xl px-8",
                      !isDocValidated && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleNextStep1}
                    loading={isSendingOtp}
                    disabled={!isDocValidated}
                  >
                    Siguiente <ChevronRight className="ml-2" size={18} />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: WhatsApp Verification */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifica tu WhatsApp</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Hemos enviado un código de 6 dígitos al <strong>+51 {phone}</strong>.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={40} />
                  </div>
                  
                  <div className="w-full max-w-xs space-y-4">
                    <Input 
                      label="Código de Seguridad"
                      placeholder="000000"
                      {...register('otp_code', { 
                        required: 'Ingresa el código',
                        minLength: { value: 6, message: 'Son 6 dígitos' }
                      })}
                      error={errors.otp_code?.message}
                      className="text-center text-2xl tracking-[0.5em] font-bold h-14"
                      maxLength={6}
                    />
                    <button 
                      type="button" 
                      onClick={async () => {
                        try {
                          setIsSendingOtp(true);
                          const response = await authService.sendOTP(phone);
                          if (response.success) {
                            toast.success('Código reenviado a tu WhatsApp');
                          } else {
                            toast.error(response.message || 'Error al reenviar');
                          }
                        } catch (err) {
                          toast.error('Error al conectar con el servidor');
                        } finally {
                          setIsSendingOtp(false);
                        }
                      }}
                      disabled={isSendingOtp}
                      className="text-sm text-emerald-500 font-bold hover:underline w-full text-center disabled:text-gray-400"
                    >
                      {isSendingOtp ? 'Enviando...' : '¿No recibiste el código? Reenviar'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setCurrentStep(1)}
                  >
                    <ChevronLeft size={18} /> Atrás
                  </Button>
                  <Button 
                    type="button" 
                    variant="primary" 
                    className="rounded-xl px-8"
                    onClick={handleVerifyOtp}
                    loading={isVerifyingOtp}
                  >
                    Verificar <Check className="ml-2" size={18} />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Account Details */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalles de la Cuenta</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Crea tus credenciales de acceso y configura tu primera empresa.</p>
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Email de Acceso"
                    type="email"
                    placeholder="email@negocio.com"
                    {...register('email', { required: 'Email requerido' })}
                    error={errors.email?.message}
                    className="h-12"
                  />

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`
                          w-full px-4 h-12 rounded-xl border bg-white dark:bg-[#1E2230] 
                          text-gray-900 dark:text-white text-sm transition-all
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                          ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-[#232834]'}
                        `}
                        {...register('password', { 
                          required: 'Requerida',
                          minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`
                          w-full px-4 h-12 rounded-xl border bg-white dark:bg-[#1E2230] 
                          text-gray-900 dark:text-white text-sm transition-all
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                          ${errors.password_confirmation ? 'border-red-500' : 'border-gray-200 dark:border-[#232834]'}
                        `}
                        {...register('password_confirmation', { 
                          required: 'Confirmación requerida',
                          validate: (val: string) => {
                            if (watch('password') !== val) {
                              return "Las contraseñas no coinciden";
                            }
                          },
                        })}
                      />
                    </div>
                    {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>}
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-[#232834]"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-[#080B12] px-2 text-gray-400">Datos de la Empresa</span></div>
                  </div>

                  <Input 
                    label="Nombre de tu Tienda / Negocio"
                    placeholder="Ej: Bravos Store"
                    {...register('company_name', { required: 'Nombre de empresa requerido' })}
                    error={errors.company_name?.message}
                    leftIcon={<Building2 size={18} />}
                    className="h-12"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button 
                    type="button" 
                    className="text-gray-500 font-medium px-4"
                    onClick={() => setCurrentStep(2)}
                  >
                    Atrás
                  </button>
                  <Button 
                    type="button" 
                    variant="primary" 
                    className="rounded-xl px-12"
                    onClick={handleNextStep3}
                  >
                    Continuar <ChevronRight className="ml-2" size={18} />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Plan Selection */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Elige tu Plan</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Prueba cualquier plan gratis por 14 días. No requiere tarjeta.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                  {(availablePlans.length > 0 ? availablePlans : [
                    { slug: 'basico', name: 'Emprendedor', description: 'Facturación + POS', price_monthly: 19 },
                    { slug: 'medio', name: 'Negocio', description: 'Ilimitado + Inventario Pro', price_monthly: 45 },
                    { slug: 'profesional', name: 'Profesional', description: 'Tienda Virtual + Alertas WhatsApp', price_monthly: 85 }
                  ]).map((plan: any) => {
                    const isActive = selectedPlan === plan.slug;
                    return (
                      <label 
                        key={plan.slug}
                        className={clsx(
                          "relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all duration-500 overflow-hidden group",
                          isActive 
                            ? "bg-emerald-600 dark:bg-emerald-600 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[1.05] z-10" 
                            : "bg-white dark:bg-[#1E2230] border-gray-100 dark:border-[#232834] hover:border-emerald-200"
                        )}
                      >
                        <input 
                          type="radio" 
                          {...register('plan_slug')} 
                          value={plan.slug} 
                          className="sr-only"
                        />
                        
                        {/* Background animation for active state */}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 animate-in fade-in duration-500"></div>
                        )}

                        <div className="relative z-10 flex items-center gap-3 mb-2">
                          <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500",
                            isActive ? "bg-white/20" : "bg-emerald-50 dark:bg-emerald-500/10"
                          )}>
                            <PlanIcon slug={plan.slug} active={isActive} />
                          </div>
                          <div className="flex flex-col">
                            <span className={clsx(
                              "text-[10px] font-bold uppercase tracking-wider",
                              isActive ? "text-emerald-100" : "text-gray-400"
                            )}>Desde</span>
                            <span className={clsx(
                              "text-sm font-black",
                              isActive ? "text-white" : "text-gray-900 dark:text-white"
                            )}>S/ {Math.round(plan.price_monthly)}</span>
                          </div>
                        </div>

                        <div className="relative z-10 mt-auto">
                          <div className="flex items-center gap-2">
                            <span className={clsx(
                              "font-bold text-lg block transition-colors duration-500",
                              isActive ? "text-white" : "text-gray-900 dark:text-white"
                            )}>{plan.name}</span>
                            <button
                              onClick={(e) => handleShowDetails(e, plan)}
                              className={clsx(
                                "p-1 rounded-lg transition-all duration-300",
                                isActive 
                                  ? "text-white/70 hover:text-white hover:bg-white/10" 
                                  : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              )}
                              title="Ver detalles"
                            >
                              <Info size={16} />
                            </button>
                          </div>
                          <span className={clsx(
                            "text-[11px] mt-0.5 line-clamp-2 transition-colors duration-500 leading-tight",
                            isActive ? "text-emerald-50" : "text-gray-500 dark:text-gray-400"
                          )}>{plan.description || 'Plan de prueba'}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="bg-gray-50 dark:bg-[#0D1117] p-4 rounded-xl border border-gray-100 dark:border-[#232834]">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic text-center">
                    * Al finalizar, entrarás al dashboard con tu plan seleccionado activo en <strong>modo de prueba (14 días gratis)</strong>.
                  </p>
                </div>

                <div className="pt-4 flex justify-between">
                  <button 
                    type="button" 
                    className="text-gray-500 font-medium px-4"
                    onClick={() => setCurrentStep(3)}
                  >
                    Atrás
                  </button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="rounded-xl px-12"
                    loading={loading}
                  >
                    Finalizar Registro
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="font-bold text-emerald-500 hover:text-emerald-400">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Plan Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedDetailPlan ? `Detalles Plan ${selectedDetailPlan.name}` : ''}
        size="md"
      >
        {selectedDetailPlan && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#0D1117] border border-gray-100 dark:border-[#232834]">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1E2230] flex items-center justify-center border border-gray-100 dark:border-[#232834]">
                <PlanIcon slug={selectedDetailPlan.slug} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedDetailPlan.name}</h4>
                <p className="text-sm text-gray-500">{selectedDetailPlan.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">¿Qué incluye?</h5>
              <div className="grid grid-cols-1 gap-2">
                {planFeaturesList(selectedDetailPlan).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-500/5 transition-colors group">
                    <div className="flex-shrink-0 text-emerald-500 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full rounded-xl py-3"
                onClick={() => {
                  setValue('plan_slug', selectedDetailPlan.slug);
                  setIsDetailModalOpen(false);
                }}
              >
                Elegir este Plan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegisterPage;

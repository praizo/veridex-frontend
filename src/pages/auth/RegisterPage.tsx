import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import api from '@/api/client';
 
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  organization_name: z.string().min(2, 'Organization name is required'),
  tin: z.string().min(8, 'TIN must be at least 8 characters').max(20),
  nrs_business_id: z.string().length(13, 'NRS Business ID must be exactly 13 digits'),
  service_id: z.string().length(8, 'Service ID must be exactly 8 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Verification states
  const [tinStatus, setTinStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [tinMessage, setTinMessage] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    setValue,
    control,
    formState: { errors, isSubmitting } 
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur'
  });

  const watchedTin = useWatch({
    control,
    name: 'tin'
  });

  const verifyTin = useCallback(async (tin: string) => {
    setTinStatus('checking');
    try {
      const response = await api.get(`/onboarding/verify-tin?tin=${tin}`);
      if (response.data.is_valid) {
        setTinStatus('valid');
        setTinMessage(response.data.message || 'TIN verified successfully');
        
        // Auto-fill organization name if returned
        if (response.data.data?.name) {
          setValue('organization_name', response.data.data.name, { shouldValidate: true });
        }
      } else {
        setTinStatus('invalid');
        setTinMessage(response.data.message || 'Invalid TIN format');
      }
    } catch {
      setTinStatus('invalid');
      setTinMessage('Could not verify TIN. Please check the format.');
    }
  }, [setValue]);

  // Debounced TIN Verification
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedTin && watchedTin.length >= 8) {
        verifyTin(watchedTin);
      } else {
        setTinStatus('idle');
        setTinMessage(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [watchedTin, verifyTin]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError(null);
      await registerUser(data);
      navigate('/');
    } catch (err) {
      const message = (err as any)?.response?.data?.message || 'Failed to register. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col space-y-2 text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your compliance details below to register your business.
        </p>
      </div>

      <div>
        {serverError && (
          <div className="mb-6 rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 italic">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5">
            {/* Identity Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                placeholder="Verified automatically via TIN"
                {...register('organization_name')}
              />
              {errors.organization_name && <p className="text-xs text-destructive">{errors.organization_name.message}</p>}
            </div>

            <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary">Compliance Details</h4>
                {tinStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
                  <div className="relative">
                    <Input
                      id="tin"
                      placeholder="20484017"
                      className={tinStatus === 'valid' ? 'border-emerald-500/50 pr-10' : ''}
                      {...register('tin')}
                    />
                    {tinStatus === 'valid' && (
                      <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  {tinMessage && (
                    <p className={`text-[10px] font-medium italic ${tinStatus === 'valid' ? 'text-emerald-600' : 'text-destructive'}`}>
                      {tinMessage}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nrs_business_id">NRS Business ID (13-digit)</Label>
                  <Input
                    id="nrs_business_id"
                    placeholder="1234567890123"
                    {...register('nrs_business_id')}
                  />
                  {errors.nrs_business_id && <p className="text-xs text-destructive">{errors.nrs_business_id.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="service_id">Service ID</Label>
                  <Input
                    id="service_id"
                    placeholder="94ND90NR"
                    className="uppercase"
                    {...register('service_id')}
                  />
                  {errors.service_id && <p className="text-xs text-destructive">{errors.service_id.message}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input id="password_confirmation" type="password" {...register('password_confirmation')} />
                {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || tinStatus === 'checking'}>
              {isSubmitting ? 'Creating account...' : 'Register your business'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Already have a verified account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4 transition-all">
          Sign in
        </Link>
      </div>
    </div>
  );
}


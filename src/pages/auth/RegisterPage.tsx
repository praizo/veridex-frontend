import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import api from '@/api/client';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
    <Card className="w-full max-w-lg mx-auto overflow-hidden border-none shadow-2xl bg-background/60 backdrop-blur-xl">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <CardHeader className="relative pb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">Verified Onboarding</CardTitle>
        <CardDescription className="text-base">
          Enter your compliance details to set up your FIRS-ready account.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        {serverError && (
          <div className="mb-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="font-medium italic">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5">
                {/* Identity Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            className="bg-background/50 border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 h-11"
                            {...register('name')}
                        />
                        {errors.name && <p className="text-[10px] text-destructive font-medium uppercase tracking-tight">{errors.name.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Business Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@company.com"
                            className="bg-background/50 border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 h-11"
                            {...register('email')}
                        />
                        {errors.email && <p className="text-[10px] text-destructive font-medium uppercase tracking-tight">{errors.email.message}</p>}
                    </div>
                </div>

                <hr className="border-muted/30" />

                {/* Compliance Group */}
                <div className="space-y-4 py-2 px-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Compliance Verification</h4>
                        {tinStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2 relative">
                            <Label htmlFor="tin" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Company TIN</Label>
                            <div className="relative">
                                <Input
                                    id="tin"
                                    placeholder="20484017 (Sandbox Example)"
                                    className={`bg-background h-11 transition-all ${
                                        tinStatus === 'valid' ? 'border-green-500/50 bg-green-500/5 pr-10' : 
                                        tinStatus === 'invalid' ? 'border-destructive/50 bg-destructive/5' : ''
                                    }`}
                                    {...register('tin')}
                                />
                                {tinStatus === 'valid' && (
                                    <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-green-500" />
                                )}
                            </div>
                            {tinMessage && (
                                <p className={`text-[10px] font-medium leading-tight ${tinStatus === 'valid' ? 'text-green-600' : 'text-destructive'}`}>
                                    {tinMessage}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nrs_business_id" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">NRS Business ID (13-digit TIN)</Label>
                            <Input
                                id="nrs_business_id"
                                placeholder="13-digit numeric TIN (e.g. 1234567890123)"
                                className="bg-background h-11"
                                {...register('nrs_business_id')}
                            />
                            {errors.nrs_business_id && <p className="text-[10px] text-destructive font-medium uppercase tracking-tight">{errors.nrs_business_id.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="service_id" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Service ID (sandbox: 94ND90NR)</Label>
                            <Input
                                id="service_id"
                                placeholder="8-char Alphanumeric ID"
                                className="bg-background h-11 uppercase"
                                {...register('service_id')}
                            />
                            {errors.service_id && <p className="text-[10px] text-destructive font-medium uppercase tracking-tight">{errors.service_id.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="organization_name" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Organization Name</Label>
                    <Input
                        id="organization_name"
                        placeholder="Verified automatically via TIN"
                        className="bg-background/50 h-11"
                        {...register('organization_name')}
                    />
                    {errors.organization_name && <p className="text-[10px] text-destructive font-medium uppercase tracking-tight">{errors.organization_name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="password" title="At least 8 characters" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Password</Label>
                        <Input id="password" type="password" className="bg-background/50 h-11" {...register('password')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Confirm</Label>
                        <Input id="password_confirmation" type="password" className="bg-background/50 h-11" {...register('password_confirmation')} />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98]" disabled={isSubmitting || tinStatus === 'checking'}>
                    {isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Finalizing Onboarding...</span> : 'Complete Setup'}
                </Button>
            </div>
        </form>
      </CardContent>
      
      <CardFooter className="relative bg-muted/30 py-6 border-t border-muted/50">
        <div className="text-center text-sm w-full font-medium text-muted-foreground">
          Already have a verified account?{" "}
          <Link to="/login" className="text-primary hover:underline underline-offset-4 decoration-primary/30">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}


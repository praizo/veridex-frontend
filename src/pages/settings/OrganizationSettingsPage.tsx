import {  useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '@/api/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription 
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, Save, Loader2, Globe, Phone, Mail, MapPin } from 'lucide-react';

const orgSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  tin: z.string().min(8, 'TIN must be at least 8 characters'),
  email: z.string().email('Invalid email address').nullable().or(z.literal('')),
  telephone: z.string().nullable().or(z.literal('')),
  street_name: z.string().nullable().or(z.literal('')),
  city_name: z.string().nullable().or(z.literal('')),
  postal_zone: z.string().nullable().or(z.literal('')),
  country_code: z.string().length(2, 'Country code must be 2 characters (e.g. NG)'),
  business_description: z.string().nullable().or(z.literal('')),
  service_id: z.string().length(8, 'Service ID must be 8 characters').nullable().or(z.literal('')),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function OrganizationSettingsPage() {
  const queryClient = useQueryClient();
  const { data: organization, isLoading } = useQuery({
    queryKey: ['current-organization'],
    queryFn: () => organizationApi.getCurrent().then(res => res.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
  });

  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name || '',
        tin: organization.tin || '',
        email: organization.email ?? '',
        telephone: organization.telephone ?? '',
        street_name: organization.street_name ?? '',
        city_name: organization.city_name ?? '',
        postal_zone: organization.postal_zone ?? '',
        country_code: organization.country_code ?? 'NG',
        business_description: organization.business_description ?? '',
        service_id: organization.service_id ?? '',
      });
    }
  }, [organization, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: OrgFormValues) => {
      if (!organization?.id) throw new Error("Organization ID missing");
      return organizationApi.update({ ...data, id: organization.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-organization'] });
      toast.success('Settings updated successfully');
    },
    onError: (err: any) => {
      toast.error('Failed to update settings', {
        description: err.response?.data?.message || 'Please check the form for errors.'
      });
    }
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Building2 className="w-12 h-12 text-muted-foreground/30" />
        <h3 className="text-xl font-semibold">Could not load organization</h3>
        <p className="text-muted-foreground">Please try refreshing the page or checking your internet connection.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['current-organization'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl ">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
        <p className="text-muted-foreground">Manage your business profile and FIRS compliance settings.</p>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-8">
        <Card className="overflow-hidden border border-muted/20 bg-card/60 backdrop-blur-sm">
          <CardHeader className="bg-primary/5 pb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Business Identity</CardTitle>
                    <CardDescription>Core details used for invoice generation and compliance.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input id="name" {...register('name')} placeholder="Veridex Solutions Ltd" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
                <Input id="tin" {...register('tin')} placeholder="20123456" />
                {errors.tin && <p className="text-xs text-destructive">{errors.tin.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_id">FIRS Service ID</Label>
                <Input id="service_id" {...register('service_id')} placeholder="94ND90NR" className="font-mono uppercase" />
                {errors.service_id && <p className="text-xs text-destructive">{errors.service_id.message}</p>}
                <p className="text-[10px] text-muted-foreground italic">Provided by FIRS for your specific application instance.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country_code">Country Code (ISO 3166-1)</Label>
                <Input id="country_code" {...register('country_code')} placeholder="NG" maxLength={2} className="uppercase w-20" />
                {errors.country_code && <p className="text-xs text-destructive">{errors.country_code.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea 
                id="business_description" 
                {...register('business_description')} 
                placeholder="Briefly describe your business activities..." 
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-muted/20 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-muted-foreground" /> Contact & Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-3 h-3" /> Business Email</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="hello@veridex.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="flex items-center gap-2"><Phone className="w-3 h-3" /> Telephone</Label>
                  <Input id="telephone" {...register('telephone')} placeholder="+234 800 000 0000" />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-muted/30">
                <div className="space-y-2">
                    <Label htmlFor="street_name" className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Street Name</Label>
                    <Input id="street_name" {...register('street_name')} placeholder="123 Compliance Way" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city_name">City</Label>
                        <Input id="city_name" {...register('city_name')} placeholder="Victoria Island" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postal_zone">Postal Code</Label>
                        <Input id="postal_zone" {...register('postal_zone')} placeholder="101241" />
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="px-8 shadow-lg shadow-primary/20"
          >
            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

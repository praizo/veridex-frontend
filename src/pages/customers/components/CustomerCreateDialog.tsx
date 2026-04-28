import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/api/customers';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tin: z.string().min(1, 'TIN is required').max(50, 'TIN too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country_code: z.string().max(2).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerCreateDialogProps {
  children?: React.ReactNode;
  onSuccess?: (customerId: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomerCreateDialog({ children, onSuccess, open, onOpenChange }: CustomerCreateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isModalOpen = isControlled ? open : internalOpen;
  
  const setModalOpen = (state: boolean) => {
    if (isControlled) {
      onOpenChange(state);
    } else {
      setInternalOpen(state);
    }
    
    // Reset state on close
    if (!state) {
        reset();
        setServerError(null);
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      tin: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country_code: 'NG',
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const response = await customerApi.create(data);
      // Invalidate the cache to instantly refresh dropdowns and lists
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      const newCustomer = response.data.data;
      
      setModalOpen(false);
      reset();
      
      if (onSuccess) {
         onSuccess(newCustomer.id);
      }
    } catch (err: unknown) {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred while creating the customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Register a new buyer to be linked to future NRS invoices.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
             <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {serverError}
             </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2 col-span-2">
               <Label htmlFor="name">Business Name *</Label>
               <Input id="name" {...register('name')} placeholder="e.g. Acme Corp" />
               {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="tin">Tax Id (TIN) *</Label>
               <Input id="tin" {...register('tin')} placeholder="e.g. 12435678-0001" />
               {errors.tin && <p className="text-xs text-destructive">{errors.tin.message}</p>}
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="email">Email *</Label>
               <Input id="email" type="email" {...register('email')} placeholder="contact@domain.com" />
               {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
             </div>

             <div className="space-y-2">
               <Label htmlFor="phone">Phone</Label>
               <Input id="phone" {...register('phone')} />
             </div>

             <div className="space-y-2">
               <Label htmlFor="city">City</Label>
               <Input id="city" {...register('city')} />
             </div>
             
             <div className="space-y-2 col-span-2">
               <Label htmlFor="address">Address</Label>
               <Input id="address" {...register('address')} />
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Customer
              </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

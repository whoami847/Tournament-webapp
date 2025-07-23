'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { addGateway, updateGateway } from '@/lib/gateways';
import type { Gateway } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, "Gateway name is required"),
  storePassword: z.string().min(1, "Store password is required"),
  isLive: z.boolean(),
  enabled: z.boolean(),
});

type GatewayFormValues = z.infer<typeof formSchema>;

interface GatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateway?: Gateway | null;
  onSuccess?: () => void;
}

export function GatewayDialog({ open, onOpenChange, gateway, onSuccess }: GatewayDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<GatewayFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: gateway?.name || 'RupantorPay',
      storePassword: gateway?.storePassword || '',
      isLive: gateway?.isLive || false,
      enabled: gateway?.enabled || true,
    },
  });

  const onSubmit = async (data: GatewayFormValues) => {
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (gateway) {
        // Update existing gateway
        result = await updateGateway(gateway.id, data);
      } else {
        // Create new gateway
        result = await addGateway(data);
      }
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Gateway ${gateway ? 'updated' : 'created'} successfully`,
        });
        onOpenChange(false);
        form.reset();
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {gateway ? 'Edit Gateway' : 'New Gateway'}
          </DialogTitle>
          <DialogDescription>
            {gateway 
              ? 'Update the payment gateway settings.' 
              : 'Add a new payment gateway to your system.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gateway Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="RupantorPay" 
                      {...field} 
                      disabled={true}
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="storePassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Password / Secret</FormLabel>
                  <FormControl>
                    <PasswordInput 
                      placeholder="Enter your store password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between space-x-4">
              <FormField
                control={form.control}
                name="isLive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mode</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? 'Live' : 'Sandbox'}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (gateway ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
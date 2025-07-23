'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import type { Gateway } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '../ui/switch';
import { PasswordInput } from '../ui/password-input';

const gatewaySchema = z.object({
  name: z.string().min(1, 'Gateway Name is required.'),
  storePassword: z.string().min(1, 'Store Password is required.'),
  isLive: z.boolean(),
  enabled: z.boolean(),
});

type GatewayFormValues = z.infer<typeof gatewaySchema>;

interface GatewayDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  gateway: Gateway | null;
  onSuccess: () => void;
}

export function GatewayDialog({ isOpen, onOpenChange, gateway, onSuccess }: GatewayDialogProps) {
  const { addGateway, updateGateway } = useAppStore();
  const { toast } = useToast();

  const form = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
      name: 'RupantorPay',
      storePassword: '',
      isLive: false,
      enabled: true,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (gateway) {
        form.reset({
          name: gateway.name,
          storePassword: gateway.storePassword || '',
          isLive: gateway.isLive,
          enabled: gateway.enabled,
        });
      } else {
        form.reset({
          name: 'RupantorPay',
          storePassword: '',
          isLive: false,
          enabled: true,
        });
      }
    }
  }, [gateway, form, isOpen]);

  const onSubmit = (data: GatewayFormValues) => {
    try {
      if (gateway) {
        updateGateway(gateway.id, data);
        toast({ title: 'Success', description: 'Gateway updated successfully.' });
      } else {
        addGateway(data);
        toast({ title: 'Success', description: 'Gateway created successfully.' });
      }
      onSuccess();
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{gateway ? 'Edit Gateway' : 'Add New Gateway'}</DialogTitle>
          <DialogDescription>
            {gateway ? 'Update the details for this payment gateway.' : 'Enter details for the new payment gateway.'}
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
                    <Input placeholder="e.g., RupantorPay" {...field} disabled />
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
                    <PasswordInput placeholder="Enter Store Password / Secret" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center space-x-8">
              <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                          <div className="space-y-0.5">
                              <FormLabel>Enable Gateway</FormLabel>
                              <FormMessage />
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
                  name="isLive"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                          <div className="space-y-0.5">
                              <FormLabel>Live Mode</FormLabel>
                              <FormMessage />
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
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Gateway'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { PaymentGatewaySettings } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, "Provider name is required."),
  accessToken: z.string().min(10, "A valid access token is required."),
  checkoutUrl: z.string().url("Please enter a valid URL for checkout."),
  verifyUrl: z.string().url("Please enter a valid URL for verification."),
});

type GatewayFormValues = z.infer<typeof formSchema>;

interface GatewayFormProps {
    settings: Omit<PaymentGatewaySettings, 'id'>;
    onSubmit: (data: GatewayFormValues) => void;
    isSubmitting: boolean;
}

export function GatewayForm({ settings, onSubmit, isSubmitting }: GatewayFormProps) {
    const form = useForm<GatewayFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: settings?.name || '',
            accessToken: settings?.accessToken || '',
            checkoutUrl: settings?.checkoutUrl || '',
            verifyUrl: settings?.verifyUrl || '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Provider Name</FormLabel><FormControl><Input placeholder="e.g., RupantorPay" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="accessToken" render={({ field }) => (
                    <FormItem><FormLabel>Access Token</FormLabel><FormControl><Input type="password" placeholder="Your secret access token" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="checkoutUrl" render={({ field }) => (
                    <FormItem><FormLabel>Checkout URL</FormLabel><FormControl><Input placeholder="https://provider.com/api/checkout" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="verifyUrl" render={({ field }) => (
                    <FormItem><FormLabel>Verify Payment URL</FormLabel><FormControl><Input placeholder="https://provider.com/api/verify" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
            </form>
        </Form>
    );
}

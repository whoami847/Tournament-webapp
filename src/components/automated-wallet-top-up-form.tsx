'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CreditCard, Landmark } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce.number().min(1, { message: "Amount must be greater than 0." }),
});

export function AutomatedWalletTopUpForm() {
  const { toast } = useToast();
  const { currentUser, setAuthDialogOpen, gateways } = useAppStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!currentUser || !currentUser.email) {
      toast({
        title: "Login Required",
        description: "You must be logged in to top-up your wallet.",
        variant: "destructive",
      });
      setAuthDialogOpen(true);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      amount: values.amount,
      userId: currentUser.uid,
      customer_name: currentUser.email.split('@')[0],
      customer_email: currentUser.email,
      customer_phone: '01000000000', // Placeholder phone
    };
    
    try {
        const response = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.payment_url) {
            window.location.href = result.payment_url;
        } else {
            throw new Error(result.message || 'Failed to initiate payment.');
        }

    } catch (error) {
      console.error("Failed to submit top-up request", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const enabledGateways = (gateways || []).filter(g => g.enabled);

  return (
    <div className="space-y-6">
       <Alert className="bg-secondary/50 border-secondary-foreground/10">
          <CreditCard className="h-4 w-4" />
          <AlertTitle className="font-bold">Pay Securely</AlertTitle>
          <AlertDescription>
            Enter the amount. You will be redirected to a secure page to complete your payment.
          </AlertDescription>
      </Alert>
      
      {enabledGateways.length === 0 && (
         <div className="text-center text-muted-foreground py-8 border rounded-lg">
            <Landmark className="mx-auto h-10 w-10 mb-2" />
            <p>No automated payment gateways are currently enabled.</p>
            <p className="text-sm">Please use the Manual Top-up option or contact support.</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top-up Amount (৳) *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter the amount to add" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            size="lg" 
            className="w-full" 
            disabled={isSubmitting || enabledGateways.length === 0}
          >
            {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
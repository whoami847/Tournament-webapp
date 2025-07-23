'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getActiveGateways } from '@/lib/gateways';
import type { Gateway } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TopUpPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadGateways = async () => {
      try {
        const activeGateways = await getActiveGateways();
        setGateways(activeGateways);
      } catch (error) {
        console.error('Error loading gateways:', error);
        toast({
          title: "Error",
          description: "Failed to load payment gateways",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadGateways();
  }, [toast]);

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleQuickAmountClick = (value: number) => {
    setAmount(value.toString());
  };

  const handleAutomatedTopUp = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) < 10) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least 10 TK",
        variant: "destructive",
      });
      return;
    }

    if (gateways.length === 0) {
      toast({
        title: "No Payment Gateway",
        description: "No automated payment gateways are currently enabled",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (result.success && result.payment_url) {
        // Redirect to payment gateway
        window.location.href = result.payment_url;
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to initiate payment",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Top Up Wallet</h1>
          <p className="text-muted-foreground">
            Add money to your wallet to participate in tournaments
          </p>
        </div>
      </div>

      <Tabs defaultValue="automated" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automated" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Automated Top-up
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Manual Top-up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {gateways.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No automated payment gateways are currently enabled. 
                    Please use manual top-up or contact support.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (TK)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        TK
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10"
                        min="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Quick Amounts</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {quickAmounts.map((value) => (
                        <Button
                          key={value}
                          type="button"
                          variant={amount === value.toString() ? "default" : "outline"}
                          onClick={() => handleQuickAmountClick(value)}
                          className="h-10"
                        >
                          {value} TK
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleAutomatedTopUp}
                      disabled={isProcessing || !amount || parseFloat(amount) < 10}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Proceed to Payment'
                      )}
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>• Minimum amount: 10 TK</p>
                    <p>• Payment will be processed securely through RupantorPay</p>
                    <p>• Your wallet will be updated automatically after successful payment</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Top-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  For manual top-up, please contact our support team with your 
                  payment details. Manual top-ups may take 1-24 hours to process.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Payment Methods:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• bKash: 01XXXXXXXXX</li>
                    <li>• Nagad: 01XXXXXXXXX</li>
                    <li>• Rocket: 01XXXXXXXXX-X</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Instructions:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Send money to any of the above numbers</li>
                    <li>2. Take a screenshot of the transaction</li>
                    <li>3. Contact support with transaction details</li>
                    <li>4. Wait for confirmation and wallet update</li>
                  </ol>
                </div>

                <Button asChild className="w-full">
                  <Link href="/support">
                    Contact Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
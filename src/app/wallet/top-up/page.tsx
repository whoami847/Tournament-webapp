'use client';

import { AutomatedWalletTopUpForm } from '@/components/automated-wallet-top-up-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WalletTopUpPage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="automated" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automated">Automated Top-up</TabsTrigger>
            <TabsTrigger value="manual">Manual Top-up</TabsTrigger>
          </TabsList>
          <TabsContent value="automated">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold font-headline text-center">Automated Wallet Top-up</CardTitle>
              </CardHeader>
              <CardContent>
                <AutomatedWalletTopUpForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold font-headline text-center">Manual Wallet Top-up</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">Manual top-up functionality will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
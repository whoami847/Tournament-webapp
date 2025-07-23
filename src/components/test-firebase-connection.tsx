'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWithdrawMethodsStream, addWithdrawMethod } from '@/lib/withdraw-methods-service';
import { useToast } from '@/hooks/use-toast';

export function TestFirebaseConnection() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isAddingTestMethod, setIsAddingTestMethod] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string>('');
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult('Testing connection...');

    try {
      // Test reading withdrawal methods
      const unsubscribe = getWithdrawMethodsStream((methods) => {
        setConnectionResult(`Connection successful! Found ${methods.length} withdrawal methods.`);
        console.log('Retrieved methods:', methods);
        unsubscribe(); // Cleanup
      });

      setTimeout(() => {
        if (connectionResult === 'Testing connection...') {
          setConnectionResult('Connection timeout - check Firebase configuration');
        }
        setIsTestingConnection(false);
      }, 5000);
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionResult(`Connection failed: ${error.message}`);
      setIsTestingConnection(false);
    }
  };

  const addTestMethod = async () => {
    setIsAddingTestMethod(true);
    
    const testMethod = {
      name: "Test bKash",
      receiverInfo: "Test: 01700000000",
      feePercentage: 2.5,
      minAmount: 50,
      maxAmount: 5000,
      status: "active" as const
    };

    try {
      const result = await addWithdrawMethod(testMethod);
      if (result.success) {
        toast({
          title: "Success!",
          description: "Test withdrawal method added successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add test method.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding test method:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsAddingTestMethod(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Firebase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={isTestingConnection}
          className="w-full"
        >
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
        
        <Button 
          onClick={addTestMethod} 
          disabled={isAddingTestMethod}
          variant="outline"
          className="w-full"
        >
          {isAddingTestMethod ? 'Adding...' : 'Add Test Method'}
        </Button>
        
        {connectionResult && (
          <div className="p-3 bg-muted rounded-md text-sm">
            {connectionResult}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
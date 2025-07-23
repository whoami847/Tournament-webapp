'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parse } from 'date-fns';
import type { Transaction } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="p-4">
          <CardContent className="p-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    try {
                      const date = parse(transaction.date, 'dd/MM/yyyy, HH:mm:ss', new Date());
                      return format(date, 'PPp');
                    } catch (e) {
                      return transaction.date;
                    }
                  })()}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount > 0 ? '+' : ''}৳{Math.abs(transaction.amount).toFixed(2)}
                </p>
                <Badge 
                  variant={
                    transaction.status === 'Completed' ? 'default' : 
                    transaction.status === 'Pending' ? 'secondary' : 
                    'destructive'
                  }
                  className={
                    transaction.status === 'Completed' ? 'bg-green-500' : ''
                  }
                >
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
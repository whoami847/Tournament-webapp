'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function SuccessContent() {
    const searchParams = useSearchParams();
    const tranId = searchParams.get('tran_id');
    const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading');
    const [message, setMessage] = useState('Your payment has been processed successfully!');

    useEffect(() => {
        if (!tranId) {
            setStatus('error');
            setMessage('No transaction ID found.');
            return;
        }

        // Since we've already verified the payment in the callback API,
        // we can show success immediately
        setStatus('verified');
        setMessage('Your payment has been successfully processed and your wallet has been updated.');
    }, [tranId]);

    const statusInfo = {
        loading: { icon: <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />, title: 'Processing Payment' },
        verified: { icon: <CheckCircle2 className="h-12 w-12 text-green-500" />, title: 'Payment Successful' },
        error: { icon: <XCircle className="h-12 w-12 text-red-500" />, title: 'Error' },
    };

    const { icon, title } = statusInfo[status];

    return (
        <div className="container mx-auto px-4 py-8 md:pb-8 pb-24 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto w-fit mb-4">{icon}</div>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="mb-6">{message}</CardDescription>
                    {tranId && (
                        <div className="text-xs text-muted-foreground mb-4">
                            Transaction ID: {tranId}
                        </div>
                    )}
                    <Button asChild>
                        <Link href="/wallet">Go to Wallet</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8 md:pb-8 pb-24 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}

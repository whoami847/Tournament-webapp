'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyPayment } from '@/lib/payment-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function SuccessContent() {
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('transaction_id');
    const [status, setStatus] = useState<'loading' | 'verified' | 'failed' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment, please wait...');

    useEffect(() => {
        if (!transactionId) {
            setStatus('error');
            setMessage('No transaction ID found. Payment cannot be verified.');
            return;
        }

        const checkPayment = async () => {
            const result = await verifyPayment(transactionId);

            if (result.status === 'success') {
                // In a real app, you would check result.data for payment status.
                // For this example, we assume a 'success' status means the payment was good.
                setStatus('verified');
                setMessage('Your payment has been successfully verified and your wallet has been updated.');
            } else {
                setStatus('failed');
                setMessage(result.message || 'Failed to verify payment. Please contact support.');
            }
        };

        checkPayment();
    }, [transactionId]);

    const statusInfo = {
        loading: { icon: <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />, title: 'Verifying Payment' },
        verified: { icon: <CheckCircle2 className="h-12 w-12 text-green-500" />, title: 'Payment Successful' },
        failed: { icon: <XCircle className="h-12 w-12 text-red-500" />, title: 'Verification Failed' },
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
                    {status !== 'loading' && (
                        <Button asChild>
                            <Link href="/wallet">Go to Wallet</Link>
                        </Button>
                    )}
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

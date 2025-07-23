import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailPage() {
    return (
        <div className="container mx-auto px-4 py-8 md:pb-8 pb-24 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto w-fit mb-4">
                        <XCircle className="h-12 w-12 text-red-500" />
                    </div>
                    <CardTitle>Payment Failed</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="mb-6">Unfortunately, your payment could not be processed. Please try again or use a different payment method.</CardDescription>
                    <Button asChild>
                        <Link href="/wallet">Try Again</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

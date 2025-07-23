import { Loader2 } from 'lucide-react';

export default function FullPageLoader() {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-background fixed inset-0 z-50">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}

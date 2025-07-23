'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import FullPageLoader from './loader';
import { type ReactNode, useEffect } from 'react';
import { signOutUser } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function AuthGuard({ children }: { children: ReactNode }) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    useEffect(() => {
        if (!loading && profile?.status === 'banned') {
            signOutUser();
            toast({
                title: 'Access Denied',
                description: 'Your account has been banned by an administrator.',
                variant: 'destructive'
            });
            // The onAuthStateChanged listener will handle the redirect to /login
        }
    }, [profile, loading, toast]);
    
    useEffect(() => {
        // Don't run redirect logic while loading or if user is banned
        if (loading || profile?.status === 'banned') return;

        const pathIsPublic = PUBLIC_ROUTES.includes(pathname);

        // If user is not logged in and trying to access a protected route, redirect to login
        if (!user && !pathIsPublic) {
            router.replace('/login');
        }
        
        // If user is logged in and trying to access a public route (login/register), redirect to home
        if (user && pathIsPublic) {
            router.replace('/');
        }
    }, [user, profile, loading, pathname, router]);

    const pathIsPublic = PUBLIC_ROUTES.includes(pathname);

    // Show a loader if auth state is loading, or if user is banned (and will be logged out)
    if (loading || profile?.status === 'banned') {
        return <FullPageLoader />;
    }

    // Determine if a redirect is needed and show a loader while it's in progress.
    // This prevents rendering the wrong page for a split second.
    if (!user && !pathIsPublic) {
        return <FullPageLoader />; // Will be redirected to /login
    }

    if (user && pathIsPublic) {
        return <FullPageLoader />; // Will be redirected to /
    }

    // If we reach here, the state is valid for the current route, so render the children.
    return <>{children}</>;
}

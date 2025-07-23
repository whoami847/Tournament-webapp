'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Swords, Gamepad2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUsersStream } from '@/lib/users-service';
import { getTournamentsStream } from '@/lib/tournaments-service';
import type { PlayerProfile, Tournament } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon: Icon, loading, subtext }: { title: string; value: number; icon: React.ElementType; loading: boolean; subtext?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? (
                <Skeleton className="h-7 w-12" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
            {subtext && !loading && (
                 <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
        </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
    const [userCount, setUserCount] = useState(0);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingTournaments, setLoadingTournaments] = useState(true);

    useEffect(() => {
        const unsubUsers = getUsersStream((users: PlayerProfile[]) => {
            setUserCount(users.length);
            setLoadingUsers(false);
        });

        const unsubTournaments = getTournamentsStream((data: Tournament[]) => {
            setTournaments(data);
            setLoadingTournaments(false);
        });

        return () => {
            unsubUsers();
            unsubTournaments();
        };
    }, []);

    const liveTournaments = tournaments.filter(t => t.status === 'live').length;
    const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
    const totalTournaments = tournaments.length;
    
    const isLoading = loadingUsers || loadingTournaments;

    return (
        <div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <Button asChild className="flex-1 sm:flex-auto">
                        <Link href="/admin/users">Users</Link>
                    </Button>
                    <Button asChild className="flex-1 sm:flex-auto">
                        <Link href="/admin/tournaments">Tournaments</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Users" 
                    value={userCount} 
                    icon={Users} 
                    loading={isLoading} 
                    subtext="Registered in the app"
                />
                <StatCard 
                    title="Total Tournaments" 
                    value={totalTournaments} 
                    icon={Swords} 
                    loading={isLoading} 
                    subtext="All time"
                />
                <StatCard 
                    title="Live Tournaments" 
                    value={liveTournaments} 
                    icon={Gamepad2} 
                    loading={isLoading} 
                    subtext="Currently active"
                />
                <StatCard 
                    title="Completed Tournaments" 
                    value={completedTournaments} 
                    icon={ShieldCheck} 
                    loading={isLoading} 
                    subtext="Finished"
                />
            </div>
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <p className="text-muted-foreground">Activity feed coming soon...</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Swords, Gamepad2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUsersStream } from '@/lib/users-service';
import { getTournamentsStream } from '@/lib/tournaments-service';
import type { PlayerProfile, Tournament } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon: Icon, loading, subtext, index }: { title: string; value: number; icon: React.ElementType; loading: boolean; subtext?: string; index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
    >
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </motion.div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-7 w-12" />
                ) : (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 300 }}
                        className="text-2xl font-bold"
                    >
                        {value}
                    </motion.div>
                )}
                {subtext && !loading && (
                     <p className="text-xs text-muted-foreground">{subtext}</p>
                )}
            </CardContent>
        </Card>
    </motion.div>
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-6"
            >
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex w-full sm:w-auto items-center gap-2"
                >
                    <Button asChild className="flex-1 sm:flex-auto">
                        <Link href="/admin/users">Users</Link>
                    </Button>
                    <Button asChild className="flex-1 sm:flex-auto">
                        <Link href="/admin/tournaments">Tournaments</Link>
                    </Button>
                </motion.div>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Users" 
                    value={userCount} 
                    icon={Users} 
                    loading={isLoading} 
                    subtext="Registered in the app"
                    index={0}
                />
                <StatCard 
                    title="Total Tournaments" 
                    value={totalTournaments} 
                    icon={Swords} 
                    loading={isLoading} 
                    subtext="All time"
                    index={1}
                />
                <StatCard 
                    title="Live Tournaments" 
                    value={liveTournaments} 
                    icon={Gamepad2} 
                    loading={isLoading} 
                    subtext="Currently active"
                    index={2}
                />
                <StatCard 
                    title="Completed Tournaments" 
                    value={completedTournaments} 
                    icon={ShieldCheck} 
                    loading={isLoading} 
                    subtext="Finished"
                    index={3}
                />
            </div>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8"
            >
                <Card className="hover:shadow-lg transition-shadow duration-300">
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
            </motion.div>
        </motion.div>
    );
}
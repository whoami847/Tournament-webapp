
'use client';

import { useState, useEffect } from 'react';
import { getPlayersStream } from '@/lib/users-service';
import type { PlayerProfile } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, Trophy } from 'lucide-react';

const LeaderboardRow = ({ player, rank }: { player: PlayerProfile, rank: number }) => {
    const rankColor = rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-600' : 'text-muted-foreground';

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-card border">
            <div className={`flex items-center justify-center w-8 font-bold text-lg ${rankColor}`}>
                {rank <= 3 ? <Trophy className="h-6 w-6" /> : rank}
            </div>
            <Avatar className="h-12 w-12 border-2 border-primary/50">
                <AvatarImage src={player.avatar} alt={player.name} data-ai-hint="gamer avatar" />
                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <p className="font-bold text-base">{player.name}</p>
                <p className="text-sm text-muted-foreground">{player.gamerId}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-primary text-lg">{player.winrate}%</p>
                <p className="text-xs text-muted-foreground">{player.games} Games Played</p>
            </div>
        </div>
    );
};

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<PlayerProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = getPlayersStream((data) => {
            setPlayers(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const topPlayer = players[0];
    const otherPlayers = players.slice(1);

    return (
        <div className="container mx-auto px-4 py-8 md:pb-8 pb-24">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight">Leaderboard</h1>
                <p className="text-muted-foreground mt-2">See who's dominating the competition.</p>
            </header>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                </div>
            ) : players.length > 0 ? (
                <div className="space-y-8">
                    {topPlayer && (
                        <Card className="border-amber-400 bg-amber-500/10">
                            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-amber-400">
                                        <AvatarImage src={topPlayer.avatar} alt={topPlayer.name} />
                                        <AvatarFallback>{topPlayer.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Crown className="absolute -top-2 -right-2 h-8 w-8 text-amber-400 rotate-12" />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-500">Rank 1</p>
                                    <h2 className="text-3xl font-bold">{topPlayer.name}</h2>
                                    <p className="text-muted-foreground">{topPlayer.gamerId}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-primary">{topPlayer.winrate}%</p>
                                    <p className="text-sm text-muted-foreground">Win Rate</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        {otherPlayers.map((player, index) => (
                            <LeaderboardRow key={player.id} player={player} rank={index + 2} />
                        ))}
                    </div>
                </div>
            ) : (
                 <div className="text-center py-16 border border-dashed rounded-lg">
                    <h3 className="text-xl font-medium">No Players Found</h3>
                    <p className="text-muted-foreground mt-2">There is no player data to display on the leaderboard yet.</p>
                </div>
            )}
        </div>
    );
}

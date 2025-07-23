'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getGamesStream } from '@/lib/games-service';
import type { GameCategory } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const GameCard = ({ game, index }: { game: GameCategory; index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
    >
        <Link href={`/games/${game.id}`} className="block group">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50">
                <div className="relative aspect-video">
                    <Image
                        src={game.image}
                        alt={game.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={game.dataAiHint}
                    />
                </div>
                <CardContent className="p-4">
                    <h3 className="text-lg font-bold transition-colors duration-300 group-hover:text-primary">{game.name}</h3>
                    <p className="text-sm text-muted-foreground">{game.categories}</p>
                </CardContent>
            </Card>
        </Link>
    </motion.div>
);

const GamesGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        ))}
    </div>
);

export default function GamesPage() {
    const [games, setGames] = useState<GameCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = getGamesStream((data) => {
            setGames(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 md:pb-8 pb-24">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight">Supported Games</h1>
                <p className="text-muted-foreground mt-2">Explore the games featured in our tournaments.</p>
            </header>

            {loading ? (
                <GamesGridSkeleton />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {games.map((game, index) => (
                        <GameCard key={game.id} game={game} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
}

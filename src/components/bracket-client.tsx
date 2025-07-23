'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentStream } from '@/lib/tournaments-service';
import Bracket, { SoloBracket, processBracketForWinners, ChampionCard, ChampionPlaceholder } from '@/components/bracket';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreHorizontal, Trophy, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tournament } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const roundAbbreviationMap: Record<string, string> = {
    'Finals': 'Finals',
    'Semi-finals': 'Semis',
    'Quarter-finals': 'Quarters',
    'Round of 16': 'R16',
    'Round of 32': 'R32',
    'Round of 64': 'R64',
};

export default function BracketClient({ initialTournament }: { initialTournament: Tournament }) {
  const [tournament, setTournament] = useState<Tournament>(initialTournament);

  useEffect(() => {
    if (initialTournament.id) {
      const unsubscribe = getTournamentStream(initialTournament.id, (data) => {
        if (data) {
          setTournament(data);
        } else {
          notFound();
        }
      });
      return () => unsubscribe();
    }
  }, [initialTournament.id]);

  const isSoloTournament = useMemo(() => tournament?.format.toLowerCase().includes('solo'), [tournament]);

  const bracketData = useMemo(() => {
    if (!tournament) return [];
    return tournament.bracket;
  }, [tournament]);

  const winner = useMemo(() => {
    if (!tournament || tournament.status !== 'completed' || !bracketData || bracketData.length === 0) {
        return null;
    }
    const processed = processBracketForWinners(bracketData);
    const finalRound = processed[processed.length - 1];
    if (!finalRound || finalRound.matches.length !== 1) return null;
    const finalMatch = finalRound.matches[0];
    if (finalMatch.status !== 'completed' || !finalMatch.teams[0] || !finalMatch.teams[1]) return null;
    const [team1, team2] = finalMatch.teams;
    const [score1, score2] = finalMatch.scores;
    return score1 > score2 ? team1 : team2;
  }, [tournament, bracketData]);

  const [activeRoundName, setActiveRoundName] = useState('');
  useEffect(() => {
      if (bracketData.length > 0) {
          setActiveRoundName(bracketData[0].name);
      }
  }, [bracketData]);
  
  if (!tournament) {
      notFound();
  }

  const roundNames = bracketData?.map(r => r.name) ?? [];

  const BracketHeader = () => (
    <header className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" asChild>
        <Link href={`/tournaments/${tournament.id}`}>
            <ChevronLeft className="h-6 w-6" />
        </Link>
        </Button>
        <h1 className="text-xl font-bold">Bracket</h1>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-6 w-6" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Share Bracket</DropdownMenuItem>
                <DropdownMenuItem>View Rules</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Report an issue</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </header>
  );

  if (!isSoloTournament && (!bracketData || bracketData.length === 0)) {
    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col p-4">
            <BracketHeader />
            <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center">The bracket for this tournament is not available yet.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="bg-background min-h-screen text-foreground pb-24">
        <div className="container mx-auto px-4 py-4">
            <BracketHeader />
            {isSoloTournament ? (
                <SoloBracket tournament={tournament} />
            ) : (
                <Tabs defaultValue="bracket" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-card p-1 rounded-full h-auto">
                        <TabsTrigger value="bracket" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                            <GitBranch className="h-4 w-4" />
                            Bracket
                        </TabsTrigger>
                        <TabsTrigger value="winner" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Winner
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="bracket" className="mt-6">
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex items-center justify-center rounded-full bg-card p-1 text-card-foreground">
                                {roundNames.map(name => (
                                <Button
                                    key={name}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                    "rounded-full h-8 px-4 font-semibold",
                                    activeRoundName === name 
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                        : 'text-muted-foreground hover:bg-accent/50'
                                    )}
                                    onClick={() => setActiveRoundName(name)}
                                >
                                    {roundAbbreviationMap[name] || name}
                                </Button>
                                ))}
                            </div>
                        </div>
                        <Bracket tournament={tournament} bracket={bracketData} activeRoundName={activeRoundName} />
                    </TabsContent>
                    <TabsContent value="winner" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Tournament Winner</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center items-center py-16">
                               {winner ? <ChampionCard team={winner} /> : <ChampionPlaceholder />}
                            </CardContent>
                         </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    </div>
  );
}

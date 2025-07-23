
'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { getTournamentsStream } from '@/lib/tournaments-service';
import type { Tournament, PlayerProfile, Team } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- Re-designed Match Result Card ---

const TeamDisplay = ({ team }: { team: Team | null }) => (
    <div className="flex flex-col items-center gap-2 w-24 text-center">
        {team?.avatar ? (
            <Avatar className="h-16 w-16">
                <AvatarImage src={team.avatar} alt={team.name || 'Team'} data-ai-hint="team logo" />
                <AvatarFallback>{team.name?.charAt(0) || 'T'}</AvatarFallback>
            </Avatar>
        ) : (
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                    <path d="M0 8.81V7.15L5.43 7.15V0H7.34V7.15L12.77 7.15V8.81L7.34 8.81V16H5.43V8.81H0Z" />
                </svg>
            </div>
        )}
        <p className="font-semibold text-sm truncate">{team?.name || 'Team'}</p>
    </div>
);

const MatchResultCard = ({ tournament, profile }: { tournament: Tournament; profile: PlayerProfile }) => {
    const userTeam = useMemo(() => 
        tournament.participants.find(p => p.members?.some(m => m.gamerId === profile.gamerId)),
        [tournament.participants, profile.gamerId]
    );

    if (!userTeam) return null;

    let match, team1, team2, score1, score2, result;
    
    if (tournament.status === 'completed') {
        const userMatches = tournament.bracket
            .flatMap(round => round.matches)
            .filter(m => m.status === 'completed' && m.teams.some(t => t?.id === userTeam.id))
            .sort((a,b) => tournament.bracket.findIndex(r => r.matches.includes(b)) - tournament.bracket.findIndex(r => r.matches.includes(a)));
        
        match = userMatches[0];
        if (!match || !match.teams[0] || !match.teams[1]) return null;

        team1 = match.teams[0];
        team2 = match.teams[1];
        score1 = match.scores[0];
        score2 = match.scores[1];

        if (score1 > score2) {
            result = team1.id === userTeam.id ? 'Victory' : 'Defeat';
        } else if (score2 > score1) {
            result = team2.id === userTeam.id ? 'Victory' : 'Defeat';
        } else {
             result = 'Draw';
        }

    } else { // 'live'
        const liveMatch = tournament.bracket
            .flatMap(r => r.matches)
            .find(m => m.status === 'live' && m.teams.some(t => t?.id === userTeam.id));
        
        match = liveMatch || tournament.bracket.flatMap(r => r.matches).find(m => m.teams.some(t => t?.id === userTeam.id) && m.status !== 'completed');
        if (!match) return null;

        team1 = match.teams[0];
        team2 = match.teams[1];
        score1 = match.scores[0];
        score2 = match.scores[1];
        result = 'Live';
    }

    const badgeClasses = 
        result === 'Victory' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
        result === 'Defeat' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
        'bg-primary/20 text-primary border-primary/30';

    return (
        <Card className="bg-card/50 p-4">
            <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">{tournament.name} • {tournament.game}</p>
                    <Badge variant="outline" className={badgeClasses}>{result}</Badge>
                </div>
                <div className="flex justify-around items-center">
                    <TeamDisplay team={team1} />
                    <div className="text-center">
                        <p className="text-4xl font-bold">{score1} <span className="text-2xl text-muted-foreground mx-2">vs</span> {score2}</p>
                        <p className="text-xs text-muted-foreground mt-2">{format(new Date(tournament.startDate), 'dd.MM.yyyy')}</p>
                    </div>
                    <TeamDisplay team={team2} />
                </div>
            </CardContent>
        </Card>
    );
};


// --- Main Page Component ---
export default function ResultsPage() {
    const { profile, loading: authLoading } = useAuth();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (profile?.gamerId) {
            const unsubscribe = getTournamentsStream((allTournaments) => {
                const userTournaments = allTournaments.filter(t => 
                    t.participants.some(p => p.members?.some(m => m.gamerId === profile.gamerId)) &&
                    (t.status === 'live' || t.status === 'completed')
                );
                setTournaments(userTournaments);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [profile, authLoading]);
    
    const liveTournaments = useMemo(() => {
        return tournaments
            .filter(t => t.status === 'live')
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [tournaments]);

    const completedTournaments = useMemo(() => {
        return tournaments
            .filter(t => t.status === 'completed')
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [tournaments]);

    if (loading || authLoading) {
        return (
            <div className="container mx-auto px-4 py-8 md:pb-8 pb-24 flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8 md:pb-8 pb-24 text-center h-[60vh] flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold">Please log in</h2>
                <p className="text-muted-foreground mt-2">Log in to see your match history.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 md:pb-8 pb-24 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Match History</h1>
                <p className="text-muted-foreground">Review your live and completed matches.</p>
            </header>
            
            <main className="space-y-8">
                {liveTournaments.length > 0 && (
                     <section>
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            Live
                        </h2>
                        <div className="space-y-4">
                            {liveTournaments.map(tournament => (
                                <MatchResultCard key={tournament.id} tournament={tournament} profile={profile} />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Recent Matches</h2>
                        <span className="text-sm text-muted-foreground">{completedTournaments.length} matches</span>
                    </div>
                     {completedTournaments.length > 0 ? (
                        <div className="space-y-4">
                            {completedTournaments.map(tournament => (
                                <MatchResultCard key={tournament.id} tournament={tournament} profile={profile} />
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-card/50">
                            <CardContent className="p-10 text-center text-muted-foreground">
                                You have no completed matches.
                            </CardContent>
                        </Card>
                    )}
                </section>
            </main>
        </div>
    );
}


'use client';

import { useState, useMemo, useEffect } from 'react';
import { getTournamentsStream } from '@/lib/tournaments-service';
import type { Tournament, Team, TeamMember } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Users, User, Calendar, Shield } from 'lucide-react';

const RegistrationLogSkeleton = () => (
    <Card>
        <CardHeader>
            <CardTitle>Registration Log</CardTitle>
            <CardDescription>View participant and team registrations for all tournaments.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const PlayerCard = ({ player }: { player: TeamMember }) => (
    <div className="flex items-center gap-3 p-2 rounded-md bg-background border">
        <Avatar className="h-8 w-8">
            <AvatarImage src={player.avatar} alt={player.name} />
            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <p className="font-semibold text-sm">{player.name}</p>
            <p className="text-xs text-muted-foreground">{player.gamerId}</p>
        </div>
    </div>
)

const TournamentDetails = ({ tournament }: { tournament: Tournament }) => {
    const isSolo = tournament.format.toUpperCase().includes('SOLO');

    if (tournament.participants.length === 0) {
        return <p className="text-center text-muted-foreground p-4">No participants have registered yet.</p>;
    }

    if (isSolo) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-2">
                {tournament.participants.map(participant => (
                    <PlayerCard key={participant.id} player={participant.members?.[0] || { name: participant.name, gamerId: 'N/A' }} />
                ))}
            </div>
        );
    }

    return (
        <Accordion type="multiple" className="w-full space-y-2 p-2">
            {tournament.participants.map(team => (
                <AccordionItem key={team.id} value={team.id} className="border bg-muted/20 rounded-lg px-3">
                    <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={team.avatar} alt={team.name} data-ai-hint={team.dataAiHint} />
                                <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{team.name}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                            {(team.members || []).map(member => (
                                <PlayerCard key={member.gamerId} player={member} />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

export default function AdminRequestsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

    useEffect(() => {
        const unsubscribe = getTournamentsStream((data) => {
            setTournaments(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredTournaments = useMemo(() => {
        if (selectedStatus === 'all') {
            return tournaments;
        }
        return tournaments.filter(t => t.status === selectedStatus);
    }, [tournaments, selectedStatus]);

    if (loading) {
        return <RegistrationLogSkeleton />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registration Log</CardTitle>
                <CardDescription>View participant and team registrations for all tournaments.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <Button variant={selectedStatus === 'all' ? 'default' : 'ghost'} size="sm" className="rounded-full h-8 px-4 capitalize" onClick={() => setSelectedStatus('all')}>All</Button>
                    <Button variant={selectedStatus === 'upcoming' ? 'default' : 'ghost'} size="sm" className="rounded-full h-8 px-4 capitalize" onClick={() => setSelectedStatus('upcoming')}>Upcoming</Button>
                    <Button variant={selectedStatus === 'live' ? 'default' : 'ghost'} size="sm" className="rounded-full h-8 px-4 capitalize" onClick={() => setSelectedStatus('live')}>Live</Button>
                    <Button variant={selectedStatus === 'completed' ? 'default' : 'ghost'} size="sm" className="rounded-full h-8 px-4 capitalize" onClick={() => setSelectedStatus('completed')}>Completed</Button>
                </div>

                <Accordion type="multiple" className="w-full space-y-4">
                    {filteredTournaments.length > 0 ? filteredTournaments.map((tournament) => (
                        <AccordionItem key={tournament.id} value={tournament.id} className="border bg-card rounded-lg px-4 shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row justify-between w-full sm:items-center gap-2 text-left">
                                    <div>
                                        <p className="font-bold text-base">{tournament.name}</p>
                                        <p className="text-sm text-muted-foreground">{tournament.game}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground self-start sm:self-center sm:justify-end">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            <span>{format(new Date(tournament.startDate), 'PPP')}</span>
                                        </div>
                                         <div className="flex items-center gap-1.5">
                                            <Shield className="h-4 w-4" />
                                            <span className="capitalize">{tournament.format.split('_')[1] || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4" />
                                            <span>{tournament.participants.length} / {tournament.maxTeams}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <TournamentDetails tournament={tournament} />
                            </AccordionContent>
                        </AccordionItem>
                    )) : (
                        <div className="text-center py-16 border border-dashed rounded-lg">
                            <h3 className="text-xl font-medium">No Tournaments Found</h3>
                            <p className="text-muted-foreground mt-2">No tournaments match the selected status.</p>
                        </div>
                    )}
                </Accordion>
            </CardContent>
        </Card>
    );
}

'use client';

import { useState, useEffect } from 'react';
import type { Round, Team, Match, Tournament } from '@/types';
import { produce } from 'immer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Trophy, Crown, User, CheckCircle, Clock, Send, Hourglass, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { requestMatchResults, setMatchWinner, undoMatchResult, updateTournament, updateMatchDetails } from '@/lib/tournaments-service';
import { Input } from '@/components/ui/input';


// --- HELPER COMPONENTS ---

const RoomDetailsEditor = ({ match, tournamentId, onUpdate }: { match: Match; tournamentId: string; onUpdate: () => void }) => {
    const { toast } = useToast();
    const [roomId, setRoomId] = useState(match.roomId || '');
    const [roomPass, setRoomPass] = useState(match.roomPass || '');
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async () => {
        setIsPublishing(true);
        const result = await updateMatchDetails(tournamentId, match.id, { roomId, roomPass });
        if (result.success) {
            toast({ title: "Room Details Published" });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsPublishing(false);
    };

    return (
        <div className="border-t border-border/50 p-2 space-y-2">
            <div className="flex gap-2">
                <Input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="h-8 text-xs" disabled={isPublishing} />
                <Input placeholder="Password" value={roomPass} onChange={(e) => setRoomPass(e.target.value)} className="h-8 text-xs" disabled={isPublishing} />
            </div>
            <Button size="sm" className="w-full h-7 text-xs" onClick={handlePublish} disabled={isPublishing || !roomId || !roomPass}>
                {isPublishing ? "Publishing..." : "Publish Details"}
            </Button>
        </div>
    );
};

const TeamDisplayWithWinButton = ({ team, onSetWinner }: { team: Team, onSetWinner: () => void }) => {
    return (
        <div className="flex items-center justify-between p-2 h-11 w-full">
            <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={team.avatar} alt={team.name} data-ai-hint="team logo" />
                    <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate font-medium text-foreground">
                    {team.name.startsWith('Team ') ? (team.members || []).map(m => m.name).join(' & ') : team.name}
                </span>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={(e) => { e.stopPropagation(); onSetWinner(); }}
            >
                Win
            </Button>
        </div>
    );
};

const TeamInMatchDisplay = ({ team }: { team: Team | null }) => {
    return (
        <div className="flex items-center p-2 h-11 w-full">
            <div className="flex items-center gap-2 overflow-hidden">
                {team ? (
                    <>
                        <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={team.avatar} alt={team.name} data-ai-hint="team logo" />
                            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate font-medium text-foreground">
                            {team.name.startsWith('Team ') ? (team.members || []).map(m => m.name).join(' & ') : team.name}
                        </span>
                    </>
                ) : (
                    <>
                        <div className="h-6 w-6 rounded-md bg-muted/20 flex-shrink-0 flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-muted-foreground text-sm">TBD</span>
                    </>
                )}
            </div>
        </div>
    );
};

const EditableMatchCard = ({
    match,
    tournamentId,
    roundName,
    pointSystemEnabled,
    onUpdate,
}: {
    match: Match,
    tournamentId: string,
    roundName: string,
    pointSystemEnabled: boolean,
    onUpdate: () => void;
}) => {
    const { toast } = useToast();
    const team1 = match.teams[0] ?? null;
    const team2 = match.teams[1] ?? null;

    const handleResultRequest = async () => {
        const result = await requestMatchResults(tournamentId, roundName, match.id);
        if (result.success) {
            toast({ title: "Request Sent", description: "Players have been notified to submit their results." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error || "Could not send result request.", variant: "destructive" });
        }
    };

    const handleSetWinner = async (winnerId: string) => {
        const result = await setMatchWinner(tournamentId, roundName, match.id, winnerId);
        if (result.success) {
            toast({ title: "Winner Set!", description: "The bracket has been updated." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleUndo = async () => {
        if (!confirm("Are you sure you want to undo this match result? The winner will be removed from the next round.")) return;
        const result = await undoMatchResult(tournamentId, roundName, match.id);
        if (result.success) {
            toast({ title: "Result Undone", description: "The match has been reset." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const canInteract = match.status === 'pending' && !!team1 && !!team2;
    const isCompleted = match.status === 'completed';
    const isAwaitingSubmissions = !!match.resultSubmissionStatus && Object.values(match.resultSubmissionStatus).some(s => s === 'pending');
    
    const getStatusContent = () => {
        if (isCompleted) {
            const winner = match.scores[0] > match.scores[1] ? team1 : team2;
            const winnerName = winner?.name.startsWith('Team ') ? (winner?.members || []).map(m => m.name).join(' & ') : winner?.name;
            return { icon: <CheckCircle className="h-3 w-3" />, text: `Winner: ${winnerName}`, color: 'text-green-500' };
        }
        if (isAwaitingSubmissions) {
            return { icon: <Hourglass className="h-3 w-3" />, text: 'Awaiting Submissions', color: 'text-amber-500' };
        }
        if (match.status === 'pending') {
            return { icon: <Clock className="h-3 w-3" />, text: 'Pending', color: 'text-muted-foreground' };
        }
        return null;
    };

    const statusContent = getStatusContent();

    return (
        <div className={cn("bg-card rounded-lg w-full flex-shrink-0 border shadow-sm flex flex-col justify-between")}>
            <div>
                {canInteract && !pointSystemEnabled && team1
                    ? <TeamDisplayWithWinButton team={team1} onSetWinner={() => handleSetWinner(team1.id)} />
                    : <TeamInMatchDisplay team={team1} />
                }
                <div className="border-t border-border/50 mx-2"></div>
                {canInteract && !pointSystemEnabled && team2
                    ? <TeamDisplayWithWinButton team={team2} onSetWinner={() => handleSetWinner(team2.id)} />
                    : <TeamInMatchDisplay team={team2} />
                }
            </div>
            <div className="p-2 border-t border-border/50 flex justify-between items-center min-h-[42px]">
                {statusContent && !isCompleted && (
                    <div className={cn("flex items-center gap-1.5 text-xs font-medium", statusContent.color)}>
                        {statusContent.icon}
                        <span>{statusContent.text}</span>
                    </div>
                )}
                {pointSystemEnabled && canInteract && !isAwaitingSubmissions && (
                    <Button variant="outline" size="sm" className="ml-auto h-7 text-xs px-2" onClick={handleResultRequest}>
                        <Send className="mr-1 h-3 w-3" /> Request Results
                    </Button>
                )}
                {isCompleted && (
                    <div className="w-full flex items-center justify-between">
                        <div className={cn("flex items-center gap-1.5 text-xs font-medium", statusContent?.color)}>
                            {statusContent?.icon}
                            <span className="truncate">{statusContent?.text}</span>
                        </div>
                        <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={handleUndo}>
                            Undo
                        </Button>
                    </div>
                )}
            </div>
            {canInteract && (
                <RoomDetailsEditor match={match} tournamentId={tournamentId} onUpdate={onUpdate} />
            )}
        </div>
    );
};

const EditableSingleMatchDisplay = ({ match, ...props }: { match: Match | null; [key: string]: any; }) => {
    return (
        <div className="w-full md:w-64">
            <div className="flex justify-between items-center mb-1 h-4">
                <p className="text-[9px] text-muted-foreground">{match?.name ?? ''}</p>
            </div>
            {match ? <EditableMatchCard match={match} {...props} /> : (
                <div className="bg-card rounded-lg w-full flex-shrink-0 border shadow-sm flex flex-col justify-between">
                    <TeamInMatchDisplay team={null} />
                    <div className="border-t border-border/50 mx-2"></div>
                    <TeamInMatchDisplay team={null} />
                    <div className="p-2 border-t border-border/50 min-h-[42px]"></div>
                </div>
            )}
        </div>
    );
};

const Connector = () => (
    <div className="w-8 flex-shrink-0 mx-2 self-stretch" >
        <svg className="w-full h-full" viewBox="0 0 32 284" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 63 C 16,63 16,142 32,142" stroke="hsl(var(--border))" strokeWidth="2" />
            <path d="M1 221 C 16,221 16,142 32,142" stroke="hsl(var(--border))" strokeWidth="2" />
        </svg>
    </div>
);

// --- MAIN EDITOR COMPONENT ---

interface BracketEditorProps {
    bracket: Round[];
    participants: Team[];
    onUpdate: () => void;
    tournamentId: Tournament['id'];
    pointSystemEnabled: boolean;
}

const getWinner = (match: Match): Team | null => {
    if (match.status !== 'completed' || !match.teams[0] || !match.teams[1]) return null;
    return match.scores[0] > match.scores[1] ? match.teams[0] : match.teams[1];
};

const roundAbbreviationMap: Record<string, string> = {
    'Finals': 'Finals', 'Semi-finals': 'Semis', 'Quarter-finals': 'Quarters', 'Round of 16': 'R16', 'Round of 32': 'R32', 'Round of 64': 'R64',
};

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export function BracketEditor({ bracket: initialBracket, participants, onUpdate, tournamentId, pointSystemEnabled }: BracketEditorProps) {
    const { toast } = useToast();
    const [bracket, setBracket] = useState(initialBracket);
    const [activeRoundName, setActiveRoundName] = useState(initialBracket?.[0]?.name || '');

    useEffect(() => {
        setBracket(initialBracket);
        if (!activeRoundName && initialBracket?.[0]?.name) {
            setActiveRoundName(initialBracket[0].name);
        }
    }, [initialBracket, activeRoundName]);

    const handleLottery = async () => {
        if (participants.length < 2) {
            toast({ title: "Not enough participants", description: "You need at least 2 teams to run a lottery.", variant: "destructive" });
            return;
        }

        const newBracket = produce(bracket, draft => {
            if (!draft || draft.length === 0) return;
            const shuffledParticipants = shuffleArray([...participants]);

            draft.forEach(round => round.matches.forEach(match => {
                match.teams = [null, null];
                match.status = 'pending';
                match.scores = [0, 0];
            }));

            const firstRound = draft[0];
            let participantIndex = 0;
            for (const match of firstRound.matches) {
                for (let i = 0; i < match.teams.length; i++) {
                    if (participantIndex < shuffledParticipants.length) {
                        match.teams[i] = shuffledParticipants[participantIndex];
                        participantIndex++;
                    } else {
                        match.teams[i] = null;
                    }
                }
            }
        });

        const result = await updateTournament(tournamentId, { bracket: newBracket });
        if (result.success) {
            onUpdate(); // Refetch data
            toast({ title: "Lottery Complete!", description: "Teams have been randomly assigned to the bracket." });
        } else {
            toast({ title: "Error", description: result.error || "Failed to save lottery results.", variant: "destructive" });
        }
    };

    if (!bracket || bracket.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">This tournament doesn't have a bracket yet.</p>
                    <Button disabled>Generate Bracket (Coming Soon)</Button>
                </CardContent>
            </Card>
        );
    }

    const finalWinner = bracket[bracket.length - 1].matches[0].status === 'completed' ? getWinner(bracket[bracket.length - 1].matches[0]) : null;
    const roundNames = bracket.map(r => r.name);
    const activeRoundIndex = bracket.findIndex(r => r.name === activeRoundName);
    const activeRound = bracket[activeRoundIndex];
    const nextRound = bracket[activeRoundIndex + 1] || null;

    const matchPairs = [];
    if (activeRound) {
        for (let i = 0; i < activeRound.matches.length; i += 2) {
            matchPairs.push([activeRound.matches[i], activeRound.matches[i + 1] || null]);
        }
    }

    const commonMatchProps = { tournamentId, onUpdate, pointSystemEnabled };

    return (
        <div className="space-y-8">
            {finalWinner && (
                <Card className="border-amber-400 bg-amber-500/10">
                    <CardHeader className="text-center">
                        <Trophy className="h-10 w-10 text-amber-400 mx-auto" />
                        <CardTitle className="text-2xl text-amber-500">Tournament Champion</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-2">
                        <Avatar className="h-16 w-16 border-2 border-amber-400">
                            <AvatarImage src={finalWinner.avatar} alt={finalWinner.name} data-ai-hint="team logo" />
                            <AvatarFallback>{finalWinner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-xl font-bold">{finalWinner.name}</p>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex-grow flex justify-center overflow-x-auto no-scrollbar">
                    <div className="inline-flex items-center justify-center rounded-full bg-card p-1 text-card-foreground border">
                        {roundNames.map(name => (
                            <Button key={name} variant="ghost" size="sm"
                                className={cn("rounded-full h-8 px-4 font-semibold", activeRoundName === name ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:bg-accent/50')}
                                onClick={() => setActiveRoundName(name)}
                            >
                                {roundAbbreviationMap[name] || name}
                            </Button>
                        ))}
                    </div>
                </div>
                <Button onClick={handleLottery} variant="outline" disabled={participants.length < 2}>
                    <Dices className="mr-2 h-4 w-4" /> Run Lottery
                </Button>
            </div>

            <Card>
                <CardContent className="p-4 overflow-x-auto">
                    <div className="flex flex-col items-center space-y-4 min-w-max">
                        {activeRound.matches.length === 1 ? (
                            <EditableSingleMatchDisplay match={activeRound.matches[0]} roundName={activeRound.name} {...commonMatchProps} />
                        ) : (
                            matchPairs.map((pair, i) => {
                                const [match1, match2] = pair;
                                return (
                                    <div key={i} className="flex items-center w-full justify-center">
                                        <div className="space-y-8">
                                            <EditableSingleMatchDisplay match={match1} roundName={activeRound.name} {...commonMatchProps} />
                                            {match2 && <EditableSingleMatchDisplay match={match2} roundName={activeRound.name} {...commonMatchProps} />}
                                        </div>
                                        {nextRound && <Connector />}
                                        {nextRound && (
                                            <div className="w-full md:w-64">
                                                <div className="h-5 mb-1" />
                                                <div className={cn("bg-card rounded-lg w-full flex-shrink-0 border shadow-sm p-0 flex flex-col justify-between")}>
                                                    <TeamInMatchDisplay team={getWinner(match1)} />
                                                    <div className="border-t border-border/50 mx-2" />
                                                    <TeamInMatchDisplay team={getWinner(match2)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

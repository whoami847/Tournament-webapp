
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getPendingResultsStream, approveResult, rejectResult } from '@/lib/results-service';
import type { MatchResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const ApprovalDialog = ({ result, onClose }: { result: MatchResult; onClose: () => void; }) => {
    const [team1Score, setTeam1Score] = useState(0);
    const [team2Score, setTeam2Score] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleApprove = async () => {
        setIsSubmitting(true);
        const response = await approveResult(
            result.id, 
            result.tournamentId, 
            result.matchId, 
            result.roundName, 
            team1Score, 
            team2Score
        );

        if (response.success) {
            toast({ title: "Result Approved", description: `The scores for match ${result.matchId} have been updated.` });
            onClose();
        } else {
            toast({ title: "Error", description: response.error, variant: 'destructive' });
        }
        setIsSubmitting(false);
    }
    
    // In a real app, you'd fetch the match details to get both team names
    // For now, we'll just show the submitting team.
    const teamName = result.teamName;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Approve Match Result</DialogTitle>
                <DialogDescription>
                    Review the submission and enter the final scores for the match. This will mark the match as completed and advance the winner.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p>Approving submission for team: <span className="font-bold">{teamName}</span></p>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="team1-score">Team 1 Score</Label>
                        <Input id="team1-score" type="number" value={team1Score} onChange={(e) => setTeam1Score(Number(e.target.value))} />
                    </div>
                     <div>
                        <Label htmlFor="team2-score">Team 2 Score</Label>
                        <Input id="team2-score" type="number" value={team2Score} onChange={(e) => setTeam2Score(Number(e.target.value))} />
                    </div>
                </div>
            </div>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleApprove} disabled={isSubmitting}>
                    {isSubmitting ? "Approving..." : "Approve & Finalize"}
                </Button>
            </CardFooter>
        </DialogContent>
    );
}

const ResultSubmissionCard = ({ result, onApprove, onReject }: { result: MatchResult, onApprove: (result: MatchResult) => void, onReject: (resultId: string) => void }) => {
    return (
        <Card key={result.id} className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg">{result.teamName}</CardTitle>
                <CardDescription>Match ID: {result.matchId}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                    <Image src={result.screenshotUrl} alt="Match Screenshot" layout="fill" objectFit="cover" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Kills</p>
                        <p className="text-2xl font-bold">{result.kills}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Position</p>
                        <p className="text-2xl font-bold">#{result.position}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                    Submitted {formatDistanceToNow(new Date(result.submittedAt), { addSuffix: true })}
                </p>
                <div className="flex gap-2">
                    <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => onReject(result.id)}>
                        <X className="h-4 w-4" />
                    </Button>
                    <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => onApprove(result)}>
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                        </Button>
                    </DialogTrigger>
                </div>
            </CardFooter>
        </Card>
    );
};


export default function AdminResultsApprovalPage() {
    const [results, setResults] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState<MatchResult | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = getPendingResultsStream((data) => {
            setResults(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const groupedResults = useMemo(() => {
        const groups: Record<string, { tournamentName: string; rounds: Record<string, MatchResult[]> }> = {};
        results.forEach(result => {
            if (!groups[result.tournamentId]) {
                groups[result.tournamentId] = { tournamentName: result.tournamentName, rounds: {} };
            }
            if (!groups[result.tournamentId].rounds[result.roundName]) {
                groups[result.tournamentId].rounds[result.roundName] = [];
            }
            groups[result.tournamentId].rounds[result.roundName].push(result);
        });
        return groups;
    }, [results]);

    const handleReject = async (resultId: string) => {
        if (!window.confirm("Are you sure you want to reject this submission?")) return;
        
        const response = await rejectResult(resultId);
        if (response.success) {
            toast({ title: "Submission Rejected", variant: "destructive" });
        } else {
            toast({ title: "Error", description: response.error, variant: 'destructive' });
        }
    }

    const openDialog = (result: MatchResult) => {
        setSelectedResult(result);
        setIsDialogOpen(true);
    }

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setSelectedResult(null);
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card>
                <CardHeader>
                    <CardTitle>Pending Result Approvals</CardTitle>
                    <CardDescription>Review and approve match results submitted by players, organized by tournament and round.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <Skeleton key={i} className="h-48 w-full" />
                            ))}
                        </div>
                    ) : Object.keys(groupedResults).length > 0 ? (
                        <Accordion type="multiple" className="w-full space-y-4">
                            {Object.entries(groupedResults).map(([tournamentId, data]) => {
                                const totalPending = Object.values(data.rounds).reduce((acc, r) => acc + r.length, 0);
                                return (
                                    <AccordionItem key={tournamentId} value={tournamentId} className="border bg-muted/20 rounded-lg px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex justify-between w-full pr-4 items-center">
                                                <span className="font-semibold text-lg">{data.tournamentName}</span>
                                                <Badge variant="destructive">{totalPending} Pending</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-1">
                                             <Tabs defaultValue={Object.keys(data.rounds)[0]} className="w-full">
                                                <TabsList>
                                                    {Object.keys(data.rounds).map(roundName => (
                                                        <TabsTrigger key={roundName} value={roundName}>
                                                            {roundName}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>
                                                {Object.entries(data.rounds).map(([roundName, roundResults]) => (
                                                    <TabsContent key={roundName} value={roundName} className="mt-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            {roundResults.map(result => (
                                                                <ResultSubmissionCard
                                                                    key={result.id}
                                                                    result={result}
                                                                    onApprove={openDialog}
                                                                    onReject={handleReject}
                                                                />
                                                            ))}
                                                        </div>
                                                    </TabsContent>
                                                ))}
                                            </Tabs>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    ) : (
                        <div className="text-center py-16 border border-dashed rounded-lg">
                            <h3 className="text-xl font-medium">No Pending Submissions</h3>
                            <p className="text-muted-foreground mt-2">All caught up! New submissions will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            {selectedResult && <ApprovalDialog result={selectedResult} onClose={handleDialogClose} />}
        </Dialog>
    );
}

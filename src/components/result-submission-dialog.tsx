
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Tournament, Match, Team } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './admin/image-upload';
import { addMatchResult } from '@/lib/results-service';
import { useState } from 'react';

const formSchema = z.object({
  kills: z.coerce.number().min(0, "Kills must be a positive number."),
  position: z.coerce.number().min(1, "Position must be at least 1."),
  screenshotUrl: z.string().url("Please upload a screenshot as proof."),
});

type ResultFormValues = z.infer<typeof formSchema>;

interface ResultSubmissionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    tournament: Tournament;
    match: Match;
    roundName: string;
    team: Team;
}

export function ResultSubmissionDialog({ isOpen, onClose, tournament, match, roundName, team }: ResultSubmissionDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<ResultFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            kills: 0,
            position: 1,
            screenshotUrl: '',
        },
    });

    const onSubmit = async (values: ResultFormValues) => {
        setIsSubmitting(true);
        const resultData = {
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            matchId: match.id,
            roundName: roundName,
            teamId: team.id,
            teamName: team.name,
            ...values,
        };

        const response = await addMatchResult(resultData);
        if (response.success) {
            toast({
                title: "Results Submitted!",
                description: "Your results are now pending admin approval.",
            });
            onClose();
        } else {
            toast({
                title: "Submission Failed",
                description: response.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Match Results</DialogTitle>
                    <DialogDescription>
                        Enter your team's performance for match: {match.name}. Your submission will be reviewed by an admin.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="screenshotUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Result Screenshot</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            onUploadComplete={(url) => form.setValue('screenshotUrl', url, { shouldValidate: true })}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="kills" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Kills</FormLabel>
                                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="position" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Placement</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 1" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

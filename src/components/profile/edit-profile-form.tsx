
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { PlayerProfile } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(50, "Name cannot exceed 50 characters."),
  gameName: z.string().min(2, "Game name must be at least 2 characters.").max(50, "Game name cannot exceed 50 characters.").optional().or(z.literal('')),
  gamerId: z.string().min(3, "Gamer ID must be at least 3 characters.").max(30, "Gamer ID cannot exceed 30 characters."),
});

export type EditProfileFormValues = z.infer<typeof formSchema>;

interface EditProfileFormProps {
    profile: PlayerProfile;
    onSubmit: (data: EditProfileFormValues) => void;
    isSubmitting: boolean;
    onClose: () => void;
}

export function EditProfileForm({ profile, onSubmit, isSubmitting, onClose }: EditProfileFormProps) {
    const form = useForm<EditProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: profile.name || '',
            gameName: profile.gameName === 'Not Set' ? '' : profile.gameName || '',
            gamerId: profile.gamerId || '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl><Input placeholder="Your display name" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="gameName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Game Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Free Fire" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="gamerId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gamer ID</FormLabel>
                        <FormControl><Input placeholder="Your unique gamer ID" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

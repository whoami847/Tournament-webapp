'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { GameCategory } from '@/types';
import { ImageUpload } from './image-upload';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, "Game name must be at least 2 characters."),
  categories: z.string().min(3, "Please enter at least one category."),
  image: z.string().url("Please upload an image for the game."),
  dataAiHint: z.string().optional(),
  description: z.string().min(20, "Description must be at least 20 characters.").optional().or(z.literal('')),
});

type GameFormValues = z.infer<typeof formSchema>;

interface GameFormProps {
    game?: GameCategory;
    onSubmit: (data: GameFormValues) => void;
    isSubmitting: boolean;
}

export function GameForm({ game, onSubmit, isSubmitting }: GameFormProps) {
    const form = useForm<GameFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: game?.name || '',
            categories: game?.categories || '',
            image: game?.image || '',
            dataAiHint: game?.dataAiHint || 'game logo',
            description: game?.description || '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Game Image</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    initialImageUrl={field.value}
                                    onUploadComplete={(url) => form.setValue('image', url, { shouldValidate: true })}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Game Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Free Fire" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categories</FormLabel>
                            <FormControl><Input placeholder="e.g., Battle Royale • Action" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Game Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter a detailed description of the game..." className="min-h-[120px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dataAiHint"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Image AI Hint</FormLabel>
                            <FormControl><Input placeholder="e.g., fire character action" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Saving...' : 'Save Game'}
                </Button>
            </form>
        </Form>
    );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { FeaturedBanner } from '@/types';
import { ImageUpload } from './image-upload';

const formSchema = z.object({
  game: z.string().min(2, "Game name is required."),
  name: z.string().min(5, "Banner title must be at least 5 characters."),
  date: z.string().min(5, "Date is required."),
  image: z.string().url("Please upload an image."),
  dataAiHint: z.string().min(2, "AI hint is required."),
});

type BannerFormValues = z.infer<typeof formSchema>;

interface BannerFormProps {
    banner?: FeaturedBanner;
    onSubmit: (data: BannerFormValues) => void;
    isSubmitting: boolean;
}

export function BannerForm({ banner, onSubmit, isSubmitting }: BannerFormProps) {
    const form = useForm<BannerFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            game: banner?.game || '',
            name: banner?.name || '',
            date: banner?.date || '',
            image: banner?.image || '',
            dataAiHint: banner?.dataAiHint || 'esports banner action',
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
                            <FormLabel>Banner Image</FormLabel>
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
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Banner Title</FormLabel><FormControl><Input placeholder="e.g., Free Fire World Series" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="game" render={({ field }) => (
                    <FormItem><FormLabel>Game Name</FormLabel><FormControl><Input placeholder="e.g., Free Fire" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date & Time</FormLabel><FormControl><Input placeholder="e.g., 10.11.2024 • 18:00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dataAiHint" render={({ field }) => (
                    <FormItem><FormLabel>Image AI Hint</FormLabel><FormControl><Input placeholder="e.g., fire battle action" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Saving...' : 'Save Banner'}
                </Button>
            </form>
        </Form>
    );
}

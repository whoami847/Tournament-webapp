'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Tournament } from '@/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  rules: z.string().min(50, "Rules must be at least 50 characters long."),
});

type EditRulesFormValues = z.infer<typeof formSchema>;

interface EditRulesFormProps {
    tournament: Tournament;
    onSave: (data: Partial<Tournament>) => void;
}

export function EditRulesForm({ tournament, onSave }: EditRulesFormProps) {
    const form = useForm<EditRulesFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rules: tournament.rules,
        },
    });

    function onSubmit(values: EditRulesFormValues) {
        onSave(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tournament Rules</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="min-h-[200px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Save Rules</Button>
            </form>
        </Form>
    );
}


'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getGamesStream, addGame, updateGame, deleteGame } from '@/lib/games-service';
import type { GameCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { GameForm } from '@/components/admin/game-form';

export default function AdminGamesPage() {
    const [games, setGames] = useState<GameCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<GameCategory | undefined>(undefined);
    const [gameToDelete, setGameToDelete] = useState<GameCategory | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = getGamesStream((data) => {
            setGames(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleFormSubmit = async (data: Omit<GameCategory, 'id'>) => {
        setIsSubmitting(true);
        const result = selectedGame
            ? await updateGame(selectedGame.id, data)
            : await addGame(data);

        if (result.success) {
            toast({
                title: selectedGame ? "Game Updated!" : "Game Added!",
                description: `"${data.name}" has been successfully saved.`,
            });
            setIsDialogOpen(false);
            setSelectedGame(undefined);
        } else {
            toast({
                title: "Error",
                description: result.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!gameToDelete) return;

        const result = await deleteGame(gameToDelete.id);
        if (result.success) {
            toast({
                title: "Game Deleted",
                description: `"${gameToDelete.name}" has been successfully deleted.`,
            });
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to delete the game.",
                variant: "destructive",
            });
        }
        setGameToDelete(null);
    };
    
    const openDialog = (game?: GameCategory) => {
        setSelectedGame(game);
        setIsDialogOpen(true);
    }
    
    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setSelectedGame(undefined);
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Game Categories</CardTitle>
                        <CardDescription>Add, edit, or delete supported games.</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={() => openDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Game
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{selectedGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for the game category.
                                </DialogDescription>
                            </DialogHeader>
                            <GameForm 
                                game={selectedGame}
                                onSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                 <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Categories</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {games.length > 0 ? games.map((game) => (
                                    <TableRow key={game.id}>
                                        <TableCell>
                                            <Image src={game.image} alt={game.name} width={80} height={45} className="rounded-md object-cover aspect-video" data-ai-hint={game.dataAiHint} />
                                        </TableCell>
                                        <TableCell className="font-medium">{game.name}</TableCell>
                                        <TableCell>{game.categories}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openDialog(game)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => setGameToDelete(game)} className="text-destructive focus:text-destructive">
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No games found. Add one to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <AlertDialog open={!!gameToDelete} onOpenChange={(open) => !open && setGameToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the game "{gameToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

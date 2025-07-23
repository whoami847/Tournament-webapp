
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getBannersStream, addBanner, updateBanner, deleteBanner } from '@/lib/banners-service';
import { getGamesStream } from '@/lib/games-service';
import { getTournamentsStream } from '@/lib/tournaments-service';
import type { FeaturedBanner, GameCategory, Tournament } from '@/types';
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
import { MoreHorizontal, PlusCircle, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BannerForm } from '@/components/admin/banner-form';
import { format } from 'date-fns';

export default function AdminBannersPage() {
    // --- Existing State ---
    const [banners, setBanners] = useState<FeaturedBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomDialogOpen, setCustomDialogOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<FeaturedBanner | undefined>(undefined);
    const [bannerToDelete, setBannerToDelete] = useState<FeaturedBanner | null>(null);
    const { toast } = useToast();

    // --- New State for "Add from Tournament" ---
    const [isTournamentDialogOpen, setTournamentDialogOpen] = useState(false);
    const [games, setGames] = useState<GameCategory[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedGameName, setSelectedGameName] = useState<string | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const unsubBanners = getBannersStream((data) => {
            setBanners(data);
            setLoading(false);
        });
        const unsubGames = getGamesStream(setGames);
        const unsubTournaments = getTournamentsStream(setTournaments);
        
        return () => {
            unsubBanners();
            unsubGames();
            unsubTournaments();
        };
    }, []);

    // --- Handlers ---
    const handleCustomFormSubmit = async (data: Omit<FeaturedBanner, 'id'>) => {
        setIsSubmitting(true);
        const result = selectedBanner
            ? await updateBanner(selectedBanner.id, data)
            : await addBanner(data);

        if (result.success) {
            toast({
                title: selectedBanner ? "Banner Updated!" : "Banner Added!",
                description: `The banner "${data.name}" has been successfully saved.`,
            });
            setCustomDialogOpen(false);
            setSelectedBanner(undefined);
        } else {
            toast({
                title: "Error",
                description: result.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
        setIsSubmitting(false);
    };
    
    const handleAddFromTournament = async (tournament: Tournament) => {
        const bannerData = {
            name: tournament.name,
            game: tournament.game,
            date: format(new Date(tournament.startDate), "dd.MM.yy '•' HH:mm"),
            image: tournament.image,
            dataAiHint: tournament.dataAiHint || 'esports tournament',
        };
        
        if (banners.some(b => b.name === tournament.name)) {
            toast({
                title: "Banner Exists",
                description: "A banner for this tournament already exists.",
                variant: "destructive",
            });
            return;
        }
    
        const result = await addBanner(bannerData);
        if (result.success) {
            toast({
                title: "Banner Added!",
                description: `A banner for "${tournament.name}" has been created.`,
            });
            setTournamentDialogOpen(false);
            setSelectedGameName(null);
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to add banner.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (!bannerToDelete) return;

        const result = await deleteBanner(bannerToDelete.id);
        if (result.success) {
            toast({
                title: "Banner Deleted",
                description: `The banner "${bannerToDelete.name}" has been successfully deleted.`,
            });
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to delete the banner.",
                variant: "destructive",
            });
        }
        setBannerToDelete(null);
    };
    
    const openCustomDialog = (banner?: FeaturedBanner) => {
        setSelectedBanner(banner);
        setCustomDialogOpen(true);
    }
    
    const handleCustomDialogChange = (open: boolean) => {
        setCustomDialogOpen(open);
        if (!open) {
            setSelectedBanner(undefined);
        }
    }
    
    const handleTournamentDialogChange = (open: boolean) => {
        setTournamentDialogOpen(open);
        if (!open) {
            setSelectedGameName(null);
        }
    }

    const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming' && t.game === selectedGameName);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Featured Banners</CardTitle>
                        <CardDescription>Manage the featured banners on the home page.</CardDescription>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        {/* Dialog for adding from a tournament */}
                        <Dialog open={isTournamentDialogOpen} onOpenChange={handleTournamentDialogChange}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add from Tournament
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add Banner from Tournament</DialogTitle>
                                    <DialogDescription>
                                        {selectedGameName 
                                            ? `Select an upcoming tournament from ${selectedGameName}.`
                                            : "First, select a game to see its upcoming tournaments."}
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedGameName ? (
                                    <div>
                                        <Button variant="link" onClick={() => setSelectedGameName(null)} className="p-0 h-auto mb-4 text-sm">
                                           &larr; Back to Games
                                        </Button>
                                        <div className="space-y-2 max-h-[60vh] overflow-y-auto p-1">
                                            {upcomingTournaments.length > 0 ? upcomingTournaments.map(t => (
                                                <div key={t.id} className="flex items-center justify-between p-2 rounded-md border">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <Image src={t.image} alt={t.name} width={80} height={45} className="rounded-md object-cover aspect-video flex-shrink-0" data-ai-hint={t.dataAiHint} />
                                                        <div className="overflow-hidden">
                                                            <p className="font-semibold truncate">{t.name}</p>
                                                            <p className="text-sm text-muted-foreground">{format(new Date(t.startDate), 'PPP')}</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" onClick={() => handleAddFromTournament(t)} className="flex-shrink-0">Add Banner</Button>
                                                </div>
                                            )) : (
                                                <p className="text-center text-muted-foreground py-8">No upcoming tournaments for this game.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto p-1">
                                        {games.map(game => (
                                            <button
                                                key={game.id}
                                                onClick={() => setSelectedGameName(game.name)}
                                                className="w-full flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Image src={game.image} alt={game.name} width={64} height={36} className="rounded-md object-cover aspect-video" data-ai-hint={game.dataAiHint} />
                                                    <p className="font-semibold">{game.name}</p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                        {/* Dialog for custom banner add/edit */}
                        <Dialog open={isCustomDialogOpen} onOpenChange={handleCustomDialogChange}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => openCustomDialog()}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Custom
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{selectedBanner ? 'Edit Banner' : 'Add Custom Banner'}</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details for the featured banner.
                                    </DialogDescription>
                                </DialogHeader>
                                <BannerForm 
                                    banner={selectedBanner}
                                    onSubmit={handleCustomFormSubmit}
                                    isSubmitting={isSubmitting}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 2 }).map((_, i) => (
                                 <Skeleton key={i} className="h-28 w-full" />
                            ))}
                        </div>
                    ) : banners.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Game</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {banners.map((banner) => (
                                            <TableRow key={banner.id}>
                                                <TableCell>
                                                    <Image src={banner.image} alt={banner.name} width={120} height={60} className="rounded-md object-cover aspect-video" data-ai-hint={banner.dataAiHint} />
                                                </TableCell>
                                                <TableCell className="font-medium">{banner.name}</TableCell>
                                                <TableCell>{banner.game}</TableCell>
                                                <TableCell>{banner.date}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openCustomDialog(banner)}>
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => setBannerToDelete(banner)} className="text-destructive focus:text-destructive">
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {/* Mobile Card List */}
                            <div className="md:hidden space-y-4">
                                {banners.map((banner) => (
                                    <div key={banner.id} className="bg-muted/50 p-4 rounded-lg border">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Image src={banner.image} alt={banner.name} width={120} height={60} className="rounded-md object-cover aspect-video flex-shrink-0" data-ai-hint={banner.dataAiHint} />
                                            <div className="flex-grow overflow-hidden">
                                                <p className="font-semibold truncate">{banner.name}</p>
                                                <p className="text-sm text-muted-foreground">{banner.game}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{banner.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 border-t border-muted-foreground/20 pt-3">
                                            <Button variant="outline" size="sm" onClick={() => openCustomDialog(banner)}>Edit</Button>
                                            <Button variant="destructive" size="sm" onClick={() => setBannerToDelete(banner)}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 border border-dashed rounded-lg">
                            <h3 className="text-xl font-medium">No Banners Found</h3>
                            <p className="text-muted-foreground mt-2">Add a banner to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <AlertDialog open={!!bannerToDelete} onOpenChange={(open) => !open && setBannerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the banner "{bannerToDelete?.name}".
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

    
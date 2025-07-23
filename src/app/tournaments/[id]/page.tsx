import { getTournament, getTournaments } from '@/lib/tournaments-service';
import type { Tournament } from '@/types';
import { notFound } from 'next/navigation';
import TournamentDetailsClient from '@/components/tournament-details-client';

export async function generateStaticParams() {
  try {
    const tournaments = await getTournaments();
    if (!tournaments || tournaments.length === 0) {
        return [];
    }
    return tournaments.map((tournament) => ({
        id: tournament.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params for tournaments:", error);
    return [];
  }
}

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const tournament = await getTournament(params.id);

  if (!tournament) {
    notFound();
  }

  return <TournamentDetailsClient initialTournament={tournament} />;
}

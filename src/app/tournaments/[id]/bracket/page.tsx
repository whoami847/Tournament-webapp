// This file is now a server component responsible for fetching initial data
// and passing it to a client component for interactive display.

import { getTournament, getTournaments } from '@/lib/tournaments-service';
import { notFound } from 'next/navigation';
import BracketClient from '@/components/bracket-client';

// generateStaticParams tells Next.js which paths to pre-render at build time.
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
    console.error("Failed to generate static params for tournament brackets:", error);
    return [];
  }
}

export default async function BracketPage({ params }: { params: { id: string } }) {
  const tournament = await getTournament(params.id);

  if (!tournament) {
    notFound();
  }

  // We pass the fetched tournament data as a prop to the client component.
  return <BracketClient initialTournament={tournament} />;
}

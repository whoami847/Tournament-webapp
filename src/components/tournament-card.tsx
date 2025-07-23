import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Users, Calendar, Ticket, Trophy } from 'lucide-react';
import type { Tournament } from '@/types';
import { format } from 'date-fns';
import Countdown from './countdown';

interface TournamentCardProps {
  tournament: Tournament;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
}

const statusColors = {
  upcoming: 'bg-blue-500',
  live: 'bg-red-500 animate-pulse',
  completed: 'bg-gray-500',
};

export default function TournamentCard({ tournament, isBookmarked, onBookmarkToggle }: TournamentCardProps) {
  const statusColor = statusColors[tournament.status] || 'bg-gray-500';
  const isFull = tournament.teamsCount >= tournament.maxTeams;

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block h-full group">
      <Card className="flex flex-col h-full hover:border-primary/50 transition-colors duration-300 overflow-hidden">
        <CardHeader className="p-0 relative">
          <Image 
            src={tournament.image}
            alt={tournament.name}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint={tournament.dataAiHint as string}
          />
          <div className="absolute top-2 right-2 flex gap-2">
              <Badge variant="secondary">{tournament.game}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">{tournament.name}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0" 
                onClick={(e) => {
                  e.preventDefault();
                  onBookmarkToggle();
                }}
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                  <Bookmark className={isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'} />
              </Button>
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{format(new Date(tournament.startDate), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{tournament.teamsCount} / {tournament.maxTeams} teams</span>
              {isFull && (
                <Badge variant="destructive" className="ml-auto">Full</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span>{tournament.prizePool} TK Prize Pool</span>
            </div>
            {tournament.entryFee > 0 && (
               <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span>{tournament.entryFee} TK Entry Fee</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 flex items-center">
          {tournament.status === 'upcoming' ? (
            <Countdown targetDate={tournament.startDate} />
          ) : (
            <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`}></div>
                <span className="text-sm font-medium capitalize">{tournament.status}</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

import type { PlayerProfile, Tournament, GameCategory, FeaturedBanner, Transaction, WithdrawMethod, WithdrawRequest, PendingPrize, RegistrationLog, UserTeam, Match, TeamMember } from '@/types';

// This file is intentionally left blank.
// All data is now fetched from and written to Firebase.

export const mockAdmin: PlayerProfile[] = [];
export const mockUsers: PlayerProfile[] = [];
export const mockGames: GameCategory[] = [];
export const mockBanners: FeaturedBanner[] = [];
export const mockTeams: UserTeam[] = [];
export const mockTournaments: Tournament[] = [];
export const mockTransactions: Transaction[] = [];
export const mockWithdrawRequests: WithdrawRequest[] = [];
export const mockPendingPrizes: PendingPrize[] = [];
export const mockWithdrawMethods: WithdrawMethod[] = [];
export const mockGatewaySettings = {};
export const mockRegistrationLogs: RegistrationLog[] = [];
export const mockMatchResults: any[] = []; // Using 'any' as MatchResult is more complex now
export const mockNotifications: AppNotification[] = [];

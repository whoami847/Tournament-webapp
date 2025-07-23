"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, User, Wallet, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/tournaments', icon: Swords, label: 'Tournaments' },
  { href: '/results', icon: History, label: 'History' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  const getIsActive = (href: string) => {
    if (href === '/') {
        return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 p-2 z-50">
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl w-full h-full border border-border shadow-lg">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => {
            const isActive = getIsActive(item.href);
            return (
              <Link key={item.label} href={item.href} className={cn(
                "flex flex-1 items-center justify-center h-full rounded-lg transition-colors",
                isActive ? 'text-amber-400 drop-shadow-[0_1px_4px_rgba(239,68,68,0.6)]' : 'text-muted-foreground hover:text-foreground'
              )}>
                <item.icon className={cn('h-6 w-6')} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

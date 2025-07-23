'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Users, Swords, List, Settings, LucideIcon, Gamepad2, Image as ImageIcon, ClipboardCheck, CloudCog, Banknote, ListChecks, Award } from "lucide-react";

const adminControls: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/banners', icon: ImageIcon, label: 'Banners' },
  { href: '/admin/tournaments', icon: Swords, label: 'Tournaments' },
  { href: '/admin/games', icon: Gamepad2, label: 'Games' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/results-approval', icon: ClipboardCheck, label: 'Results Approval' },
  { href: '/admin/prize-approvals', icon: Award, label: 'Prize Approvals' },
  { href: '/admin/requests', icon: List, label: 'Registration Log' },
  { href: '/admin/gateway', icon: CloudCog, label: 'Gateway' },
  { href: '/admin/withdraw-methods', icon: Banknote, label: 'Withdraw Methods' },
  { href: '/admin/withdraw-requests', icon: ListChecks, label: 'Withdraw Requests' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminControlCard = ({ href, icon: Icon, label, index }: { href: string; icon: LucideIcon; label: string; index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <Link href={href} className="block">
            <Card className="hover:bg-accent hover:border-primary transition-all duration-300 h-full shadow-md hover:shadow-lg">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center aspect-square">
                    <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Icon className="h-10 w-10 text-primary" />
                    </motion.div>
                    <span className="font-semibold mt-2">{label}</span>
                </CardContent>
            </Card>
        </Link>
    </motion.div>
);


export default function AdminPage() {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        >
            {adminControls.map((control, index) => (
                <AdminControlCard key={control.href} {...control} index={index} />
            ))}
        </motion.div>
    );
}


'use client';

import { useState, useEffect } from 'react';
import { getUsersStream, updateUserBalance, updateUserStatus, sendPasswordResetForUser } from '@/lib/users-service';
import type { PlayerProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Wallet, UserX, UserCheck, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const ManageWalletDialog = ({ user, onUpdate }: { user: PlayerProfile; onUpdate: () => void }) => {
    const [amount, setAmount] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleUpdateBalance = async (adjustment: number) => {
        if (!amount || amount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a positive amount.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        const result = await updateUserBalance(user.id, adjustment);
        if (result.success) {
            toast({ title: 'Balance Updated', description: `${user.name}'s balance has been adjusted.` });
            onUpdate();
            setAmount(0);
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Manage Wallet</CardTitle>
                <CardDescription>Current Balance: <span className="font-bold text-foreground">{user.balance.toFixed(2)} TK</span></CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="amount">Adjustment Amount (TK)</Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="e.g., 100"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                    />
                </div>
                <div className="flex gap-2 mt-2">
                     <Button
                        variant="destructive"
                        onClick={() => handleUpdateBalance(-amount)}
                        disabled={isSubmitting || amount <= 0}
                        className="flex-1"
                    >
                        Remove
                    </Button>
                    <Button
                        onClick={() => handleUpdateBalance(amount)}
                        disabled={isSubmitting || amount <= 0}
                        className="flex-1"
                    >
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const UserDetailsDialog = ({ user, onClose }: { user: PlayerProfile, onClose: () => void }) => {
    const { toast } = useToast();
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const handleStatusChange = async (status: 'active' | 'banned') => {
        const result = await updateUserStatus(user.id, status);
        if (result.success) {
            toast({
                title: status === 'banned' ? 'User Banned' : 'User Unbanned',
                description: `${user.name}'s status has been updated.`,
            });
            onClose(); // Close the dialog to see the change in the list
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
    };
    
    const handlePasswordReset = async () => {
        if (!user.email) {
            toast({ title: 'Cannot Reset Password', description: 'This user does not have an email address associated with their account.', variant: 'destructive' });
            return;
        }
        if (!window.confirm(`Are you sure you want to send a password reset email to ${user.name}?`)) return;

        setIsResettingPassword(true);
        const result = await sendPasswordResetForUser(user.email);
        if (result.success) {
            toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${user.email} with instructions.` });
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
        setIsResettingPassword(false);
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <div className="flex items-center gap-4">
                     <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <DialogTitle className="text-2xl">{user.name}</DialogTitle>
                        <DialogDescription>{user.email}</DialogDescription>
                        <Badge variant={user.status === 'banned' ? 'destructive' : 'default'} className="mt-2 capitalize">
                           {user.status}
                        </Badge>
                    </div>
                </div>
            </DialogHeader>
            <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg">User Information</h4>
                    <div className="text-sm space-y-2">
                        <p><strong className="text-muted-foreground w-24 inline-block">Gamer ID:</strong> {user.gamerId}</p>
                        <p><strong className="text-muted-foreground w-24 inline-block">UID:</strong> <span className="font-mono text-xs">{user.id}</span></p>
                        <p><strong className="text-muted-foreground w-24 inline-block">Joined:</strong> {format(new Date(user.joined), 'PPP')}</p>
                        <p><strong className="text-muted-foreground w-24 inline-block">Team ID:</strong> {user.teamId || 'N/A'}</p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg mt-6">Actions</h4>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    {user.status === 'banned' ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                                    {user.status === 'banned' ? 'Unban User' : 'Ban User'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {user.status === 'banned' ? `This will unban ${user.name} and allow them to access the app again.` : `This will ban ${user.name} and immediately revoke their access to the app.`}
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStatusChange(user.status === 'banned' ? 'active' : 'banned')}>
                                    Confirm
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <div className="space-y-4">
                     <ManageWalletDialog user={user} onUpdate={onClose} />
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Password Management</CardTitle>
                            <CardDescription>If a user forgets their password, you can send them a reset link.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="secondary" onClick={handlePasswordReset} disabled={isResettingPassword}>
                                {isResettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Send Password Reset Email
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DialogContent>
    )
}


export default function AdminUsersPage() {
    const [users, setUsers] = useState<PlayerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<PlayerProfile | null>(null);

    useEffect(() => {
        const unsubscribe = getUsersStream((data) => {
            setUsers(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const openDialog = (user: PlayerProfile) => {
        setSelectedUser(user);
    };

    const closeDialog = () => {
        setSelectedUser(null);
    };

    const UserTableSkeleton = () => (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-muted/50">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage all registered users.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <UserTableSkeleton />
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Gamer ID</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Joined Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length > 0 ? users.map((user) => (
                                            <TableRow key={user.id} onClick={() => openDialog(user)} className="cursor-pointer">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="gamer avatar" />
                                                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.gamerId}</TableCell>
                                                <TableCell>{user.balance.toFixed(2)} TK</TableCell>
                                                <TableCell>{format(new Date(user.joined), 'PPP')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.status === 'banned' ? 'destructive' : 'default'} className="capitalize">{user.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card List */}
                            <div className="md:hidden">
                                <div className="space-y-4">
                                    {users.length > 0 ? users.map((user) => (
                                        <div key={user.id} className="bg-muted/20 p-4 rounded-lg border" onClick={() => openDialog(user)}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="gamer avatar" />
                                                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{user.name}</p>
                                                        <p className="text-sm text-muted-foreground">{user.gamerId}</p>
                                                    </div>
                                                </div>
                                                 <Badge variant={user.status === 'banned' ? 'destructive' : 'default'} className="capitalize">{user.status}</Badge>
                                            </div>
                                            <div className="mt-4 flex justify-between text-sm text-muted-foreground pt-4 border-t border-muted-foreground/20">
                                                <span>Joined: <span className="font-medium text-foreground">{format(new Date(user.joined), 'PPP')}</span></span>
                                                <span className="font-bold text-primary">{user.balance.toFixed(2)} TK</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-16 border border-dashed rounded-lg">
                                            <h3 className="text-xl font-medium">No Users Found</h3>
                                            <p className="text-muted-foreground mt-2">New users will appear here after they register.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && closeDialog()}>
                {selectedUser && <UserDetailsDialog user={selectedUser} onClose={closeDialog} />}
            </Dialog>
        </>
    );
}

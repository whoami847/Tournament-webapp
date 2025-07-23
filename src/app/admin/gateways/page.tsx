'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GatewayDialog } from '@/components/admin/gateway-dialog';
import { useAppStore } from '@/lib/store';
import type { Gateway } from '@/types';

export default function AdminGatewaysPage() {
  const { gateways, deleteGateway } = useAppStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedGateway, setSelectedGateway] = React.useState<Gateway | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleNewGateway = () => {
    setSelectedGateway(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setIsDialogOpen(true);
  };

  const handleDelete = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedGateway) {
      deleteGateway(selectedGateway.id);
      toast({ title: 'Success', description: 'Gateway deleted successfully.' });
    }
    setSelectedGateway(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setSelectedGateway(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Payment Gateways</CardTitle>
            <CardDescription>Manage the automated payment gateways for your store.</CardDescription>
          </div>
          <Button onClick={handleNewGateway}>
            <Plus className="mr-2 h-4 w-4" />
            New Gateway
          </Button>
        </CardHeader>
        <CardContent>
          {gateways.length > 0 ? (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gateway Name</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gateways.map((gateway) => (
                      <TableRow key={gateway.id}>
                        <TableCell className="font-medium">
                          {gateway.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={gateway.isLive ? 'destructive' : 'secondary'}>
                            {gateway.isLive ? 'Live' : 'Sandbox'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={gateway.enabled ? 'default' : 'secondary'} className={gateway.enabled ? 'bg-green-500' : ''}>
                            {gateway.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(gateway)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(gateway)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
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
              
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {gateways.map((gateway) => (
                  <Card key={gateway.id} className="p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-base">{gateway.name}</p>
                      <div className="flex gap-2">
                        <Badge variant={gateway.isLive ? 'destructive' : 'secondary'}>
                          {gateway.isLive ? 'Live' : 'Sandbox'}
                        </Badge>
                        <Badge variant={gateway.enabled ? 'default' : 'secondary'} className={gateway.enabled ? 'bg-green-500' : ''}>
                          {gateway.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(gateway)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(gateway)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p>No payment gateways found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <GatewayDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        gateway={selectedGateway}
        onSuccess={() => setIsDialogOpen(false)}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment gateway
              "{selectedGateway?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
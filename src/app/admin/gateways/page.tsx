'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GatewayDialog } from '@/components/admin/gateway-dialog';
import { getGatewaysStream, deleteGateway } from '@/lib/gateways';
import type { Gateway } from '@/types';
import { format } from 'date-fns';

export default function GatewaysPage() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gatewayToDelete, setGatewayToDelete] = useState<Gateway | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = getGatewaysStream((gatewayData) => {
      setGateways(gatewayData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNewGateway = () => {
    setSelectedGateway(null);
    setDialogOpen(true);
  };

  const handleEditGateway = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setDialogOpen(true);
  };

  const handleDeleteClick = (gateway: Gateway) => {
    setGatewayToDelete(gateway);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gatewayToDelete) return;
    
    setIsDeleting(true);
    const result = await deleteGateway(gatewayToDelete.id);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Gateway deleted successfully",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete gateway",
        variant: "destructive",
      });
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setGatewayToDelete(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Gateways</h1>
          <p className="text-muted-foreground">
            Manage your payment gateway configurations
          </p>
        </div>
        <Button onClick={handleNewGateway}>
          <Plus className="mr-2 h-4 w-4" />
          New Gateway
        </Button>
      </div>

      {gateways.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No Gateways Found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first payment gateway
              </p>
              <Button onClick={handleNewGateway} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Gateway
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gateway) => (
            <Card key={gateway.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {gateway.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditGateway(gateway)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(gateway)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={gateway.enabled ? "default" : "secondary"}>
                      {gateway.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mode:</span>
                    <Badge variant={gateway.isLive ? "destructive" : "outline"}>
                      {gateway.isLive ? "Live" : "Sandbox"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {format(new Date(gateway.createdAt), "PPp")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GatewayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gateway={selectedGateway}
        onSuccess={() => {
          // Data will be updated via the stream
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the gateway
              "{gatewayToDelete?.name}" and remove all its configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
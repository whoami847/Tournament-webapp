import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Gateway } from '@/types';
import { getGatewaysStream, addGateway as addGatewayService, updateGateway as updateGatewayService, deleteGateway as deleteGatewayService } from './gateways';

interface AppState {
  // Gateway state
  gateways: Gateway[];
  gatewaysLoading: boolean;
  gatewaysError: string | null;
  
  // Gateway actions
  setGateways: (gateways: Gateway[]) => void;
  setGatewaysLoading: (loading: boolean) => void;
  setGatewaysError: (error: string | null) => void;
  addGateway: (gatewayData: Omit<Gateway, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string; id?: string }>;
  updateGateway: (id: string, gatewayData: Partial<Omit<Gateway, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean; error?: string }>;
  deleteGateway: (id: string) => Promise<{ success: boolean; error?: string }>;
  initializeGateways: () => () => void; // Returns unsubscribe function
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gateways: [],
    gatewaysLoading: true,
    gatewaysError: null,
    
    // Actions
    setGateways: (gateways) => set({ gateways }),
    setGatewaysLoading: (loading) => set({ gatewaysLoading: loading }),
    setGatewaysError: (error) => set({ gatewaysError: error }),
    
    addGateway: async (gatewayData) => {
      try {
        const result = await addGatewayService(gatewayData);
        return result;
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    updateGateway: async (id, gatewayData) => {
      try {
        const result = await updateGatewayService(id, gatewayData);
        return result;
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    deleteGateway: async (id) => {
      try {
        const result = await deleteGatewayService(id);
        return result;
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    initializeGateways: () => {
      set({ gatewaysLoading: true, gatewaysError: null });
      
      const unsubscribe = getGatewaysStream((gateways) => {
        set({ 
          gateways, 
          gatewaysLoading: false, 
          gatewaysError: null 
        });
      });
      
      return unsubscribe;
    },
  }))
);

// Selectors for easier access
export const useGateways = () => useAppStore((state) => state.gateways);
export const useGatewaysLoading = () => useAppStore((state) => state.gatewaysLoading);
export const useGatewaysError = () => useAppStore((state) => state.gatewaysError);
export const useGatewayActions = () => useAppStore((state) => ({
  addGateway: state.addGateway,
  updateGateway: state.updateGateway,
  deleteGateway: state.deleteGateway,
  initializeGateways: state.initializeGateways,
}));
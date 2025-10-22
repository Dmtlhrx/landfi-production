import { useCallback } from 'react';
import { useHashPack } from './useHashPack';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

export const useWallet = () => {
  const { wallet, connectWallet: connectWalletStore } = useAuthStore();
  const hashPack = useHashPack();

  const connectWallet = useCallback(async () => {
    

    if (hashPack.isConnecting) {
      toast('Connexion en cours...');
      return;
    }

    try {
      await hashPack.connect();

      // Après connexion, envoyer le wallet au backend
      const { wallet: storeWallet, token } = useAuthStore.getState();
      if (storeWallet.isConnected && storeWallet.accountId) {
        await axios.post('http://localhost:3001/api/auth/user/wallet', {
          walletHedera: storeWallet.accountId
        
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  }, [hashPack]);

  const disconnectWallet = useCallback(async () => {
    try {
      await hashPack.disconnect();
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
  }, [hashPack]);

  const executeTransaction = useCallback(async (transactionBytes: Uint8Array) => {
    return await hashPack.signAndExecuteTransaction(transactionBytes);
  }, [hashPack]);

  const signTransaction = useCallback(async (transactionBytes: Uint8Array) => {
    return await hashPack.signTransaction(transactionBytes);
  }, [hashPack]);

  return {
    isConnected: hashPack.isConnected,
    isConnecting: hashPack.isConnecting,
    isAvailable: hashPack.isAvailable,
    error: hashPack.error,

    accountId: hashPack.accountId,
    network: hashPack.network,

    connectWallet,
    disconnectWallet,
    executeTransaction,
    signTransaction,

    walletInfo: wallet,
  };
};
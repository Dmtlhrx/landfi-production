// hooks/useWalletConnect.ts - Fixed version with proper transaction object handling
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  AccountId, 
  TransferTransaction, 
  Hbar,
  TransactionId,
  PublicKey,
  LedgerId,
  Transaction // Import Transaction type
} from '@hashgraph/sdk';
import { 
  DAppConnector,
  HederaChainId,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppSigner
} from '@hashgraph/hedera-wallet-connect';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import toast from 'react-hot-toast';

interface WalletConnectState {
  isAvailable: boolean;
  isInitializing: boolean;
  isConnecting: boolean;
  error: string | null;
  connector: DAppConnector | null;
  signer: DAppSigner | null;
}

// Singleton pattern pour éviter les initialisations multiples
let globalConnector: DAppConnector | null = null;
let isInitializing = false;

export const useWalletConnect = () => {
  const [state, setState] = useState<WalletConnectState>({
    isAvailable: false,
    isInitializing: false,
    isConnecting: false,
    error: null,
    connector: null,
    signer: null,
  });

  // État réel de connexion pour éviter les désynchronisations
  const [realConnectionState, setRealConnectionState] = useState({
    isConnected: false,
    accountId: null as string | null,
  });

  const { connectWallet, disconnectWallet, wallet } = useAuthStore();
  const { addNotification } = useUIStore();
  const initRef = useRef(false);
  const eventCleanupRef = useRef<(() => void) | null>(null);

  // Variables d'environnement
  const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
  const NETWORK = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';

  // Configuration des événements de session selon la documentation officielle
  const setupSessionEvents = useCallback((connector: DAppConnector) => {
    try {
      console.log('🔧 Setting up session events...');
      
      // Fonction de nettoyage de session
      const handleSessionEnd = () => {
        console.log('Session ended, cleaning up...');
        disconnectWallet();
        
        // Nettoyer l'état réel
        setRealConnectionState({
          isConnected: false,
          accountId: null
        });
        
        // Nettoyer le connecteur global
        globalConnector = null;
        
        setState(prev => ({ 
          ...prev, 
          connector: null, 
          signer: null,
          isAvailable: false 
        }));
        
        toast.info('Session WalletConnect fermée');
      };

      // Événements selon la documentation
      const cleanupFunctions: Array<() => void> = [];

      // 1. Session delete event
      const onSessionDelete = (callback: () => void) => {
        connector.walletConnectClient?.on('session_delete', callback);
        return () => connector.walletConnectClient?.off('session_delete', callback);
      };

      // 2. Pairing delete event
      const onPairingDelete = (callback: () => void) => {
        connector.walletConnectClient?.core.pairing.events.on('pairing_delete', callback);
        return () => connector.walletConnectClient?.core.pairing.events.off('pairing_delete', callback);
      };

      // 3. Session update event
      const onSessionUpdate = (callback: (session: any) => void) => {
        connector.walletConnectClient?.on('session_update', ({ topic, params }) => {
          callback(params);
        });
        return () => connector.walletConnectClient?.off('session_update', callback);
      };

      // Setup events
      cleanupFunctions.push(onSessionDelete(handleSessionEnd));
      cleanupFunctions.push(onPairingDelete(handleSessionEnd));
      cleanupFunctions.push(onSessionUpdate((session) => {
        console.log('Session updated:', session);
        if (session.accounts && session.accounts.length === 0) {
          handleSessionEnd();
        }
      }));

      // Stocker la fonction de nettoyage
      eventCleanupRef.current = () => {
        cleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Error during event cleanup:', error);
          }
        });
      };

      return true;
      
    } catch (error) {
      console.error('Error setting up session events:', error);
      return false;
    }
  }, [disconnectWallet]);
  
  // Initialisation WalletConnect selon la documentation officielle
  const initializeConnector = useCallback(async (): Promise<DAppConnector | null> => {
    // Éviter les initialisations multiples
    if (globalConnector) {
      console.log('Using existing WalletConnect instance');
      setState(prev => ({
        ...prev,
        connector: globalConnector,
        isAvailable: true,
        error: null
      }));
      return globalConnector;
    }

    if (isInitializing) {
      console.log('Initialization already in progress...');
      return null;
    }

    isInitializing = true;
    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Validation du PROJECT_ID
      if (!PROJECT_ID || PROJECT_ID.length < 32) {
        throw new Error(`PROJECT_ID invalide. Créez un projet sur https://cloud.walletconnect.com/`);
      }

      console.log('Initializing Hedera WalletConnect...');

      // Métadonnées de la dApp selon la documentation
      const metadata = {
        name: import.meta.env.VITE_APP_NAME || 'Hedera Africa',
        description: import.meta.env.VITE_APP_DESCRIPTION || 'Tokenisation de parcelles sur Hedera',
        url: import.meta.env.VITE_APP_URL || window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`],
      };

      // Configuration du réseau selon la documentation
      const ledgerId = NETWORK === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
      
      // Méthodes supportées selon la documentation
      const supportedMethods = Object.values(HederaJsonRpcMethod);
      
      // Événements supportées selon la documentation
      const supportedEvents = [
        HederaSessionEvent.ChainChanged,
        HederaSessionEvent.AccountsChanged,
      ];

      // Chaînes supportées selon la documentation
      const supportedChains = [
        HederaChainId.Mainnet, 
        HederaChainId.Testnet
      ];

      console.log('Creating DAppConnector with proper configuration...');

      // Créer le connecteur selon la documentation officielle
      const connector = new DAppConnector(
        metadata,
        ledgerId,
        PROJECT_ID,
        supportedMethods,
        supportedEvents,
        supportedChains
      );

      console.log('Initializing connector...');

      // Initialisation selon la documentation avec options appropriées
      await connector.init({ 
        logger: import.meta.env.DEV ? 'debug' : 'error'
      });

      console.log('✅ WalletConnect initialized successfully');

      // Stocker globalement
      globalConnector = connector;
      
      setState(prev => ({
        ...prev,
        connector,
        isAvailable: true,
        isInitializing: false,
        error: null
      }));
      
      return connector;
      
    } catch (error) {
      console.error('WalletConnect initialization failed:', error);
      
      let errorMessage = 'WalletConnect initialization failed';
      
      if (error instanceof Error) {
        if (error.message.includes('PROJECT_ID') || error.message.includes('project id')) {
          errorMessage = 'PROJECT_ID invalide - Vérifiez votre configuration sur cloud.walletconnect.com';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erreur de réseau - Vérifiez votre connexion internet';
        } else {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isInitializing: false,
        error: errorMessage
      }));
      
      throw new Error(errorMessage);
      
    } finally {
      isInitializing = false;
    }
  }, [PROJECT_ID, NETWORK]);

  // Initialisation une seule fois
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      console.log('🚀 Starting WalletConnect initialization...');
      
      try {
        const connector = await initializeConnector();
        
        if (connector) {
          // Configurer les événements
          setupSessionEvents(connector);
          console.log('✅ WalletConnect ready for connections');
        } else {
          throw new Error('Failed to initialize WalletConnect');
        }
        
      } catch (error) {
        console.error('Initialization error:', error);
        setState(prev => ({ 
          ...prev, 
          isAvailable: false,
          error: error instanceof Error ? error.message : 'Initialization failed'
        }));
      }
    };

    init();

    // Cleanup
    return () => {
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
      }
    };
  }, [initializeConnector, setupSessionEvents]);

  // Connexion selon la documentation officielle (CORRIGÉE)
  const connect = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable || !state.connector) {
      toast.error('WalletConnect non disponible');
      return false;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    let loadingToast: string | undefined;

    try {
      console.log('🔗 Starting WalletConnect session...');
      
      loadingToast = toast.loading('Connexion WalletConnect...', { 
        duration: 30000 
      });

      // Utiliser openModal() comme dans useHashPack
      const session = await state.connector.openModal();
      console.log('Session created:', session);

      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const signers = state.connector.signers;
        
        if (signers && signers.length > 0) {
          const signer = signers[0];
          const accountId = signer.getAccountId().toString();
          const network = NETWORK;
          
          console.log('✅ Signer connected:', { accountId, network });
          
          // IMPORTANT: Mettre à jour l'état réel de connexion
          setRealConnectionState({
            isConnected: true,
            accountId: accountId
          });
          
          setState(prev => ({ 
            ...prev, 
            signer,
            isConnecting: false 
          }));

          // Connecter dans le store seulement après avoir confirmé la vraie connexion
          connectWallet(accountId, network);
          
          toast.dismiss(loadingToast);
          toast.success(`Wallet connecté: ${accountId}`);
          
          addNotification({
            type: 'success',
            title: 'Wallet connecté',
            message: `Account connecté: ${accountId}`,
          });
          
          return true;
        }
        
        attempts++;
      }
      
      throw new Error('Aucun signer reçu après la connexion');
      
    } catch (error) {
      console.error('Connection error:', error);
      
      // Nettoyer l'état réel en cas d'erreur
      setRealConnectionState({
        isConnected: false,
        accountId: null
      });
      
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      let errorMessage = 'Erreur de connexion';
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || 
            error.message.includes('denied') ||
            error.message.includes('cancelled')) {
          errorMessage = 'Connexion annulée par l\'utilisateur';
        } else if (error.message.includes('timeout') || error.message.includes('Aucun signer')) {
          errorMessage = 'Timeout - Réessayez ou vérifiez votre wallet';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      setState(prev => ({ ...prev, error: errorMessage }));
      
      return false;
      
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [state.isAvailable, state.connector, connectWallet, addNotification, NETWORK]);

  // Déconnexion propre selon la documentation (CORRIGÉE)
  const disconnect = useCallback(async () => {
    try {
      // Nettoyer l'état réel en premier
      setRealConnectionState({
        isConnected: false,
        accountId: null
      });

      // Nettoyer les événements
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
        eventCleanupRef.current = null;
      }

      // Déconnecter via le connecteur
      if (state.connector) {
        await state.connector.disconnect();
        console.log('WalletConnect session terminated');
      }
      
      // Nettoyer l'état global
      globalConnector = null;
      
      // Mettre à jour l'état local
      setState(prev => ({ 
        ...prev, 
        connector: null, 
        signer: null,
        isAvailable: false 
      }));
      
    } catch (error) {
      console.error('Disconnect error:', error);
    }
    
    // Déconnecter du store
    disconnectWallet();
    
    addNotification({
      type: 'info',
      title: 'Wallet déconnecté',
      message: 'Session WalletConnect fermée',
    });
    
    toast.success('Wallet déconnecté');
  }, [state.connector, disconnectWallet, addNotification]);

  // Check connection status
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!state.connector || !state.isAvailable) {
        return false;
      }

      const hasSigners = state.connector.signers && state.connector.signers.length > 0;
      
      if (hasSigners && !realConnectionState.isConnected) {
        // Update state if connector has signers but state doesn't reflect it
        const signer = state.connector.signers[0];
        const accountId = signer.getAccountId().toString();
        
        setRealConnectionState({
          isConnected: true,
          accountId: accountId
        });
        
        setState(prev => ({
          ...prev,
          signer
        }));
      }

      return hasSigners;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }, [state.connector, state.isAvailable, realConnectionState.isConnected]);

  // Surveillance des changements de connexion et synchronisation
  useEffect(() => {
    if (state.signer && state.connector?.signers?.length) {
      const signer = state.connector.signers[0];
      const accountId = signer.getAccountId().toString();
      if (!realConnectionState.isConnected || realConnectionState.accountId !== accountId) {
        setRealConnectionState({
          isConnected: true,
          accountId: accountId
        });
      }
    } else if (realConnectionState.isConnected) {
      setRealConnectionState({
        isConnected: false,
        accountId: null
      });
    }
  }, [state.signer, state.connector?.signers, realConnectionState]);

  // Auto-check connection on connector change
  useEffect(() => {
    if (state.connector && state.isAvailable) {
      checkConnection();
    }
  }, [state.connector, state.isAvailable, checkConnection]);

  // FIXED: Signature de transaction with transaction bytes (for sign-only operations)
  const signTransaction = useCallback(async (transactionBytes: Uint8Array) => {
    console.log('🔍 Pre-signature verification:', {
      walletConnected: wallet.isConnected,
      realConnected: realConnectionState.isConnected,
      accountId: realConnectionState.accountId,
      hasSigner: !!state.signer
    });
    
    if (!wallet.isConnected) {
      console.error('❌ Store wallet not connected');
      throw new Error('Wallet not connected in store');
    }
    
    if (!realConnectionState.isConnected) {
      console.error('❌ WalletConnect not connected');
      throw new Error('WalletConnect not connected');
    }
    
    if (!realConnectionState.accountId) {
      console.error('❌ No account ID');
      throw new Error('No account ID available');
    }
    
    if (!state.signer) {
      console.error('❌ No signer available');
      throw new Error('No signer available');
    }

    try {
      console.log('🖊️ Attempting transaction signature...');
      
      const signedTransaction = await state.signer.sign(transactionBytes);
      
      console.log('✅ Transaction signed successfully');
      return signedTransaction;
      
    } catch (error: any) {
      console.error('❌ Transaction signing error:', error);
      
      if (error.message?.includes('User rejected') || 
          error.message?.includes('denied') ||
          error.message?.includes('cancelled')) {
        throw new Error('Signature annulée par l\'utilisateur');
      } else if (error.message?.includes('not connected') ||
                 error.message?.includes('disconnected') ||
                 error.message?.includes('non connecté')) {
        throw new Error('Wallet non connecté');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Timeout lors de la signature');
      } else {
        throw new Error(`Erreur de signature: ${error.message || 'Erreur inconnue'}`);
      }
    }
  }, [state.signer, wallet.isConnected, realConnectionState]);

  // FIXED: Exécution de transaction with transaction object (not bytes)
  const signAndExecuteTransaction = useCallback(async (transaction: Transaction) => {
    console.log('🔍 Pre-execution verification:', {
      walletConnected: wallet.isConnected,
      realConnected: realConnectionState.isConnected,
      accountId: realConnectionState.accountId,
      hasSigner: !!state.signer,
      transactionType: transaction.constructor.name
    });
    
    if (!wallet.isConnected || !realConnectionState.isConnected || !state.signer) {
      throw new Error('Wallet not properly connected');
    }

    try {
      console.log('🚀 Executing transaction with signer.call()...');
      
      // FIXED: Pass the transaction object directly, not bytes
      // The DAppSigner.call() method will internally call transaction.toBytes()
      const result = await state.signer.call(transaction);
      
      console.log('✅ Transaction executed successfully:', result);
      return result;
      
    } catch (error: any) {
      console.error('❌ Transaction execution error:', error);
      
      if (error.message?.includes('User rejected') || 
          error.message?.includes('denied') ||
          error.message?.includes('cancelled')) {
        throw new Error('Transaction annulée par l\'utilisateur');
      } else if (error.message?.includes('insufficient') ||
                 error.message?.includes('Insufficient')) {
        throw new Error('Fonds insuffisants pour la transaction');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Timeout lors de l\'exécution');
      } else if (error.message?.includes('network') ||
                 error.message?.includes('consensus')) {
        throw new Error('Erreur réseau Hedera - Réessayez');
      } else if (error.message?.includes('toBytes is not a function')) {
        throw new Error('Transaction object invalide - Vérifiez le format');
      } else {
        throw new Error(`Erreur d'exécution: ${error.message || 'Erreur inconnue'}`);
      }
    }
  }, [state.signer, wallet.isConnected, realConnectionState]);

  return {
    // État WalletConnect
    connector: state.connector,
    signer: state.signer,
    isAvailable: state.isAvailable,
    isInitialized: state.isAvailable && !state.error,
    isInitializing: state.isInitializing,
    isConnecting: state.isConnecting,
    initError: state.error,
    
    // État réel de connexion (CRITIQUE: utiliser realConnectionState)
    isConnected: realConnectionState.isConnected,
    accountId: realConnectionState.accountId,
    network: NETWORK,
    
    // Actions principales
    initializeConnector,
    connect,
    disconnect,
    signTransaction, // For bytes (sign-only)
    signAndExecuteTransaction, // FIXED: For transaction objects (sign and execute)
    checkConnection,
    
    // Computed
    isReady: state.isAvailable && !state.error,
    hasError: !!state.error,
  };
};
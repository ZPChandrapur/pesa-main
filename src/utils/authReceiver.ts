// Authentication receiver utility for PESA application
// This handles automatic login from the main ZP Chandrapur application

import { supabase } from './supabase';

interface AuthTransferData {
  access_token: string;
  refresh_token: string;
  user: any;
  expires_at: number;
  auto_login: boolean;
  source_app: string;
  timestamp: number;
}

export const handleAutoLogin = async (appName: string = 'estimate'): Promise<boolean> => {
  try {
    console.log(`🔍 ${appName.toUpperCase()}: Checking for SSO auto-login data...`);

    // Method 1: Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const autoLogin = urlParams.get('auto_login');
    const source = urlParams.get('source');

    if (autoLogin === 'true' && source === 'zp_main') {
      console.log(`📧 ${appName.toUpperCase()}: Found URL parameters for SSO auto-login`);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log(`🔑 ${appName.toUpperCase()}: Setting session from URL parameters...`);

        // Set the session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (!error && data.session) {
          console.log(`✅ ${appName.toUpperCase()}: SSO auto-login successful via URL parameters`);

          // Clean URL parameters immediately
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          return true;
        } else {
          console.error(`❌ ${appName.toUpperCase()}: Failed to set session from URL:`, error);
        }
      }
    }
    
    // Method 2: Check localStorage
    const getStorageKey = (app: string) => {
      switch (app) {
        case 'fims': return 'fims_auth_transfer';
        case 'pesa': return 'pesa_auth_transfer';
        case 'workflow': return 'workflow_auth_transfer';
        default: return 'estimate_auth_transfer';
      }
    };

    const storageKey = getStorageKey(appName);
    const authTransferData = localStorage.getItem(storageKey);
    if (authTransferData) {
      console.log(`💾 ${appName.toUpperCase()}: Found localStorage SSO auth data`);

      try {
        const authData: AuthTransferData = JSON.parse(authTransferData);

        // Check if data is not too old (30 seconds max)
        const isDataFresh = (Date.now() - authData.timestamp) < 30000;

        if (authData.auto_login &&
            authData.source_app === 'zp_chandrapur_main' &&
            isDataFresh) {

          console.log(`🔑 ${appName.toUpperCase()}: Setting session from localStorage SSO data...`);

          // Set the session in Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: authData.access_token,
            refresh_token: authData.refresh_token
          });

          if (!error && data.session) {
            console.log(`✅ ${appName.toUpperCase()}: SSO auto-login successful via localStorage`);

            // Clean up the transfer data immediately
            localStorage.removeItem(storageKey);

            return true;
          } else {
            console.error(`❌ ${appName.toUpperCase()}: Failed to set session from localStorage:`, error);
          }
        } else {
          console.log(`⏰ ${appName.toUpperCase()}: SSO auth data expired or invalid (age: ${(Date.now() - authData.timestamp) / 1000}s), removing...`);
          localStorage.removeItem(storageKey);
        }
      } catch (parseError) {
        console.error(`❌ ${appName.toUpperCase()}: Error parsing SSO auth transfer data:`, parseError);
        localStorage.removeItem(storageKey);
      }
    }

    console.log(`ℹ️ ${appName.toUpperCase()}: No valid SSO auto-login data found`);
    return false;
    
  } catch (error) {
    console.error(`❌ ${appName.toUpperCase()}: Error in auto-login process:`, error);
    
    // Clean up any potentially corrupted data
    try {
      const getStorageKey = (app: string) => {
        switch (app) {
          case 'fims': return 'fims_auth_transfer';
          case 'pesa': return 'pesa_auth_transfer';
          case 'workflow': return 'workflow_auth_transfer';
          default: return 'estimate_auth_transfer';
        }
      };
      
      const storageKey = getStorageKey(appName);
      localStorage.removeItem(storageKey);
    } catch (cleanupError) {
      console.error(`❌ ${appName.toUpperCase()}: Error cleaning up auth data:`, cleanupError);
    }
    
    return false;
  }
};

// Function to be called when app initializes
// Note: This does NOT automatically reload the page - the calling code should handle that
export const initializeAuthReceiver = async (appName: string = 'estimate') => {
  console.log(`🚀 ${appName.toUpperCase()}: Initializing SSO auth receiver...`);

  try {
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log(`👤 ${appName.toUpperCase()}: User already logged in via existing session`);
      return true;
    }

    // Try auto-login from SSO
    console.log(`🔄 ${appName.toUpperCase()}: Attempting SSO auto-login...`);
    const autoLoginSuccess = await handleAutoLogin(appName);

    if (autoLoginSuccess) {
      console.log(`🎉 ${appName.toUpperCase()}: SSO auto-login successful!`);
      return true;
    } else {
      console.log(`ℹ️ ${appName.toUpperCase()}: No SSO data found, user needs to login manually`);
      return false;
    }

  } catch (error) {
    console.error(`❌ ${appName.toUpperCase()}: Error initializing auth receiver:`, error);
    return false;
  }
};

// Utility function to check if auto-login is available
export const isAutoLoginAvailable = (appName: string = 'estimate'): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  const hasUrlAuth = urlParams.get('auto_login') === 'true';
  
  const getStorageKey = (app: string) => {
    switch (app) {
      case 'fims': return 'fims_auth_transfer';
      case 'pesa': return 'pesa_auth_transfer';
      case 'workflow': return 'workflow_auth_transfer';
      default: return 'estimate_auth_transfer';
    }
  };
  
  const storageKey = getStorageKey(appName);
  const hasStorageAuth = localStorage.getItem(storageKey) !== null;
  
  return hasUrlAuth || hasStorageAuth;
};

// Export for use in E-estimate and FIMS applications
export default {
  handleAutoLogin,
  initializeAuthReceiver,
  isAutoLoginAvailable
};
// Environment configuration for HOPCAT
export const config = {
  // Contract address
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '2VchPMEGNyimpF8HpiCTq2t51tYXGqvYV6344WENpump',
  
  // Social media URLs
  urls: {
    xCommunity: import.meta.env.VITE_X_COMMUNITY_URL || 'https://x.com/i/communities/1981772043587928442',
    tiktok: import.meta.env.VITE_TIKTOK_URL || 'https://tiktok.com/@nana.01812/video/7563749421742181654?is_from_webapp=1&sender_device=pc',
    github: import.meta.env.VITE_GITHUB_URL || 'https://github.com/chef4114n/hopcat',
    developer: import.meta.env.VITE_DEVELOPER_URL || 'https://x.com/chef4114n'
  },

  // Firebase configuration (for future use)
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  }
};

// Validate required environment variables
export const validateConfig = (): boolean => {
  const required = [
    config.contractAddress
  ];

  const missing = required.filter(value => !value || value === '');
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables. Using fallback values.');
    return false;
  }
  
  return true;
};

// Initialize and validate configuration
validateConfig();

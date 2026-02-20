import React, { createContext, useContext, useEffect, useState } from 'react';

export interface BrandTokens {
  'color.primary': string;
  'color.accent': string;
  'color.background': string;
  'color.text': string;
  'font.family': string;
  'borderRadius': string;
  [key: string]: string;
}

interface ThemeContextType {
  tokens: BrandTokens | null;
  loading: boolean;
  logoUrl: string | null;
  refreshTheme: () => Promise<void>;
}

const defaultTokens: BrandTokens = {
  'color.primary': '#6e4ae0',
  'color.accent': '#00c9b7',
  'color.background': '#ffffff',
  'color.text': '#222222',
  'font.family': 'Inter, system-ui, sans-serif',
  'borderRadius': '8px'
};

const ThemeContext = createContext<ThemeContextType>({
  tokens: defaultTokens,
  loading: false,
  logoUrl: null,
  refreshTheme: async () => {}
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  tenantId?: string;
}

export function ThemeProvider({ children, tenantId }: ThemeProviderProps) {
  const [tokens, setTokens] = useState<BrandTokens | null>(defaultTokens);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refreshTheme = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/brand?tenant_id=${tenantId}`);
      const data = await response.json();
      
      if (data.brand?.tokens) {
        setTokens(data.brand.tokens);
        applyTokensToCSS(data.brand.tokens);
      }
      
      if (data.brand?.logoKey) {
        const logoResp = await fetch(`/api/brand/logo-url?key=${data.brand.logoKey}&tenant_id=${tenantId}`);
        const logoData = await logoResp.json();
        setLogoUrl(logoData.url);
      }
    } catch (err) {
      console.error('Failed to load theme:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      refreshTheme();
    }
  }, [tenantId]);

  return (
    <ThemeContext.Provider value={{ tokens, loading, logoUrl, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTokensToCSS(tokens: BrandTokens) {
  const root = document.documentElement;
  
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

export default ThemeContext;

'use client';
    
import React, { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translations: any;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const resolveKey = (key: string, obj: any): string | undefined => {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState('en');
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguageState(savedLanguage);
  }, []);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/messages/${language}.json`);
        if (!response.ok) {
          // Fallback to English if translation file not found
          const fallbackResponse = await fetch(`/messages/en.json`);
          const data = await fallbackResponse.json();
          setTranslations(data);
          return;
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English on error
        try {
          const fallbackResponse = await fetch(`/messages/en.json`);
          const data = await fallbackResponse.json();
          setTranslations(data);
        } catch (fallbackError) {
          console.error('Failed to load fallback translations:', fallbackError);
        }
      }
    };

    fetchTranslations();
  }, [language]);

  const setLanguage = (lang: string) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    const value = resolveKey(key, translations);
    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found for language "${language}".`);
      return key;
    }

    if (options) {
        return value.replace(/\{\{(\w+)\}\}/g, (placeholder, placeholderName) => {
            return options[placeholderName] !== undefined ? String(options[placeholderName]) : placeholder;
        });
    }
    
    return value;
  }, [translations, language]);

  const value = { language, setLanguage, translations, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

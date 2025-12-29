'use client'

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Language, translations } from './translations'

type TranslationKeys = typeof translations.es | typeof translations.en

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.es | typeof translations.en
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Valor por defecto para evitar errores durante SSR
const defaultLanguage: Language = 'es'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Solo leer del localStorage después de que el componente se monte (cliente)
    setMounted(true)
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = savedLanguage
      }
    } else {
      // Detectar idioma del navegador
      const browserLang = navigator.language.split('-')[0]
      const detectedLang: Language = browserLang === 'es' ? 'es' : 'en'
      setLanguageState(detectedLang)
      localStorage.setItem('language', detectedLang)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = detectedLang
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // Actualizar el atributo lang del HTML
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }

  // Siempre proporcionar el contexto, incluso antes de montar
  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}


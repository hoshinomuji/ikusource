"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { dictionaries, Locale, DictionaryKey } from "@/lib/dictionaries"

type TranslationContextType = {
    locale: Locale
    setLocale: (loc: Locale) => void
    t: (key: DictionaryKey | string) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("th")

    useEffect(() => {
        const saved = localStorage.getItem("app-locale") as Locale
        if (saved === "th" || saved === "en") {
            setLocaleState(saved)
        }
        // default: always Thai, no browser detection
    }, [])

    const setLocale = (loc: Locale) => {
        setLocaleState(loc)
        localStorage.setItem("app-locale", loc)
        document.cookie = `NEXT_LOCALE=${loc}; path=/; max-age=31536000` // 1 year setup
    }

    const t = (key: string) => {
        const dict = dictionaries[locale] as any
        return dict[key] || key; // fallback to key
    }

    return (
        <TranslationContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </TranslationContext.Provider>
    )
}

export function useTranslation() {
    const ctx = useContext(TranslationContext)
    if (!ctx) {
        // Return a safe fallback so that components don't crash if omitted by mistake
        return { locale: "th" as Locale, setLocale: () => { }, t: (k: string) => k }
    }
    return ctx
}

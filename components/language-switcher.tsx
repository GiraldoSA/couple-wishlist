'use client'

import { useLanguage } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[40px] min-w-[40px] sm:min-w-[auto] border-rose-300 text-rose-900 hover:bg-rose-100 bg-transparent px-2 sm:px-3"
        >
          <Languages className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{language === 'es' ? 'ES' : 'EN'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setLanguage('es')}
          className={`min-h-[44px] text-base ${language === 'es' ? 'bg-rose-50 text-rose-900' : ''}`}
        >
          <span className="mr-2">🇪🇸</span>
          Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={`min-h-[44px] text-base ${language === 'en' ? 'bg-rose-50 text-rose-900' : ''}`}
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

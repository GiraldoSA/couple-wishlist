'use client'

import { useLanguage } from '@/lib/i18n/context'

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="w-full border-t border-rose-200 bg-white/80 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <p className="text-xs sm:text-sm text-rose-700">
            {t.footer.developedBy} <span className="font-semibold text-rose-900">Carlos Giraldo</span>
          </p>
        </div>
      </div>
    </footer>
  )
}


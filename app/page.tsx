'use client'

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-rose-50 via-amber-50 to-pink-50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl text-center px-4">
        <div className="mb-4 sm:mb-6 flex justify-center">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-rose-600">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-white fill-white" />
          </div>
        </div>
        <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl font-bold text-rose-900 px-2">
          {t.home.title}
        </h1>
        <p className="mb-6 sm:mb-8 text-base sm:text-lg md:text-xl text-rose-700 leading-relaxed px-2">
          {t.home.subtitle}
        </p>
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center px-2">
          <Button 
            asChild 
            size="lg" 
            className="w-full sm:w-auto min-h-[44px] bg-rose-600 hover:bg-rose-700 text-base sm:text-lg px-6"
          >
            <Link href="/auth/signup">{t.home.getStarted}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-h-[44px] border-rose-300 text-rose-900 hover:bg-rose-100 text-base sm:text-lg bg-transparent px-6"
          >
            <Link href="/auth/login">{t.common.login}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

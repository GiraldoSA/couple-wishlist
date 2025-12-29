'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"

export default function CheckEmailPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-br from-rose-50 via-amber-50 to-pink-50">
      <div className="w-full max-w-sm">
        <Card className="border-rose-200 shadow-xl">
          <CardHeader className="text-center px-4 pt-6 pb-4 sm:px-6 sm:pt-6 sm:pb-4">
            <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-rose-100">
              <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-rose-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-rose-900">{t.auth.checkYourEmail}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-rose-700 mt-2">{t.auth.confirmationLinkSent}</CardDescription>
          </CardHeader>
          <CardContent className="text-center px-4 sm:px-6 pb-6">
            <p className="mb-4 text-xs sm:text-sm text-rose-800">
              {t.auth.checkEmailMessage}
            </p>
            <Link href="/auth/login" className="text-xs sm:text-sm font-semibold text-rose-900 underline underline-offset-4">
              {t.auth.backToLogin}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

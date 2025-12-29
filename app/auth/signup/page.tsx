"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/lib/i18n/context"

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(t.auth.passwordsDoNotMatch)
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/wishlist`,
          data: {
            display_name: displayName,
          },
        },
      })
      if (error) throw error
      router.push("/auth/check-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 w-full items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-br from-rose-50 via-amber-50 to-pink-50">
      <div className="w-full max-w-sm">
        <Card className="border-rose-200 shadow-xl">
          <CardHeader className="text-center px-4 pt-6 pb-4 sm:px-6 sm:pt-6 sm:pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-rose-900">{t.auth.createAccount}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-rose-700 mt-2">{t.auth.startBuildingTogether}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="displayName" className="text-sm sm:text-base text-rose-900">
                    {t.common.displayName}
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder={t.auth.yourName}
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="min-h-[44px] text-base border-rose-200 focus:border-rose-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm sm:text-base text-rose-900">
                    {t.common.email}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[44px] text-base border-rose-200 focus:border-rose-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm sm:text-base text-rose-900">
                    {t.common.password}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="min-h-[44px] text-base border-rose-200 focus:border-rose-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="text-sm sm:text-base text-rose-900">
                    {t.common.confirmPassword}
                  </Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="min-h-[44px] text-base border-rose-200 focus:border-rose-400"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px] text-base bg-rose-600 hover:bg-rose-700 mt-2" 
                  disabled={isLoading}
                >
                  {isLoading ? t.auth.creatingAccount : t.common.signup}
                </Button>
              </div>
              <div className="mt-4 text-center text-xs sm:text-sm text-rose-700">
                {t.auth.alreadyHaveAccount}{" "}
                <Link href="/auth/login" className="font-semibold text-rose-900 underline underline-offset-4">
                  {t.common.login}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

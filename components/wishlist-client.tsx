"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  Plus,
  Trash2,
  Check,
  LogOut,
  UserPlus,
  Mail,
  X,
  Gift,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/context"

type WishlistItem = {
  id: string
  user_id: string
  title: string
  description: string | null
  is_shared: boolean
  is_completed: boolean
  is_joint?: boolean
  gifted_by?: string | null
  gifted_at?: string | null
  gifted_by_user?: {
    id: string
    email: string
  } | null
  created_at: string
}

type Profile = {
  id: string
  display_name: string
  partner_id: string | null
  partner?: {
    id: string
    display_name: string
  }
}

type PartnerInvitation = {
  id: string
  inviter_id: string
  invitee_email: string
  status: string
  created_at: string
  inviter?: {
    id: string
    display_name: string
  }
}

export default function WishlistClient({
  user,
  profile,
  myItems: initialMyItems,
  partnerItems: initialPartnerItems,
  jointItems: initialJointItems = [],
  sentInvitations: initialSentInvitations = [],
  receivedInvitations: initialReceivedInvitations = [],
}: {
  user: any
  profile: Profile | null
  myItems: WishlistItem[]
  partnerItems: WishlistItem[]
  jointItems?: WishlistItem[]
  sentInvitations?: PartnerInvitation[]
  receivedInvitations?: PartnerInvitation[]
}) {
  const [myItems, setMyItems] = useState(initialMyItems)
  const [partnerItems, setPartnerItems] = useState(initialPartnerItems)
  const [jointItems, setJointItems] = useState(initialJointItems)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [partnerEmail, setPartnerEmail] = useState("")
  const [sentInvitations, setSentInvitations] = useState(initialSentInvitations)
  const [receivedInvitations, setReceivedInvitations] = useState(initialReceivedInvitations)
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    is_shared: false,
    is_joint: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  // Recargar invitaciones periódicamente
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch("/api/invitations")
      if (response.ok) {
        const data = await response.json()
        setSentInvitations(data.sent || [])
        setReceivedInvitations(data.received || [])
      }
    }, 5000) // Cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from("wishlist_items")
      .insert({
        user_id: user.id,
        title: newItem.title,
        description: newItem.description || null,
        is_shared: newItem.is_shared,
        is_joint: newItem.is_joint && profile?.partner_id ? true : false,
      })
      .select()
      .single()

    if (!insertError && data) {
      setMyItems([data, ...myItems])
      if (newItem.is_joint && profile?.partner_id) {
        setJointItems([data, ...jointItems])
      }
      setNewItem({ title: "", description: "", is_shared: false, is_joint: false })
      setShowAddForm(false)
    } else {
      setError(insertError?.message || "Error al agregar el item")
    }
    setIsLoading(false)
  }

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
    const { error: updateError } = await supabase
      .from("wishlist_items")
      .update({ is_completed: !currentStatus })
      .eq("id", itemId)

    if (!updateError) {
      setMyItems(myItems.map((item) => (item.id === itemId ? { ...item, is_completed: !currentStatus } : item)))
      setPartnerItems(
        partnerItems.map((item) => (item.id === itemId ? { ...item, is_completed: !currentStatus } : item))
      )
      setJointItems(jointItems.map((item) => (item.id === itemId ? { ...item, is_completed: !currentStatus } : item)))
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t.common.delete + "?")) return

    const { error: deleteError } = await supabase.from("wishlist_items").delete().eq("id", itemId)

    if (!deleteError) {
      setMyItems(myItems.filter((item) => item.id !== itemId))
      setJointItems(jointItems.filter((item) => item.id !== itemId))
    }
  }

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: partnerEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar invitación")
      }

      setSentInvitations([data.invitation, ...sentInvitations])
      setPartnerEmail("")
      setShowPartnerForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar invitación")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action: "accept" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al aceptar invitación")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al aceptar invitación")
      setIsLoading(false)
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action: "reject" }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al rechazar invitación")
      }

      setReceivedInvitations(receivedInvitations.filter((inv) => inv.id !== invitationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al rechazar invitación")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations?id=${invitationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al cancelar invitación")
      }

      setSentInvitations(sentInvitations.filter((inv) => inv.id !== invitationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar invitación")
    }
  }

  const handleMarkAsGifted = async (itemId: string, isGifted: boolean) => {
    try {
      const response = await fetch("/api/wishlist/gift", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isGifted }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t.wishlist.markAsGifted)
      }

      const { item } = await response.json()

      // Actualizar el item en el estado
      setMyItems(myItems.map((i) => (i.id === itemId ? { ...i, ...item } : i)))
      setPartnerItems(partnerItems.map((i) => (i.id === itemId ? { ...i, ...item } : i)))
      setJointItems(jointItems.map((i) => (i.id === itemId ? { ...i, ...item } : i)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t.wishlist.markAsGifted)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const canMarkAsGifted = (item: WishlistItem) => {
    return profile?.partner_id && item.user_id && item.user_id !== user.id && !item.gifted_by
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-pink-50">
      <div className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-rose-600 flex-shrink-0">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-rose-900 truncate">{t.wishlist.title}</h1>
              <p className="text-xs sm:text-sm text-rose-700 truncate">
                {profile?.partner ? `${t.common.welcome} & ${profile.partner.display_name}` : profile?.display_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!profile?.partner_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPartnerForm(!showPartnerForm)}
                className="min-h-[40px] border-rose-300 text-rose-900 hover:bg-rose-100 text-xs sm:text-sm px-2 sm:px-3"
              >
                <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t.partner.invitePartner}</span>
                <span className="sm:hidden">{t.partner.invitePartner.split(' ')[0]}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="min-h-[40px] border-rose-300 text-rose-900 hover:bg-rose-100 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t.common.logout}</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-4 sm:mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Invitaciones Recibidas */}
        {receivedInvitations.length > 0 && (
          <Card className="mb-4 sm:mb-6 border-amber-200 bg-amber-50">
            <CardHeader className="px-4 pt-6 pb-4 sm:px-6 sm:pt-6 sm:pb-4">
              <CardTitle className="text-base sm:text-lg text-amber-900">{t.partner.invitationsReceived}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 sm:px-6 pb-6">
              {receivedInvitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-white p-3 sm:p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-amber-900 break-words">
                      {invitation.inviter?.display_name || invitation.invitee_email} {t.partner.hasInvitedYou}
                    </p>
                    <p className="text-xs text-amber-700 break-all">{invitation.invitee_email}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      disabled={isLoading}
                      className="min-h-[44px] flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-sm"
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {t.partner.accept}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectInvitation(invitation.id)}
                      disabled={isLoading}
                      className="min-h-[44px] flex-1 sm:flex-initial border-red-300 text-red-700 hover:bg-red-50 text-sm"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      {t.partner.reject}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Invitaciones Enviadas */}
        {sentInvitations.filter((inv) => inv.status === "pending").length > 0 && (
          <Card className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="px-4 pt-6 pb-4 sm:px-6 sm:pt-6 sm:pb-4">
              <CardTitle className="text-base sm:text-lg text-blue-900">{t.partner.invitationsSent}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 sm:px-6 pb-6">
              {sentInvitations
                .filter((inv) => inv.status === "pending")
                .map((invitation) => (
                  <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-white p-3 sm:p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base text-blue-900">{t.partner.invitationSentTo}</p>
                      <p className="text-xs text-blue-700 break-all">{invitation.invitee_email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="min-h-[44px] w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50 text-sm"
                    >
                      <X className="mr-1 h-4 w-4" />
                      {t.partner.cancel}
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Partner Invitation Form */}
        {showPartnerForm && !profile?.partner_id && (
          <Card className="mb-4 sm:mb-6 border-rose-200">
            <CardHeader className="px-4 pt-6 pb-4 sm:px-6 sm:pt-6 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl text-rose-900">{t.partner.invitePartner}</CardTitle>
              <CardDescription className="text-sm sm:text-base">{t.partner.enterPartnerEmail}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
              <form onSubmit={handleSendInvitation} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="pareja@example.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="min-h-[44px] text-base border-rose-200 flex-1"
                  required
                />
                <Button 
                  type="submit" 
                  className="min-h-[44px] w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-sm sm:text-base" 
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t.partner.sendInvitation}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPartnerForm(false)
                    setPartnerEmail("")
                  }}
                  className="min-h-[44px] w-full sm:w-auto border-rose-300 text-rose-900 text-sm sm:text-base"
                >
                  {t.common.cancel}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add Item Button */}
        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="mb-4 sm:mb-6 w-full min-h-[44px] text-base bg-rose-600 hover:bg-rose-700" 
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t.wishlist.addNewDream}
          </Button>
        )}

        {/* Add Item Form */}
        {showAddForm && (
          <Card className="mb-4 sm:mb-6 border-rose-200 shadow-lg">
            <CardHeader className="px-4 pt-6 pb-4 sm:px-6 sm:pt-6 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl text-rose-900">{t.wishlist.addNewDream}</CardTitle>
              <CardDescription className="text-sm sm:text-base">{t.wishlist.whatDoYouWant}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
              <form onSubmit={handleAddItem} className="space-y-4 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm sm:text-base text-rose-900">
                    {t.wishlist.dreamTitle}
                  </Label>
                  <Input
                    id="title"
                    placeholder="ej: Visitar París, Aprender fotografía"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="min-h-[44px] text-base border-rose-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm sm:text-base text-rose-900">
                    {t.wishlist.dreamDescription}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Agrega más detalles sobre este sueño..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="text-base border-rose-200"
                    rows={3}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shared"
                      checked={newItem.is_shared}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, is_shared: checked })}
                    />
                    <Label htmlFor="shared" className="text-sm sm:text-base text-rose-900">
                      {t.wishlist.shareWithPartner}
                    </Label>
                  </div>
                  {profile?.partner_id && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="joint"
                        checked={newItem.is_joint}
                        onCheckedChange={(checked) => setNewItem({ ...newItem, is_joint: checked })}
                      />
                      <Label htmlFor="joint" className="text-sm sm:text-base text-rose-900">
                        {t.wishlist.jointDream}
                      </Label>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 min-h-[44px] text-base bg-rose-600 hover:bg-rose-700" 
                    disabled={isLoading}
                  >
                    {t.wishlist.addDream}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="min-h-[44px] text-base border-rose-300 text-rose-900"
                  >
                    {t.common.cancel}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Wishlist Tabs */}
        <Tabs defaultValue="my-dreams" className="space-y-3 sm:space-y-4">
          <TabsList className={`grid w-full bg-rose-100 ${profile?.partner_id ? 'grid-cols-4' : 'grid-cols-2'} h-auto`}>
            <TabsTrigger 
              value="my-dreams" 
              className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
            >
              <span className="truncate">{t.wishlist.myDreams}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="shared" 
              className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
            >
              <span className="truncate">{t.wishlist.sharedDreams}</span>
            </TabsTrigger>
            {profile?.partner_id && (
              <>
                <TabsTrigger 
                  value="partner" 
                  className="min-h-[44px] text-xs sm:text-sm px-1 sm:px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
                >
                  <span className="truncate hidden sm:inline">{profile.partner?.display_name || t.partner.linkPartner}</span>
                  <span className="truncate sm:hidden">Pareja</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="joint" 
                  className="min-h-[44px] text-xs sm:text-sm px-1 sm:px-3 data-[state=active]:bg-rose-600 data-[state=active]:text-white"
                >
                  <Users className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate hidden sm:inline">{t.wishlist.jointDreams}</span>
                  <span className="truncate sm:hidden">Conj</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* My Dreams Tab */}
          <TabsContent value="my-dreams" className="space-y-3 sm:space-y-4">
            {myItems.length === 0 ? (
              <Card className="border-rose-200">
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                  <Heart className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-rose-300" />
                  <p className="text-sm sm:text-base text-rose-700 text-center">{t.wishlist.noDreamsYet}</p>
                </CardContent>
              </Card>
            ) : (
              myItems.map((item) => (
                <Card
                  key={item.id}
                  className={`border-rose-200 transition-all ${item.is_completed ? "opacity-60" : ""}`}
                >
                  <CardContent className="flex items-start gap-2 sm:gap-4 p-4 sm:p-6">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleComplete(item.id, item.is_completed)}
                      className={`mt-1 shrink-0 min-h-[40px] min-w-[40px] ${
                        item.is_completed ? "border-rose-600 bg-rose-600 text-white" : "border-rose-300 text-rose-600"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base sm:text-lg font-semibold text-rose-900 break-words ${item.is_completed ? "line-through" : ""}`}>
                        {item.title}
                      </h3>
                      {item.description && <p className="mt-1 text-sm text-rose-700 break-words">{item.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.is_shared && (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-800 text-xs">
                            {t.wishlist.shared}
                          </Badge>
                        )}
                        {item.is_joint && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {t.wishlist.joint}
                          </Badge>
                        )}
                        {item.gifted_by && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                            <Gift className="mr-1 h-3 w-3" />
                            {t.wishlist.gifted}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                      className="shrink-0 min-h-[40px] min-w-[40px] text-rose-600 hover:bg-rose-100 hover:text-rose-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Shared Dreams Tab */}
          <TabsContent value="shared" className="space-y-3 sm:space-y-4">
            {myItems.filter((item) => item.is_shared).length === 0 ? (
              <Card className="border-rose-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="mb-4 h-12 w-12 text-rose-300" />
                  <p className="text-rose-700">{t.wishlist.noSharedDreams}</p>
                </CardContent>
              </Card>
            ) : (
              myItems
                .filter((item) => item.is_shared)
                .map((item) => (
                  <Card
                    key={item.id}
                    className={`border-rose-200 transition-all ${item.is_completed ? "opacity-60" : ""}`}
                  >
                    <CardContent className="flex items-start gap-2 sm:gap-4 p-4 sm:p-6">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleComplete(item.id, item.is_completed)}
                        className={`mt-1 shrink-0 min-h-[40px] min-w-[40px] ${
                          item.is_completed ? "border-rose-600 bg-rose-600 text-white" : "border-rose-300 text-rose-600"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-base sm:text-lg font-semibold text-rose-900 break-words ${item.is_completed ? "line-through" : ""}`}
                        >
                          {item.title}
                        </h3>
                        {item.description && <p className="mt-1 text-sm text-rose-700 break-words">{item.description}</p>}
                        {item.gifted_by && (
                          <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                            <Gift className="mr-1 h-3 w-3" />
                            {t.wishlist.gifted}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        className="shrink-0 min-h-[40px] min-w-[40px] text-rose-600 hover:bg-rose-100 hover:text-rose-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* Partner's Dreams Tab */}
          {profile?.partner_id && (
            <TabsContent value="partner" className="space-y-3 sm:space-y-4">
              {partnerItems.length === 0 ? (
                <Card className="border-rose-200">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Heart className="mb-4 h-12 w-12 text-rose-300" />
                    <p className="text-rose-700">
                      {profile.partner
                        ? `${profile.partner.display_name} ${t.wishlist.partnerHasntShared}`
                        : t.wishlist.noPartnerDreams}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                partnerItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`border-rose-200 transition-all ${item.is_completed ? "opacity-60" : ""}`}
                  >
                    <CardContent className="flex items-start gap-2 sm:gap-4 p-4 sm:p-6">
                      {canMarkAsGifted(item) ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMarkAsGifted(item.id, !item.is_completed)}
                          className={`mt-1 shrink-0 min-h-[40px] min-w-[40px] ${
                            item.is_completed
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-rose-300 text-rose-600"
                          }`}
                          title={t.wishlist.markAsGifted}
                        >
                          <Gift className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div
                          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                            item.is_completed
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-rose-300 text-rose-300"
                          }`}
                        >
                          {item.is_completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Gift className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold text-rose-900 ${item.is_completed ? "line-through" : ""}`}>
                          {item.title}
                        </h3>
                        {item.description && <p className="mt-1 text-sm text-rose-700">{item.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.is_completed && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            <Gift className="mr-1 h-3 w-3" />
                            {t.wishlist.giftedByYou}
                          </Badge>
                        )}
                        {item.gifted_at && (
                          <span className="text-xs text-rose-600">
                            {t.wishlist.giftedOn} {new Date(item.gifted_at).toLocaleDateString()}
                          </span>
                        )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          {/* Joint Wishlist Tab */}
          {profile?.partner_id && (
            <TabsContent value="joint" className="space-y-3 sm:space-y-4">
              {jointItems.length === 0 ? (
                <Card className="border-rose-200">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="mb-4 h-12 w-12 text-rose-300" />
                    <p className="text-rose-700">{t.wishlist.noJointDreams}</p>
                  </CardContent>
                </Card>
              ) : (
                jointItems.map((item) => {
                  const isMyItem = item.user_id === user.id
                  return (
                    <Card
                      key={item.id}
                      className={`border-rose-200 transition-all ${item.is_completed ? "opacity-60" : ""}`}
                    >
                      <CardContent className="flex items-start gap-2 sm:gap-4 p-4 sm:p-6">
                        {isMyItem ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleComplete(item.id, item.is_completed)}
                            className={`mt-1 shrink-0 min-h-[40px] min-w-[40px] ${
                              item.is_completed
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-rose-300 text-rose-600"
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : canMarkAsGifted(item) ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMarkAsGifted(item.id, !item.is_completed)}
                            className={`mt-1 shrink-0 min-h-[40px] min-w-[40px] ${
                              item.is_completed
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-rose-300 text-rose-600"
                            }`}
                            title={t.wishlist.markAsGifted}
                          >
                            <Gift className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div
                            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                              item.is_completed
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-rose-300 text-rose-300"
                            }`}
                          >
                            {item.is_completed ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`text-lg font-semibold text-rose-900 ${item.is_completed ? "line-through" : ""}`}
                            >
                              {item.title}
                            </h3>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Users className="mr-1 h-3 w-3" />
                              Conjunto
                            </Badge>
                          </div>
                          {item.description && <p className="mt-1 text-sm text-rose-700">{item.description}</p>}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.gifted_by && (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                                <Gift className="mr-1 h-3 w-3" />
                                {t.wishlist.gifted}
                              </Badge>
                            )}
                            {item.gifted_at && (
                              <span className="text-xs text-rose-600">
                                {t.wishlist.giftedOn} {new Date(item.gifted_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isMyItem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            className="shrink-0 min-h-[40px] min-w-[40px] text-rose-600 hover:bg-rose-100 hover:text-rose-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

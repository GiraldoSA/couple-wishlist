import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import WishlistClient from "@/components/wishlist-client"

export default async function WishlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch profile with partner info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, partner:partner_id(id, display_name)")
    .eq("id", user.id)
    .single()

  // Fetch user's own wishlist items (including gifted info)
  const { data: myItems } = await supabase
    .from("wishlist_items")
    .select("*, gifted_by_user:gifted_by(id, email)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch partner's items if partner exists (all items, not just shared)
  let partnerItems = []
  let jointItems = []
  if (profile?.partner_id) {
    // Items del partner
    const { data: partnerData } = await supabase
      .from("wishlist_items")
      .select("*, gifted_by_user:gifted_by(id, email)")
      .eq("user_id", profile.partner_id)
      .order("created_at", { ascending: false })
    partnerItems = partnerData || []

    // Items conjuntos
    const { data: jointData } = await supabase
      .from("wishlist_items")
      .select("*, gifted_by_user:gifted_by(id, email)")
      .or(`user_id.eq.${user.id},user_id.eq.${profile.partner_id}`)
      .eq("is_joint", true)
      .order("created_at", { ascending: false })
    jointItems = jointData || []
  }

  // Fetch invitations
  const userEmail = user.email
  const { data: sentInvitations } = await supabase
    .from("partner_invitations")
    .select("*")
    .eq("inviter_id", user.id)
    .order("created_at", { ascending: false })

  const { data: receivedInvitations } = userEmail
    ? await supabase
        .from("partner_invitations")
        .select("*, inviter:inviter_id(id, display_name)")
        .eq("invitee_email", userEmail)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: null }

  return (
    <WishlistClient
      user={user}
      profile={profile}
      myItems={myItems || []}
      partnerItems={partnerItems}
      jointItems={jointItems}
      sentInvitations={sentInvitations || []}
      receivedInvitations={receivedInvitations || []}
    />
  )
}

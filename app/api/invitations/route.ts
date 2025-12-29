import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Obtener invitaciones del usuario
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Obtener invitaciones enviadas
  const { data: sentInvitations } = await supabase
    .from("partner_invitations")
    .select("*")
    .eq("inviter_id", user.id)
    .order("created_at", { ascending: false })

  // Obtener invitaciones recibidas
  const { data: userData } = await supabase.auth.getUser()
  const userEmail = userData.data.user?.email

  const { data: receivedInvitations } = userEmail
    ? await supabase
        .from("partner_invitations")
        .select("*")
        .eq("invitee_email", userEmail)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: null }

  return NextResponse.json({
    sent: sentInvitations || [],
    received: receivedInvitations || [],
  })
}

// POST: Enviar nueva invitación
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  // Verificar que el usuario no tenga ya una pareja
  const { data: profile } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", user.id)
    .single()

  if (profile?.partner_id) {
    return NextResponse.json({ error: "Ya tienes una pareja vinculada" }, { status: 400 })
  }

  // Verificar que no haya una invitación pendiente
  const { data: existingInvitation } = await supabase
    .from("partner_invitations")
    .select("*")
    .eq("inviter_id", user.id)
    .eq("invitee_email", email)
    .eq("status", "pending")
    .single()

  if (existingInvitation) {
    return NextResponse.json({ error: "Ya existe una invitación pendiente para este email" }, { status: 400 })
  }

  // Crear la invitación
  const { data, error } = await supabase
    .from("partner_invitations")
    .insert({
      inviter_id: user.id,
      invitee_email: email,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invitation: data }, { status: 201 })
}

// PATCH: Aceptar o rechazar invitación
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { invitationId, action } = await request.json()

  if (!invitationId || !action) {
    return NextResponse.json({ error: "ID de invitación y acción requeridos" }, { status: 400 })
  }

  // Obtener la invitación
  const { data: invitation, error: fetchError } = await supabase
    .from("partner_invitations")
    .select("*")
    .eq("id", invitationId)
    .single()

  if (fetchError || !invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  }

  // Verificar que el usuario es el destinatario
  const userEmail = user.email
  if (invitation.invitee_email !== userEmail) {
    return NextResponse.json({ error: "No tienes permiso para esta acción" }, { status: 403 })
  }

  if (action === "accept") {
    // Usar la función de la base de datos para aceptar
    const { error: acceptError } = await supabase.rpc("accept_partner_invitation", {
      invitation_id: invitationId,
    })

    if (acceptError) {
      return NextResponse.json({ error: acceptError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Invitación aceptada" }, { status: 200 })
  } else if (action === "reject") {
    const { error: rejectError } = await supabase
      .from("partner_invitations")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", invitationId)

    if (rejectError) {
      return NextResponse.json({ error: rejectError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Invitación rechazada" }, { status: 200 })
  } else {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  }
}

// DELETE: Cancelar invitación enviada
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const invitationId = searchParams.get("id")

  if (!invitationId) {
    return NextResponse.json({ error: "ID de invitación requerido" }, { status: 400 })
  }

  // Verificar que la invitación pertenece al usuario
  const { data: invitation } = await supabase
    .from("partner_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("inviter_id", user.id)
    .single()

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  }

  const { error } = await supabase
    .from("partner_invitations")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", invitationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Invitación cancelada" }, { status: 200 })
}


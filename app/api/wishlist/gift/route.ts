import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH: Marcar item como regalado por el partner
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { itemId, isGifted } = await request.json()

  if (!itemId) {
    return NextResponse.json({ error: "ID de item requerido" }, { status: 400 })
  }

  // Verificar que el item existe y pertenece al partner del usuario
  const { data: item, error: itemError } = await supabase
    .from("wishlist_items")
    .select("*, user:user_id(id)")
    .eq("id", itemId)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
  }

  // Verificar que el usuario es el partner del dueño del item
  const { data: profile } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", user.id)
    .single()

  if (!profile || profile.partner_id !== item.user_id) {
    return NextResponse.json({ error: "No tienes permiso para esta acción" }, { status: 403 })
  }

  // Actualizar el item
  const updateData: any = {
    is_completed: isGifted,
  }

  if (isGifted) {
    updateData.gifted_by = user.id
    updateData.gifted_at = new Date().toISOString()
  } else {
    updateData.gifted_by = null
    updateData.gifted_at = null
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from("wishlist_items")
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ item: updatedItem }, { status: 200 })
}


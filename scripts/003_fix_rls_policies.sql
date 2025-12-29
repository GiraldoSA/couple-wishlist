-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS
-- Problema: Las políticas intentan acceder a auth.users directamente
-- Solución: Usar funciones helper o consultas que funcionen con RLS
-- ============================================

-- Primero, necesitamos una función helper para obtener el email del usuario actual
-- Esta función se ejecuta con security definer y tiene acceso a auth.users
create or replace function public.get_current_user_email()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  select email into user_email
  from auth.users
  where id = auth.uid()
  limit 1;
  
  return user_email;
end;
$$;

-- Actualizar políticas RLS para usar la función helper
drop policy if exists "partner_invitations_select_own" on public.partner_invitations;
drop policy if exists "partner_invitations_update_own_or_invitee" on public.partner_invitations;

-- Política de SELECT actualizada
create policy "partner_invitations_select_own"
  on public.partner_invitations for select
  using (
    auth.uid() = inviter_id 
    or invitee_email = public.get_current_user_email()
  );

-- Política de UPDATE actualizada
create policy "partner_invitations_update_own_or_invitee"
  on public.partner_invitations for update
  using (
    auth.uid() = inviter_id 
    or invitee_email = public.get_current_user_email()
  );

-- También actualizar la función get_user_id_by_email para usar security definer correctamente
-- y asegurar que tenga los permisos necesarios
drop function if exists public.get_user_id_by_email(text);

create or replace function public.get_user_id_by_email(user_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  user_uuid uuid;
begin
  -- Solo permite buscar si el usuario actual está autenticado
  if auth.uid() is null then
    return null;
  end if;
  
  -- Buscar el usuario por email
  select id into user_uuid
  from auth.users
  where email = user_email
  limit 1;
  
  return user_uuid;
end;
$$;

-- Corregir la función accept_partner_invitation para usar get_current_user_email
drop function if exists public.accept_partner_invitation(uuid);

create or replace function public.accept_partner_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter_uuid uuid;
  invitee_uuid uuid;
  invitee_email text;
  current_user_email text;
begin
  -- Obtener el email del usuario actual usando la función helper
  current_user_email := public.get_current_user_email();
  
  if current_user_email is null then
    raise exception 'Usuario no autenticado';
  end if;
  
  -- Obtener información de la invitación
  select inviter_id, invitee_email into inviter_uuid, invitee_email
  from public.partner_invitations
  where id = invitation_id
    and status = 'pending'
    and invitee_email = current_user_email;
  
  if inviter_uuid is null then
    raise exception 'Invitación no encontrada o ya procesada';
  end if;
  
  invitee_uuid := auth.uid();
  
  -- Verificar que no estén ya vinculados
  if exists (
    select 1 from public.profiles 
    where id = invitee_uuid and partner_id is not null
  ) then
    raise exception 'Ya tienes una pareja vinculada';
  end if;
  
  if exists (
    select 1 from public.profiles 
    where id = inviter_uuid and partner_id is not null
  ) then
    raise exception 'El usuario que te invitó ya tiene una pareja';
  end if;
  
  -- Vincular parejas mutuamente
  perform public.link_partners(inviter_uuid, invitee_uuid);
  
  -- Actualizar estado de la invitación
  update public.partner_invitations
  set status = 'accepted', updated_at = now()
  where id = invitation_id;
  
  -- Rechazar otras invitaciones pendientes del inviter
  update public.partner_invitations
  set status = 'cancelled', updated_at = now()
  where inviter_id = inviter_uuid 
    and status = 'pending'
    and id != invitation_id;
  
  -- Rechazar otras invitaciones pendientes del invitee usando la función helper
  update public.partner_invitations
  set status = 'cancelled', updated_at = now()
  where invitee_email = current_user_email
    and status = 'pending'
    and id != invitation_id;
end;
$$;


-- ============================================
-- CORRECCIÓN: Error de ambigüedad en accept_partner_invitation
-- y asegurar que las notificaciones se muestren correctamente
-- ============================================

-- Asegurar que la función create_invitation_accepted_notification existe
create or replace function public.create_invitation_accepted_notification(
  target_user_id uuid,
  partner_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, message)
  values (
    target_user_id,
    'invitation_accepted',
    'Invitación Aceptada',
    partner_name || ' ha aceptado tu invitación. ¡Ya están conectados!'
  );
end;
$$;

-- Corregir la función accept_partner_invitation para eliminar ambigüedad
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
  invitee_email_val text;
  current_user_email text;
  inviter_name text;
  invitee_name text;
begin
  -- Obtener el email del usuario actual usando la función helper
  current_user_email := public.get_current_user_email();
  
  if current_user_email is null then
    raise exception 'Usuario no autenticado';
  end if;
  
  -- Obtener información de la invitación con nombres
  select 
    pi.inviter_id, 
    pi.invitee_email,
    p1.display_name as inviter_name,
    p2.display_name as invitee_name
  into inviter_uuid, invitee_email_val, inviter_name, invitee_name
  from public.partner_invitations pi
  left join public.profiles p1 on p1.id = pi.inviter_id
  left join public.profiles p2 on p2.id = auth.uid()
  where pi.id = invitation_id
    and pi.status = 'pending'
    and pi.invitee_email = current_user_email;
  
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
  
  -- Crear notificación para el inviter
  perform public.create_invitation_accepted_notification(
    inviter_uuid,
    coalesce(invitee_name, 'Tu pareja')
  );
  
  -- Rechazar otras invitaciones pendientes del inviter
  update public.partner_invitations
  set status = 'cancelled', updated_at = now()
  where inviter_id = inviter_uuid 
    and status = 'pending'
    and id != invitation_id;
  
  -- Rechazar otras invitaciones pendientes del invitee usando la variable
  update public.partner_invitations
  set status = 'cancelled', updated_at = now()
  where invitee_email = current_user_email
    and status = 'pending'
    and id != invitation_id;
end;
$$;


-- ============================================
-- SISTEMA DE NOTIFICACIONES
-- Tabla para almacenar notificaciones de usuarios
-- ============================================

-- Crear tabla de notificaciones
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('invitation_received', 'invitation_accepted', 'item_gifted', 'partner_linked')),
  title text not null,
  message text not null,
  related_id uuid, -- ID relacionado (ej: invitation_id, item_id, etc.)
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Índices para mejorar rendimiento
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- Habilitar RLS
alter table public.notifications enable row level security;

-- Políticas RLS para notificaciones
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;

-- Usuarios solo pueden ver sus propias notificaciones
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Usuarios solo pueden insertar notificaciones para sí mismos (aunque esto se hace desde funciones)
create policy "notifications_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id);

-- Usuarios solo pueden actualizar sus propias notificaciones (marcar como leídas)
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Función para crear notificación de invitación recibida
create or replace function public.create_invitation_notification(
  target_user_id uuid,
  invitation_id uuid,
  inviter_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, message, related_id)
  values (
    target_user_id,
    'invitation_received',
    'Nueva Invitación',
    inviter_name || ' te ha invitado a ser pareja',
    invitation_id
  );
end;
$$;

-- Función para crear notificación buscando usuario por email
create or replace function public.create_invitation_notification_by_email(
  invitee_email text,
  invitation_id uuid,
  inviter_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  -- Buscar usuario por email
  select id into target_user_id
  from auth.users
  where email = invitee_email
  limit 1;
  
  -- Si existe el usuario, crear la notificación
  if target_user_id is not null then
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      target_user_id,
      'invitation_received',
      'Nueva Invitación',
      inviter_name || ' te ha invitado a ser pareja',
      invitation_id
    );
  end if;
end;
$$;

-- Función para crear notificación cuando se acepta una invitación
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

-- Trigger para crear notificación cuando se acepta una invitación
-- Actualizar la función accept_partner_invitation para crear notificaciones
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
  into inviter_uuid, invitee_email, inviter_name, invitee_name
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
  
  -- Rechazar otras invitaciones pendientes del invitee usando la función helper
  update public.partner_invitations
  set status = 'cancelled', updated_at = now()
  where invitee_email = current_user_email
    and status = 'pending'
    and id != invitation_id;
end;
$$;


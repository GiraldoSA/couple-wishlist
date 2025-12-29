-- ============================================
-- MEJORAS AL SISTEMA DE WISHLIST PARA PAREJAS
-- ============================================

-- 1. Agregar campos de regalos y lista conjunta a wishlist_items
alter table public.wishlist_items
  add column if not exists gifted_by uuid references auth.users(id) on delete set null,
  add column if not exists gifted_at timestamp with time zone,
  add column if not exists is_joint boolean default false;

-- 2. Crear tabla de invitaciones de pareja
create table if not exists public.partner_invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Índice único parcial para evitar invitaciones duplicadas pendientes
create unique index if not exists idx_partner_invitations_unique_pending
  on public.partner_invitations(inviter_id, invitee_email)
  where status = 'pending';

alter table public.partner_invitations enable row level security;

-- Políticas RLS para invitaciones (eliminar si existen antes de crear)
drop policy if exists "partner_invitations_select_own" on public.partner_invitations;
drop policy if exists "partner_invitations_insert_own" on public.partner_invitations;
drop policy if exists "partner_invitations_update_own_or_invitee" on public.partner_invitations;

create policy "partner_invitations_select_own"
  on public.partner_invitations for select
  using (
    auth.uid() = inviter_id 
    or invitee_email = (select email from auth.users where id = auth.uid())
  );

create policy "partner_invitations_insert_own"
  on public.partner_invitations for insert
  with check (auth.uid() = inviter_id);

create policy "partner_invitations_update_own_or_invitee"
  on public.partner_invitations for update
  using (
    auth.uid() = inviter_id 
    or invitee_email = (select email from auth.users where id = auth.uid())
  );

-- 3. Función para buscar usuario por email (sin admin)
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
  
  select id into user_uuid
  from auth.users
  where email = user_email
  limit 1;
  
  return user_uuid;
end;
$$;

-- 4. Función para vincular parejas mutuamente
create or replace function public.link_partners(user1_id uuid, user2_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Vincular user1 -> user2
  update public.profiles
  set partner_id = user2_id
  where id = user1_id;
  
  -- Vincular user2 -> user1
  update public.profiles
  set partner_id = user1_id
  where id = user2_id;
end;
$$;

-- 5. Función para aceptar invitación y vincular parejas
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
begin
  -- Obtener información de la invitación
  select inviter_id, invitee_email into inviter_uuid, invitee_email
  from public.partner_invitations
  where id = invitation_id
    and status = 'pending'
    and invitee_email = (select email from auth.users where id = auth.uid());
  
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
  
  -- Rechazar otras invitaciones pendientes del invitee
  update public.partner_invitations
  set status = 'cancelled', updated_at = now()
  where invitee_email = (select email from auth.users where id = invitee_uuid)
    and status = 'pending'
    and id != invitation_id;
end;
$$;

-- 6. Actualizar políticas RLS para wishlist_items
-- Eliminar políticas antiguas si existen
drop policy if exists "wishlist_items_select_partner_shared" on public.wishlist_items;
drop policy if exists "wishlist_items_select_partner" on public.wishlist_items;
drop policy if exists "wishlist_items_update_partner_gift" on public.wishlist_items;
drop policy if exists "wishlist_items_update_partner_complete" on public.wishlist_items;

-- Permitir que el partner vea todos los items (no solo compartidos)
create policy "wishlist_items_select_partner"
  on public.wishlist_items for select
  using (
    auth.uid() = user_id
    or (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.partner_id = wishlist_items.user_id
      )
    )
  );

-- Permitir que el partner actualice items para marcar como regalado
-- Esta política permite al partner actualizar campos de regalo
create policy "wishlist_items_update_partner_gift"
  on public.wishlist_items for update
  using (
    auth.uid() = user_id
    or (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.partner_id = wishlist_items.user_id
      )
    )
  )
  with check (
    auth.uid() = user_id
    or (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.partner_id = wishlist_items.user_id
      )
    )
  );

-- 7. Función para obtener items conjuntos
create or replace function public.get_joint_wishlist_items(partner1_id uuid, partner2_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  is_completed boolean,
  gifted_by uuid,
  gifted_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    wi.id,
    wi.title,
    wi.description,
    wi.is_completed,
    wi.gifted_by,
    wi.gifted_at,
    wi.user_id as created_by,
    wi.created_at
  from public.wishlist_items wi
  where wi.is_joint = true
    and (
      (wi.user_id = partner1_id or wi.user_id = partner2_id)
      or (wi.user_id = partner1_id and wi.is_shared = true)
      or (wi.user_id = partner2_id and wi.is_shared = true)
    )
  order by wi.created_at desc;
end;
$$;

-- 8. Trigger para actualizar updated_at en partner_invitations
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_partner_invitations_updated_at on public.partner_invitations;
create trigger update_partner_invitations_updated_at
  before update on public.partner_invitations
  for each row
  execute function public.update_updated_at_column();

-- 9. Índices para mejorar rendimiento
create index if not exists idx_wishlist_items_user_id on public.wishlist_items(user_id);
create index if not exists idx_wishlist_items_is_joint on public.wishlist_items(is_joint);
create index if not exists idx_wishlist_items_gifted_by on public.wishlist_items(gifted_by);
create index if not exists idx_partner_invitations_inviter on public.partner_invitations(inviter_id);
create index if not exists idx_partner_invitations_email on public.partner_invitations(invitee_email);
create index if not exists idx_partner_invitations_status on public.partner_invitations(status);
create index if not exists idx_profiles_partner_id on public.profiles(partner_id);


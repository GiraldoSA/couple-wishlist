-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  partner_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Eliminar políticas si existen antes de crearlas (para permitir re-ejecutar el script)
drop policy if exists "profiles_select_own_or_partner" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own_or_partner"
  on public.profiles for select
  using (auth.uid() = id or auth.uid() = partner_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create wishlist_items table
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  is_shared boolean default false,
  is_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.wishlist_items enable row level security;

-- Eliminar políticas si existen antes de crearlas (para permitir re-ejecutar el script)
drop policy if exists "wishlist_items_select_own" on public.wishlist_items;
drop policy if exists "wishlist_items_select_partner_shared" on public.wishlist_items;
drop policy if exists "wishlist_items_insert_own" on public.wishlist_items;
drop policy if exists "wishlist_items_update_own" on public.wishlist_items;
drop policy if exists "wishlist_items_delete_own" on public.wishlist_items;

-- Users can view their own items
create policy "wishlist_items_select_own"
  on public.wishlist_items for select
  using (auth.uid() = user_id);

-- Users can view their partner's shared items
create policy "wishlist_items_select_partner_shared"
  on public.wishlist_items for select
  using (
    is_shared = true
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.partner_id = wishlist_items.user_id
    )
  );

create policy "wishlist_items_insert_own"
  on public.wishlist_items for insert
  with check (auth.uid() = user_id);

create policy "wishlist_items_update_own"
  on public.wishlist_items for update
  using (auth.uid() = user_id);

create policy "wishlist_items_delete_own"
  on public.wishlist_items for delete
  using (auth.uid() = user_id);

-- Create function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

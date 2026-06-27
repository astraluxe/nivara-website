-- Standalone Mesh passes: granted server-side (mesh-verify) only after a verified payment.
create table if not exists public.mesh_passes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  devices             int  not null check (devices > 0 and devices <= 200),
  expires_at          timestamptz not null,
  amount              int  not null,                 -- rupees actually charged
  razorpay_payment_id text,
  razorpay_order_id   text,
  created_at          timestamptz not null default now()
);

create index if not exists mesh_passes_user_active_idx
  on public.mesh_passes (user_id, expires_at desc);

alter table public.mesh_passes enable row level security;

-- A user can read their own passes (the exe reads these to set the device limit).
drop policy if exists "mesh_passes read own" on public.mesh_passes;
create policy "mesh_passes read own"
  on public.mesh_passes for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for normal users: passes are only ever written
-- by the mesh-verify Edge Function using the service-role key (which bypasses RLS).

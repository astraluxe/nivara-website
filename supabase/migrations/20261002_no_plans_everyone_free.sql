-- adris.tech is free (2 Oct 2026): there are no plans. Nobody — free, paid, admin or head — holds one.

-- 1. The owner keeps head access, but is no longer bumped onto a paid plan.
create or replace function public.enforce_head_admins()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if NEW.email = 'amoghm2005@gmail.com' then
    NEW.admin_level := 'head';
    NEW.is_blocked := false;
  end if;
  return NEW;
end;
$function$;

-- 2. Every row is on the free plan, always. BEFORE triggers fire in name order, so "zz_" runs last
--    and wins over anything earlier — the webhook, the admin panel, pilot grants, promos.
create or replace function public.force_free_plan()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  NEW.plan := 'free';
  NEW.subscription_status := 'free';
  NEW.custom_plan_start := null;
  NEW.custom_plan_expires := null;
  NEW.grace_period_end := null;
  return NEW;
end;
$function$;

drop trigger if exists zz_force_free_plan on public.users;
create trigger zz_force_free_plan
  before insert or update on public.users
  for each row execute function public.force_free_plan();

-- 3. Everyone who is on a plan today comes off it.
update public.users set plan = 'free' where true;

-- 4. Outstanding pilot grants can never apply.
update public.pilot_grants set revoked_at = now() where claimed_at is null and revoked_at is null;

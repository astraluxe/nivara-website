-- Payment details never reached the admin, and an affiliate could set their own payout.
--
-- 1. The affiliate dashboard writes upi_id and the bank fields to affiliate_applications; the head
--    dashboard reads them from affiliates. Nothing copied between the two, so an affiliate could
--    submit their details, see them saved, and the admin would show "No details" for ever — and the
--    Pay button, gated on hasBank, would never appear. Money owed could not be sent.
--
-- 2. The policy "Affiliate links own user_id" guards the ROW, not the columns, so an affiliate could
--    update tier, active_referrals, total_earned_paise or unpaid_paise on themselves and the admin
--    would offer to pay whatever they typed. RLS cannot say "only this column", so a trigger reverts
--    the rest — the same shape as protect_billing_columns on users.
--
-- Verified: writing details to affiliate_applications alone populates affiliates; and an update as
-- the affiliate setting tier=elite with a large unpaid balance comes back unchanged.

create or replace function public.sync_affiliate_payment_details()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.affiliates a
     set upi_id              = NEW.upi_id,
         bank_account_number = NEW.bank_account_number,
         bank_ifsc           = NEW.bank_ifsc
   where a.application_id = NEW.id or lower(a.email) = lower(NEW.email);
  return NEW;
end; $$;

drop trigger if exists trg_sync_affiliate_payment_details on public.affiliate_applications;
create trigger trg_sync_affiliate_payment_details
  after update of upi_id, bank_account_number, bank_ifsc, bank_account_name, bank_name
  on public.affiliate_applications
  for each row execute function public.sync_affiliate_payment_details();

create or replace function public.protect_affiliate_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') = 'service_role'
     or current_user in ('service_role', 'supabase_admin', 'postgres') then
    return NEW;
  end if;
  if exists (select 1 from public.users u
              where u.id = (select auth.uid()) and u.admin_level in ('head','admin')) then
    return NEW;
  end if;
  NEW.email              := OLD.email;
  NEW.ref_code           := OLD.ref_code;
  NEW.tier               := OLD.tier;
  NEW.status             := OLD.status;
  NEW.active_referrals   := OLD.active_referrals;
  NEW.total_earned_paise := OLD.total_earned_paise;
  NEW.unpaid_paise       := OLD.unpaid_paise;
  NEW.application_id     := OLD.application_id;
  NEW.offer_discount_pct := OLD.offer_discount_pct;
  NEW.offer_text         := OLD.offer_text;
  return NEW;
end; $$;

drop trigger if exists trg_protect_affiliate_columns on public.affiliates;
create trigger trg_protect_affiliate_columns
  before update on public.affiliates
  for each row execute function public.protect_affiliate_columns();

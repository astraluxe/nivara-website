-- adris.tech is free (2 Oct 2026). The one thing left to ask for is a custom build — a custom adris
-- or an agentic AI office — requested through the contact form (/contact → partner.html), which
-- writes partner_requests. Without this the new type would be rejected by the CHECK and, because the
-- form shows success even on failure, every such request would be lost silently.
alter table public.partner_requests drop constraint partner_requests_partnership_type_check;
alter table public.partner_requests add constraint partner_requests_partnership_type_check
  check (partnership_type = any (array['mcp_showcase','service_exchange','business_proposal','other','custom_build']));

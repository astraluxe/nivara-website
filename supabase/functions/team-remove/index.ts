import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Removing someone from a workspace — properly.
//
// The dashboard used to delete the team_members row straight from the browser. That half works and
// is worse than not working: the membership disappears from the admin's list, and the person keeps
// plan='business' and their team_id for good. They are not in the workspace, and they still hold a
// paid plan nobody is paying for. It cannot be fixed client-side either — protect_billing_columns
// reverts any attempt by a browser to change another user's billing columns, so the delete was
// always going to be the only part that landed.
//
// This runs with the service role, so it can do both halves, and it refuses to do the dangerous
// version: a member who pays for their own subscription keeps everything they bought and is only
// unlinked from the team.
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);

  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: authErr } = await anon.auth.getUser(auth.slice(7));
  if (authErr || !user) return json({ error: "Session expired. Please sign in again." }, 401);

  let memberId = "", email = "", leaving = false;
  try {
    const b = await req.json();
    memberId = String(b?.member_id ?? "");
    email = String(b?.email ?? "").trim().toLowerCase();
    // A member removing THEMSELVES needs no ownership check — see below.
    leaving = b?.leave === true;
  } catch { return json({ error: "Invalid request body" }, 400); }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Resolve the membership row first, then decide whether this caller may remove it.
  let q = admin.from("team_members").select("id, team_id, user_id, email, role");
  q = memberId ? q.eq("id", memberId) : q.eq("email", email);
  const { data: member } = await q.maybeSingle();

  // Leaving a workspace when the membership row has already gone is still worth handling: the user
  // row can be left pointing at a team they are no longer in, which is exactly the orphan the old
  // client-side delete produced.
  if (!member) {
    if (leaving) {
      const { data: me } = await admin.from("users")
        .select("team_id, razorpay_subscription_id").eq("id", user.id).maybeSingle();
      if (me?.team_id) {
        await admin.from("users").update(
          me.razorpay_subscription_id
            ? { team_id: null }
            : { team_id: null, plan: "free", subscription_status: "free" },
        ).eq("id", user.id);
        return json({ ok: true, left: true, repaired_orphan: true });
      }
    }
    return json({ error: "That member is not in this workspace." }, 404);
  }

  const { data: team } = await admin.from("teams")
    .select("id, owner_id").eq("id", String(member.team_id)).maybeSingle();
  if (!team) return json({ error: "Workspace not found." }, 404);

  const callerIsOwner = String(team.owner_id) === user.id;
  const callerIsSelf = String(member.user_id ?? "") === user.id
    || String(member.email ?? "").toLowerCase() === String(user.email ?? "").toLowerCase();

  // Either the admin removes somebody, or somebody removes themselves. Nothing else.
  if (!callerIsOwner && !callerIsSelf) {
    return json({ error: "Only the workspace admin can remove members." }, 403);
  }
  // The owner's own seat cannot be removed — the workspace would be left with no admin and a live
  // subscription. Cancelling the plan is the way out, and that is a different button.
  if (String(team.owner_id) === String(member.user_id ?? "")) {
    return json({ error: "The workspace admin can't be removed. Cancel the Team plan instead." }, 400);
  }

  const { error: delErr } = await admin.from("team_members").delete().eq("id", member.id);
  if (delErr) {
    console.error("team-remove: delete failed", delErr);
    return json({ error: "Could not remove that member. Please try again." }, 500);
  }

  // Now the half that was always missing. Resolve the account by user_id, or by email for someone
  // who was invited but never accepted (no user_id on the row).
  let targetId = String(member.user_id ?? "");
  if (!targetId && member.email) {
    const { data: u } = await admin.from("users").select("id").ilike("email", String(member.email)).maybeSingle();
    targetId = String(u?.id ?? "");
  }

  let revoked = false;
  if (targetId) {
    const { data: target } = await admin.from("users")
      .select("razorpay_subscription_id, team_id").eq("id", targetId).maybeSingle();
    // Only unlink if they are actually in THIS team; never touch someone who has since moved on.
    if (target && String(target.team_id ?? "") === String(member.team_id)) {
      // Someone paying for their own plan keeps it. Taking that away because a team dropped them
      // would be removing something they bought with their own money.
      const patch = target.razorpay_subscription_id
        ? { team_id: null }
        : { team_id: null, plan: "free", subscription_status: "free" };
      const { error: updErr } = await admin.from("users").update(patch).eq("id", targetId);
      if (updErr) {
        console.error("team-remove: user reset failed", updErr);
        // The seat IS free at this point, so report honestly rather than claiming total success.
        return json({
          error: "Removed from the workspace, but their plan could not be reset. Contact support.",
        }, 500);
      }
      revoked = !target.razorpay_subscription_id;
    }
  }

  console.log(`team-remove team=${member.team_id} member=${member.email} revoked=${revoked}`);
  return json({ ok: true, removed: member.email, plan_revoked: revoked, left: callerIsSelf && !callerIsOwner });
});

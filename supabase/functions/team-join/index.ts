import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// The plan a team member receives when they accept an invite.
//
// THIS USED TO SAY 'pro', AND 'pro' DOES NOT EXIST. Not in users_plan_check (which allows only
// free/solo/builder/business/custom, so the write was rejected outright), not in PLAN_LIMITS in
// get-session-key, and not in VALID_PLANS in the desktop app. The effect: accepting an invite
// marked the row active in team_members and then silently failed to update the user at all — no
// team_id, no plan. The member stayed on Free in the app, and the team owner had no way to tell.
//
// 'business' is the plan the owner bought and the one the website sells as "Team", so a member gets
// the same capability their team is paying for. The desktop app has no notion of teams; it reads
// users.plan and nothing else, which is exactly why this value has to be a real one.
const TEAM_MEMBER_PLAN = 'business';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url   = new URL(req.url);
  const token = url.searchParams.get('token');
  const authH = req.headers.get('Authorization');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing invite token' }), { status: 400, headers: CORS });
  }

  // Decode token
  let payload: { team_id: string; email: string; exp: number };
  try {
    payload = JSON.parse(atob(decodeURIComponent(token)));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: CORS });
  }

  if (Date.now() > payload.exp) {
    return new Response(JSON.stringify({ error: 'Invite link expired (48h limit)' }), { status: 410, headers: CORS });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify invite exists
  const { data: member } = await admin
    .from('team_members')
    .select('id, status, team_id')
    .eq('invite_token', token)
    .eq('email', payload.email)
    .single();

  if (!member) {
    return new Response(JSON.stringify({ error: 'Invite not found or already used' }), { status: 404, headers: CORS });
  }
  if (member.status === 'active') {
    return new Response(JSON.stringify({ ok: true, message: 'Already a member' }), { headers: CORS });
  }

  // If user JWT is provided, activate the membership
  if (authH?.startsWith('Bearer ')) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    const { data: { user } } = await supabase.auth.getUser(authH.slice(7));
    if (user) {
      // Grant the plan FIRST. If this fails there is no point marking the invite used: the member
      // would be recorded as active while their account still sat on Free, which is precisely the
      // silent half-join the old 'pro' value produced.
      const { error: planErr } = await admin.from('users').update({
        team_id: payload.team_id,
        plan: TEAM_MEMBER_PLAN,
        subscription_status: 'active',
      }).eq('id', user.id);

      if (planErr) {
        console.error(`JOIN FAILED user=${user.id} team=${payload.team_id}`, planErr);
        return new Response(JSON.stringify({
          error: 'Could not add you to the team. Nothing has changed — please tell the team owner.',
        }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      await admin.from('team_members').update({
        user_id: user.id,
        status: 'active',
        joined_at: new Date().toISOString(),
        invite_token: null,
      }).eq('id', member.id);

      console.log(`User ${user.id} joined team ${payload.team_id} on ${TEAM_MEMBER_PLAN}`);
      return new Response(JSON.stringify({ ok: true, plan: TEAM_MEMBER_PLAN }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
  }

  // No auth yet — return team info for the join page to show
  const { data: team } = await admin.from('teams').select('name').eq('id', payload.team_id).single();
  return new Response(JSON.stringify({
    ok: false,
    needs_auth: true,
    team_name: team?.name ?? 'adris.tech Team',
    email: payload.email,
  }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { team_id, level_id, guess } = await req.json();
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Secure document download:
// 1) verifies user JWT
// 2) calls request_document_download RPC (checks access, tracks download)
// 3) mints a short-lived (60s) signed URL from the private 'documents' bucket
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "missing_auth" }, 401);
    }

    // user-scoped client to verify JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "invalid_token" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const documentId = body?.document_id;
    if (!documentId || typeof documentId !== "string") {
      return json({ error: "document_id_required" }, 400);
    }

    // Get storage path (RPC enforces auth.uid() server-side)
    const { data: rpcData, error: rpcErr } = await userClient.rpc("request_document_download", {
      _document_id: documentId,
    });
    if (rpcErr) {
      const msg = rpcErr.message || "rpc_error";
      const status = msg.includes("not_authenticated") ? 401
                   : msg.includes("not_found") ? 404
                   : msg.includes("not_available") ? 403
                   : 500;
      return json({ error: msg }, status);
    }
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!row?.storage_path) {
      return json({ error: "no_path_returned" }, 500);
    }

    // Mint signed URL with service role
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: signed, error: signErr } = await adminClient
      .storage.from("documents")
      .createSignedUrl(row.storage_path, 60);

    if (signErr || !signed?.signedUrl) {
      return json({ error: "signed_url_failed", details: signErr?.message }, 500);
    }

    return json({ url: signed.signedUrl });
  } catch (e) {
    console.error("document-download error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { handleAuthHandoff } from "@/app/actions/auth/handoff";

export default function AuthHandoff() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState("Autentikoidaan...");

  useEffect(() => {
    const handleSession = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            router.replace("/app/dashboard");
            return;
          }
          setStatus("Virhe: Ei kirjautumistietoja.");
          return;
        }

        const result = await handleAuthHandoff(accessToken, refreshToken);

        if (result?.error) {
          console.error("Handoff error:", result.error);
          setStatus("Kirjautuminen epäonnistui.");
        }
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }
        console.error("Handoff error:", err);
        setStatus("Kirjautuminen epäonnistui.");
      }
    };

    handleSession();
  }, [router, supabase.auth]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

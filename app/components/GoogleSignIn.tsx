"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignIn() {
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
    const inFlight = useRef(false);
    async function signInWithGoogle() {
        if (inFlight.current) return;
        inFlight.current = true;
        setWorking(true);
        setError(null);
        try {
            const { error } = await createClient().auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
        } catch {
            setError("Sign-in could not start. Please try again in a moment.");
            inFlight.current = false;
            setWorking(false);
        }
    }
    return <>
        <button onClick={signInWithGoogle} disabled={working}>{working ? "Opening Google..." : "Sign in with Google"}</button>
        {error && <p role="alert">{error}</p>}
    </>;
}

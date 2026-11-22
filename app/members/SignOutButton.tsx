"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
    const router = useRouter();
    const inFlight = useRef(false);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    async function handleSignOut() {
        if (inFlight.current) return;
        inFlight.current = true;
        setWorking(true);
        setError(null);
        try {
            const { error } = await createClient().auth.signOut();
            if (error) throw error;
            router.push("/");
            router.refresh();
        } catch {
            setError("Could not sign out. Please try again.");
        } finally {
            inFlight.current = false;
            setWorking(false);
        }
    }
    return <div>
        <button onClick={handleSignOut} disabled={working}>{working ? "Signing out..." : "Sign out"}</button>
        {error && <p role="alert">{error}</p>}
    </div>;
}

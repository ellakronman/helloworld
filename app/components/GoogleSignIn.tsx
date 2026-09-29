"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleSignIn() {
    const signInWithGoogle = async () => {
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Error signing in:", error.message);
        }
    };

    return (
        <button onClick={signInWithGoogle}>
            Sign in with Google
        </button>
    );
}
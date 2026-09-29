import { createClient } from "@/lib/supabase/server";

export default async function AuthSuccessPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main>
                <h1>Not signed in</h1>
                <p>No Supabase user was found.</p>
            </main>
        );
    }

    return (
        <main>
            <h1>Login successful!</h1>
            <p>You are signed in as {user.email}</p>
        </main>
    );
}
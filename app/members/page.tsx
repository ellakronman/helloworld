import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default async function MembersPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // This makes the route protected.
    if (!user) {
        redirect("/");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

    return (
        <main>
            <h1>Members Area</h1>

            {profile?.avatar_url && (
                <img
                    src={profile.avatar_url}
                    alt="Profile"
                    width={120}
                    height={120}
                />
            )}

            <h2>
                Welcome, {profile?.first_name} {profile?.last_name}!
            </h2>

            <p>{user.email}</p>

            <hr/>

            <div style={{display: "flex", gap: "16px", alignItems: "center"}}>
                <a href="/profile">Edit profile</a>
                <SignOutButton/>
            </div>
        </main>
    );
}
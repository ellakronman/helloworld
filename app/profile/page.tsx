import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

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
            <h1>Your Profile</h1>
            <p>Signed in as {user.email}</p>

            <ProfileForm
                initialFirstName={profile?.first_name ?? ""}
                initialLastName={profile?.last_name ?? ""}
                initialAvatarUrl={profile?.avatar_url ?? ""}
            />
        </main>
    );
}
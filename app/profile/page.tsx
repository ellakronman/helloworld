import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import "./profile.css";
import ProfileForm from "./ProfileForm";
import SiteHeader from "@/app/components/SiteHeader";

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
        <>
            <SiteHeader />

            <main className="profilePage">
                <section className="profileIntro">
                    <p className="profileEyebrow">THE PERSON BEHIND THE PUNCHLINES / 001</p>

                    <h1>
                        FIGHTER
                        <br />
                        PROFILE<span className="profilePeriod">.</span>
                    </h1>

                    <div className="profileIntroBottom">
                        <p>
                            EVERY LEGEND NEEDS A NAME.
                            <br />
                            MAKE SURE YOURS IS RIGHT.
                        </p>

                        <span className="profileBadge">YOUR CORNER ↗</span>
                    </div>
                </section>

                <section className="profileContent">
                    <div className="profileSectionHeading">
                        <span>01 / YOUR DETAILS</span>
                        <span>EDIT YOUR CORNER</span>
                    </div>

                    <div className="profileDetails">
                        <div className="profileDetailsIntro">
                            <h2>THE FACE<br />BEHIND THE<br />CAPTIONS.</h2>
                            <p>Update your name and photo. Your next great caption deserves proper credit.</p>
                        </div>

                        <div className="profileFormPanel">
                            <p className="profileAccountLabel">SIGNED IN AS</p>
                            <p className="profileEmail">{user.email}</p>

                            <ProfileForm
                                initialFirstName={profile?.first_name ?? ""}
                                initialLastName={profile?.last_name ?? ""}
                                initialAvatarUrl={profile?.avatar_url ?? ""}
                            />
                        </div>
                    </div>
                </section>

                <footer className="profileFooter">
                    <span>CAPTION FIGHT CLUB / YOUR CORNER</span>
                    <a href="/arena">BACK TO THE FIGHTS →</a>
                </footer>
            </main>
        </>
    );
}
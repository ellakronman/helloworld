import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/app/components/SiteHeader";
import UploadForm from "./UploadForm";
import "./upload.css";

export default async function UploadPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    return (
        <>
            <SiteHeader />
            <main className="uploadPage">
            <header className="uploadHeader">
                <a href="/arena" className="backLink">
                    ← BACK TO THE FIGHTS
                </a>

                <span className="clubMark">CFC / ENTRY DESK</span>
            </header>

            <section className="uploadIntro">
                <p className="eyebrow">NEW CHALLENGER</p>

                <h1>
                    THROW A PHOTO
                    <br />
                    INTO THE RING.
                </h1>

                <p className="introCopy">
                    You bring the evidence.
                    <br />
                    We bring four questionable interpretations.
                </p>
            </section>

            <UploadForm />
        </main>
            </>
    );
}
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/members/SignOutButton";
import "./site-header.css";

export default async function SiteHeader() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <header className="siteHeader">
            <div className="siteHeaderInner">
                <Link href="/" className="siteLogo" aria-label="Caption Fight Club homepage">
                    CFC
                </Link>

                <nav className="siteNavigation" aria-label="Main navigation">
                    <Link href="/">Home</Link>
                    <Link href="/arena">Browse Captions</Link>

                    {user && (
                        <>
                            <Link href="/upload">Upload Photo</Link>
                            <Link href="/profile">Profile</Link>
                        </>
                    )}
                </nav>

                <div className="siteAccount">
                    {user ? (
                        <SignOutButton />
                    ) : (
                        <span className="guestLabel">Browsing as guest</span>
                    )}
                </div>
            </div>
        </header>
    );
}
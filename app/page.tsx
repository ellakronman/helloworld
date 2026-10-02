import { createClient } from "@/lib/supabase/server";
import GoogleSignIn from "./components/GoogleSignIn";
import SignOutButton from "./members/SignOutButton";
import "./home.css";

export default async function Home() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <main className="homePage">
            <header className="homeNav">
                <a href="/" className="homeMark">
                    CFC
                </a>

                <nav className="navLinks">
                    <a href="/arena">THE FIGHTS</a>

                    {user && <a href="/upload">ENTER A PHOTO</a>}

                    {user && <a href="/profile">PROFILE</a>}

                    {user && <a href="/members">A3 / MOVIES</a>}
                </nav>

                <div className="navAccount">
                    {user ? (
                        <>
                            <span>{user.email}</span>
                            <SignOutButton />
                        </>
                    ) : (
                        <span>VIEWING AS GUEST</span>
                    )}
                </div>
            </header>

            <section className="hero">
                <p className="heroEyebrow">WELCOME TO THE INTERNET'S LEAST NECESSARY SPORT</p>

                <h1>
                    CAPTION
                    <br />
                    FIGHT CLUB
                </h1>

                <div className="heroBottom">
                    <p className="heroDescription">
                        ONE PHOTO.
                        <br />
                        FOUR CAPTIONS.
                        <br />
                        ONE QUESTION:
                        <br />
                        WHICH ONE IS ACTUALLY FUNNY?
                    </p>

                    <div className="heroActions">
                        <a href="/arena" className="primaryAction">
                            ENTER THE ARENA →
                        </a>

                        {user ? (
                            <a href="/upload" className="secondaryAction">
                                THROW IN A PHOTO
                            </a>
                        ) : (
                            <div className="signInBlock">
                                <p>WANT TO FIGHT?</p>
                                <GoogleSignIn />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="rules">
                <p className="sectionLabel">HOW IT WORKS / 3 ROUNDS</p>

                <div className="ruleRow">
                    <article className="rule">
                        <span>01</span>
                        <h2>
                            THROW IN
                            <br />
                            A PHOTO.
                        </h2>
                        <p>
                            Upload the evidence. We&apos;ll figure out what&apos;s happening.
                        </p>
                    </article>

                    <article className="rule">
                        <span>02</span>
                        <h2>
                            FOUR ENTER
                            <br />
                            THE RING.
                        </h2>
                        <p>
                            Four competing captions are generated for every image.
                        </p>
                    </article>

                    <article className="rule">
                        <span>03</span>
                        <h2>
                            PICK YOUR
                            <br />
                            WINNER.
                        </h2>
                        <p>
                            Vote them up or down. The funniest caption earns the space.
                        </p>
                    </article>
                </div>
            </section>

            <footer className="homeFooter">
                <span>CAPTION FIGHT CLUB / 2026</span>

                <a href="/arena">SEE WHAT&apos;S FIGHTING →</a>
            </footer>
        </main>
    );
}
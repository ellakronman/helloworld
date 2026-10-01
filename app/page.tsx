import { createClient } from "@/lib/supabase/server";
import GoogleSignIn from "./components/GoogleSignIn";
import SignOutButton from "./members/SignOutButton";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Home() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // LOGGED OUT
    if (!user) {
        return (
            <main>
                <h1>My Movie List</h1>

                <p>Sign in to see the movies stored in Supabase.</p>

                <GoogleSignIn />
            </main>
        );
    }

    // LOGGED IN: now fetch the protected Supabase data
    const admin = createAdminClient();

    const { data: movies, error } = await admin
        .from("movies")
        .select("*");

    if (error) {
        console.error("Error fetching movies:", error);
    }

    return (
        <main>
            <h1>My Movie List</h1>

            <p>Signed in as {user.email}</p>

            {movies && movies.length > 0 ? (
                <ul>
                    {movies.map((movie) => (
                        <li key={movie.id}>
                            {movie.title} ({movie.year})
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No movies found.</p>
            )}

            <hr />

            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                }}
            >
                <a href="/profile">Profile</a>
                <SignOutButton />
            </div>
        </main>
    );
}
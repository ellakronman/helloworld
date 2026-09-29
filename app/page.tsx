"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GoogleSignIn from "./components/GoogleSignIn";

type Movie = {
    id: number;
    title: string;
    year: number;
};

export default function Home() {
    const [movies, setMovies] = useState<Movie[]>([]);

    useEffect(() => {
        const getMovies = async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("movies")
                .select("*");

            if (error) {
                console.error("Error fetching movies:", error);
                return;
            }

            setMovies(data ?? []);
        };

        getMovies();
    }, []);

    return (
        <main>
            <h1>My Movie List</h1>

            {movies.length > 0 ? (
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

            <h2>Account</h2>
            <GoogleSignIn />
        </main>
    );
}
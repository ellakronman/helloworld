"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Vote = 1 | -1;
type VoteButtonsProps = {
    captionId: string;
    userId: string | null;
    initialVote: Vote | null;
};

export default function VoteButtons({ captionId, userId, initialVote }: VoteButtonsProps) {
    const router = useRouter();
    const [currentVote, setCurrentVote] = useState<Vote | null>(initialVote);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestInFlight = useRef(false);

    async function vote(value: Vote) {
        if (!userId || requestInFlight.current) return;
        requestInFlight.current = true;
        setWorking(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || authData.user?.id !== userId) {
                throw new Error("Your sign-in session has changed. Refresh the page and sign in again.");
            }

            if (currentVote === value) {
                const { data, error: deleteError } = await supabase
                    .from("votes")
                    .delete()
                    .eq("user_id", userId)
                    .eq("caption_id", captionId)
                    .select("user_id, caption_id");
                if (deleteError) throw deleteError;
                if (data?.length !== 1) {
                    throw new Error(`Expected to delete one vote, but deleted ${data?.length ?? 0}. Refresh and try again.`);
                }
                setCurrentVote(null);
            } else if (currentVote === null) {
                const { data, error: insertError } = await supabase
                    .from("votes")
                    .insert({ user_id: userId, caption_id: captionId, value })
                    .select("user_id, caption_id, value");
                if (insertError) throw insertError;
                if (data?.length !== 1 || Number(data[0].value) !== value) {
                    throw new Error("The new vote could not be confirmed. Refresh the page.");
                }
                setCurrentVote(value);
            } else {
                const { data, error: updateError } = await supabase
                    .from("votes")
                    .update({ value })
                    .eq("user_id", userId)
                    .eq("caption_id", captionId)
                    .select("user_id, caption_id, value");
                if (updateError) throw updateError;
                if (data?.length !== 1 || Number(data[0].value) !== value) {
                    throw new Error(`Expected to update one vote, but updated ${data?.length ?? 0}. Refresh and try again.`);
                }
                setCurrentVote(value);
            }
        } catch (err) {
            console.error("Vote error:", err);
            setError(err instanceof Error ? err.message : "Failed to save vote. Refresh and try again.");
        } finally {
            // Re-fetch the authoritative score and selected vote even after an error.
            router.refresh();
            requestInFlight.current = false;
            setWorking(false);
        }
    }

    if (!userId) return <p className="signInMessage">Sign in to vote</p>;

    return (
        <>
            <div className="voteButtons">
                <button type="button" aria-pressed={currentVote === 1}
                    className={`voteButton ${currentVote === 1 ? "selected" : ""}`}
                    onClick={() => vote(1)} disabled={working}>
                    FUNNIER ↑
                </button>
                <button type="button" aria-pressed={currentVote === -1}
                    className={`voteButton ${currentVote === -1 ? "selected" : ""}`}
                    onClick={() => vote(-1)} disabled={working}>
                    NOT IT ↓
                </button>
            </div>
            {error && <p className="voteError" role="alert">{error}</p>}
        </>
    );
}

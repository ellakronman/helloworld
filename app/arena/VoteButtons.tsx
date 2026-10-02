"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type VoteButtonsProps = {
    captionId: string;
    userId: string | null;
    initialVote: number | null;
};

export default function VoteButtons({
                                        captionId,
                                        userId,
                                        initialVote,
                                    }: VoteButtonsProps) {
    const router = useRouter();
    const supabase = createClient();

    const [currentVote, setCurrentVote] = useState<number | null>(
        initialVote
    );
    const [working, setWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function vote(value: 1 | -1) {
        if (!userId) return;

        setWorking(true);
        setError(null);

        try {
            if (currentVote === null) {
                const { error: insertError } = await supabase
                    .from("votes")
                    .insert({
                        user_id: userId,
                        caption_id: captionId,
                        value,
                    });

                if (insertError) throw insertError;
            } else {
                const { error: updateError } = await supabase
                    .from("votes")
                    .update({ value })
                    .eq("user_id", userId)
                    .eq("caption_id", captionId);

                if (updateError) throw updateError;
            }

            setCurrentVote(value);
            router.refresh();
        } catch (err) {
            console.error("Vote error:", err);
            setError(
                err instanceof Error ? err.message : "Failed to save vote."
            );
        } finally {
            setWorking(false);
        }
    }

    if (!userId) {
        return <p className="signInMessage">Sign in to vote</p>;
    }

    return (
        <>
            <div className="voteButtons">
                <button
                    type="button"
                    className={`voteButton ${currentVote === 1 ? "selected" : ""}`}
                    onClick={() => vote(1)}
                    disabled={working}
                >
                    FUNNIER ↑
                </button>

                <button
                    type="button"
                    className={`voteButton ${currentVote === -1 ? "selected" : ""}`}
                    onClick={() => vote(-1)}
                    disabled={working}
                >
                    NOT IT ↓
                </button>
            </div>

            {error && <p className="voteError">{error}</p>}
        </>
    );
}
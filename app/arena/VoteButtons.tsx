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
        if (!userId || working) return;

        console.log("VOTE DEBUG:", {
            currentVote,
            clickedValue: value,
            currentVoteType: typeof currentVote,
            clickedValueType: typeof value,
            matches: currentVote === value,
        });

        setWorking(true);
        setError(null);

        try {
            if (currentVote === value) {
                // Clicking the same button again removes the vote
                const { data, error: deleteError } = await supabase
                    .from("votes")
                    .delete()
                    .eq("user_id", userId)
                    .eq("caption_id", captionId)
                    .select();

                if (deleteError) throw deleteError;

                console.log("Deleted votes:", data);

                if (!data || data.length === 0) {
                    throw new Error("No vote was deleted. Check the vote ID and permissions.");
                }

                setCurrentVote(null);

            } else if (currentVote === null) {
                // No existing vote: create one
                const { error: insertError } = await supabase
                    .from("votes")
                    .insert({
                        user_id: userId,
                        caption_id: captionId,
                        value,
                    });

                if (insertError) throw insertError;

                setCurrentVote(value);

            } else {
                // Switching from upvote to downvote (or vice versa)
                const { error: updateError } = await supabase
                    .from("votes")
                    .update({ value })
                    .eq("user_id", userId)
                    .eq("caption_id", captionId);

                if (updateError) throw updateError;

                setCurrentVote(value);
            }

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
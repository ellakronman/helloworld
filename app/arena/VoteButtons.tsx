"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { saveVote, type Vote } from "@/lib/voting";

type VoteButtonsProps = {
    captionId: string;
    userId: string | null;
    initialVote: Vote | null;
};

export default function VoteButtons({
                                        captionId,
                                        userId,
                                        initialVote,
                                    }: VoteButtonsProps) {
    const router = useRouter();
    const supabase = createClient();

    const [currentVote, setCurrentVote] = useState<Vote | null>(
        initialVote
    );
    const [working, setWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inFlight = useRef(false);
    const [refreshing, startRefresh] = useTransition();
    async function vote(value: Vote) {
        if (!userId || inFlight.current || refreshing) return;
        inFlight.current = true;
        setWorking(true);
        setError(null);
        try {
            setCurrentVote(await saveVote(supabase, userId, captionId, currentVote, value));
            startRefresh(() => router.refresh());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save vote.");
            startRefresh(() => router.refresh());
        } finally {
            inFlight.current = false;
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
                    aria-pressed={currentVote === 1}
                    title={currentVote === 1 ? "Click again to undo your vote" : "Vote funnier"}
                    onClick={() => vote(1)}
                    disabled={working || refreshing}
                >
                    FUNNIER ↑
                </button>

                <button
                    type="button"
                    className={`voteButton ${currentVote === -1 ? "selected" : ""}`}
                    aria-pressed={currentVote === -1}
                    title={currentVote === -1 ? "Click again to undo your vote" : "Vote not it"}
                    onClick={() => vote(-1)}
                    disabled={working || refreshing}
                >
                    NOT IT ↓
                </button>
            </div>

            {error && <p className="voteError" role="alert">{error}</p>}
        </>
    );
}
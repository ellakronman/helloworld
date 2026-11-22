import type { SupabaseClient } from "@supabase/supabase-js";

export type Vote = 1 | -1;

export async function saveVote(
    supabase: SupabaseClient, userId: string, captionId: string,
    currentVote: Vote | null, value: Vote,
): Promise<Vote | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || user?.id !== userId) {
        throw new Error("Your session has changed. Please sign in again before voting.");
    }
    const nextVote = currentVote === value ? null : value;
    const table = supabase.from("votes");
    const mutation = nextVote === null
        ? table.delete().eq("user_id", userId).eq("caption_id", captionId)
        : currentVote === null
            ? table.insert({ user_id: userId, caption_id: captionId, value })
            : table.update({ value }).eq("user_id", userId).eq("caption_id", captionId);
    const { data, error } = await mutation.select("value");
    if (error) throw new Error(error.message || "Could not save your vote.");
    if (!data || data.length !== 1 || (nextVote !== null && data[0].value !== nextVote)) {
        throw new Error("Your vote could not be confirmed. Refresh the page and try again.");
    }
    return nextVote;
}

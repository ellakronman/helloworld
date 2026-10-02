import { createClient } from "@/lib/supabase/server";
import VoteButtons from "./VoteButtons";
import "./arena.css";

export default async function ArenaPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("id, image_url, created_at")
        .order("created_at", { ascending: false });

    if (imagesError) {
        console.error("Images fetch error:", imagesError);
    }

    const { data: captions, error: captionsError } = await supabase
        .from("captions")
        .select("id, image_id, text, created_at");

    if (captionsError) {
        console.error("Captions fetch error:", captionsError);
    }

    const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("user_id, caption_id, value");

    if (votesError) {
        console.error("Votes fetch error:", votesError);
    }

    return (
        <main className="arena">
            <header className="arenaHeader">
                <h1 className="logo">
                    CAPTION
                    <br />
                    FIGHT CLUB
                </h1>

                <div className="headerRight">
                    <p>
                        Four captions enter.
                        <br />
                        The internet decides who leaves funny.
                    </p>

                    {user ? (
                        <a href="/upload" className="throwButton">
                            THROW A PHOTO INTO THE RING →
                        </a>
                    ) : (
                        <a href="/" className="throwButton">
                            SIGN IN TO ENTER →
                        </a>
                    )}
                </div>
            </header>

            {!images || images.length === 0 ? (
                <p className="emptyArena">NO FIGHTS YET.</p>
            ) : (
                images.map((image, fightIndex) => {
                    const imageCaptions =
                        captions?.filter(
                            (caption) => caption.image_id === image.id
                        ) ?? [];

                    return (
                        <section className="fight" key={image.id}>
                            <p className="fightNumber">
                                FIGHT #{String(images.length - fightIndex).padStart(2, "0")}
                            </p>

                            <div className="photoWrap">
                                <img
                                    src={image.image_url}
                                    alt="Caption fight"
                                    className="fightPhoto"
                                />
                            </div>

                            {imageCaptions.map((caption, captionIndex) => {
                                const captionVotes =
                                    votes?.filter(
                                        (vote) => vote.caption_id === caption.id
                                    ) ?? [];

                                const score = captionVotes.reduce(
                                    (total, vote) => total + vote.value,
                                    0
                                );

                                const currentUserVote = user
                                    ? captionVotes.find(
                                    (vote) => vote.user_id === user.id
                                )?.value ?? null
                                    : null;

                                return (
                                    <article
                                        key={caption.id}
                                        className={`captionContender position${captionIndex}`}
                                    >
                    <span className="captionNumber">
                      CONTENDER {String(captionIndex + 1).padStart(2, "0")}
                    </span>

                                        <p
                                            className="captionText"
                                            style={{
                                                fontWeight: score > 0 ? 900 : 700,
                                                opacity: score < 0 ? 0.6 : 1,
                                            }}
                                        >
                                            {caption.text}
                                        </p>

                                        <div className="voteArea">
                      <span className="score">
                        {score > 0 ? "+" : ""}
                          {score} PTS
                      </span>

                                            <VoteButtons
                                                captionId={caption.id}
                                                userId={user?.id ?? null}
                                                initialVote={currentUserVote}
                                            />
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    );
                })
            )}
        </main>
    );
}
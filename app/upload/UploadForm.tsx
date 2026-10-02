"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function chooseFile(selectedFile: File | null) {
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith("image/")) {
            setError("That isn't an image. Try again.");
            return;
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setStatus(null);
        setError(null);
    }

    async function enterFight() {
        if (!file) {
            setError("Choose a photo first.");
            return;
        }

        setWorking(true);
        setError(null);

        try {
            // 1. Upload image to Vercel Blob.
            setStatus("THROWING IT INTO THE RING...");

            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch("/api/caption-image", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadData.error || "Upload failed.");
            }

            // 2. LLM CALL #1:
            // actual image -> factual text description.
            setStatus("LOOKING AT IT...");

            const descriptionResponse = await fetch("/api/describe-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl: uploadData.imageUrl,
                }),
            });

            const descriptionData = await descriptionResponse.json();

            if (!descriptionResponse.ok) {
                throw new Error(
                    descriptionData.error || "Image description failed."
                );
            }

            // 3. LLM CALL #2:
            // description text ONLY -> four funny captions.
            setStatus("WRITING BAD IDEAS...");

            const captionsResponse = await fetch("/api/generate-captions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description: descriptionData.description,
                }),
            });

            const captionsData = await captionsResponse.json();

            if (!captionsResponse.ok) {
                throw new Error(
                    captionsData.error || "Caption generation failed."
                );
            }

            // 4. Persist the image, intermediate description,
            // and four generated captions in Supabase.
            setStatus("SIGNING THE FIGHT CARD...");

            const saveResponse = await fetch("/api/save-generation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl: uploadData.imageUrl,
                    description: descriptionData.description,
                    captions: captionsData.captions,
                }),
            });

            const saveData = await saveResponse.json();

            if (!saveResponse.ok) {
                throw new Error(
                    saveData.error || "Failed to save generation."
                );
            }

            setStatus("4 CONTENDERS HAVE ENTERED.");

            // Go directly to the persisted arena.
            router.push("/arena");
            router.refresh();
        } catch (err) {
            setStatus(null);

            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setWorking(false);
        }
    }

    return (
        <section className="entryArea">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hiddenFileInput"
                onChange={(event) => {
                    chooseFile(event.target.files?.[0] ?? null);
                }}
            />

            {!previewUrl ? (
                <button
                    type="button"
                    className="dropZone"
                    onClick={() => inputRef.current?.click()}
                >
                    <span className="dropNumber">01</span>

                    <span className="dropMain">
            CHOOSE
            <br />
            YOUR
            <br />
            FIGHTER
          </span>

                    <span className="dropHint">
            JPG / PNG / WEBP
            <br />
            CLICK TO SELECT
          </span>
                </button>
            ) : (
                <div className="selectedPhoto">
                    <div className="previewFrame">
                        <img
                            src={previewUrl}
                            alt="Selected challenger"
                            className="previewImage"
                        />

                        <span className="previewStamp">READY?</span>
                    </div>

                    <div className="photoControls">
                        <div>
                            <p className="selectedLabel">SELECTED FIGHTER</p>
                            <p className="fileName">{file?.name}</p>
                        </div>

                        <button
                            type="button"
                            className="changeButton"
                            onClick={() => inputRef.current?.click()}
                            disabled={working}
                        >
                            CHANGE PHOTO
                        </button>
                    </div>
                </div>
            )}

            <div className="entryFooter">
                <div className="statusArea">
                    {working && <span className="statusDot" />}

                    <p className="statusText">
                        {status ??
                            (file
                                ? "THE RING IS READY."
                                : "NO FIGHTER SELECTED YET.")}
                    </p>
                </div>

                <button
                    type="button"
                    className="enterButton"
                    onClick={enterFight}
                    disabled={!file || working}
                >
                    {working ? "FIGHT IN PROGRESS..." : "ENTER THE FIGHT →"}
                </button>
            </div>

            {error && <p className="uploadError">ERROR / {error}</p>}
        </section>
    );
}
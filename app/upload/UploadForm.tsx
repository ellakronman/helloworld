"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { imageError } from "@/lib/image-validation";

type Generation = { imageUrl: string; description: string; captions: string[]; generationProof: string };
async function post(url: string, body: FormData | object) {
    const response = await fetch(url, {
        method: "POST",
        ...(body instanceof FormData ? { body } : {
            headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        }),
        signal: AbortSignal.timeout(120_000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || (response.status === 413
        ? "Choose an image smaller than 4 MB."
        : `Request failed (${response.status}). Please try again.`));
    if (!data) throw new Error("The server returned an unreadable response. Please try again.");
    return data;
}

export default function UploadForm() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [working, setWorking] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const inFlight = useRef(false);
    const [generation, setGeneration] = useState<Generation | null>(null);
    const [savedId, setSavedId] = useState<string | null>(null);
    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    function chooseFile(selectedFile: File | null) {
        if (!selectedFile || inFlight.current) return;
        const validationError = imageError(selectedFile);
        if (validationError) {
            setError(validationError);
            return;
        }
        setGeneration(null);
        setSavedId(null);
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setStatus(null);
        setError(null);
    }

    async function enterFight() {
        if (!file || inFlight.current) return;
        inFlight.current = true;
        setWorking(true);
        setError(null);
        setGeneration(null);
        try {
            setStatus("THROWING IT INTO THE RING...");
            const formData = new FormData();
            formData.append("file", file);
            const upload = await post("/api/caption-image", formData);
            setStatus("LOOKING AT IT...");
            const description = await post("/api/describe-image", { imageUrl: upload.imageUrl });
            setStatus("WRITING BAD IDEAS...");
            const result = await post("/api/generate-captions", { descriptionProof: description.descriptionProof });
            if (!Array.isArray(result.captions) || result.captions.length !== 4 ||
                !result.captions.every((caption: unknown) => typeof caption === "string" && caption.trim())) {
                throw new Error("The model did not return four captions. Please try again.");
            }
            setGeneration({ imageUrl: upload.imageUrl, description: description.description, captions: result.captions, generationProof: result.generationProof });
            setStatus("FOUR CONTENDERS. REVIEW THEM BEFORE SAVING.");
        } catch (err) {
            setStatus(null);
            setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
        } finally {
            inFlight.current = false;
            setWorking(false);
        }
    }

    async function saveGeneration() {
        if (!generation || inFlight.current || savedId) return;
        inFlight.current = true;
        setWorking(true);
        setError(null);
        try {
            setStatus("SIGNING THE FIGHT CARD...");
            const result = await post("/api/save-generation", generation);
            setSavedId(result.imageId);
            setStatus("SAVED. YOUR FIGHT IS READY.");
            router.push(`/arena#fight-${encodeURIComponent(result.imageId)}`);
            router.refresh();
        } catch (err) {
            setStatus("YOUR CAPTIONS ARE STILL HERE.");
            setError(err instanceof Error ? err.message : "Could not save. Please try again.");
        } finally {
            inFlight.current = false;
            setWorking(false);
        }
    }

    return (
        <section className="entryArea">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={working}
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
            JPG / PNG / WEBP · MAX 4 MB
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

            {generation && (
                <section className="captionReview" aria-label="Review your four captions">
                    <h2>YOUR FOUR CONTENDERS</h2>
                    <ol>{generation.captions.map((caption, index) => <li key={index}>{caption}</li>)}</ol>
                    <p>Save these captions to enter the Arena.</p>
                </section>
            )}
            <div className="entryFooter">
                <div className="statusArea">
                    {working && <span className="statusDot" />}

                    <p className="statusText" role="status">
                        {status ??
                            (file
                                ? "THE RING IS READY."
                                : "NO FIGHTER SELECTED YET.")}
                    </p>
                </div>

                <button
                    type="button"
                    className="enterButton"
                    onClick={generation ? saveGeneration : enterFight}
                    disabled={!file || working || !!savedId}
                >
                    {working ? "FIGHT IN PROGRESS..." : savedId ? "SAVED" : generation ? "SAVE & ENTER THE ARENA →" : "GENERATE FOUR CAPTIONS →"}
                </button>
            </div>

            {error && <p className="uploadError" role="alert">ERROR / {error}</p>}
        </section>
    );
}
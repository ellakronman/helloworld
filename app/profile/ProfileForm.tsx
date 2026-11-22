"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { imageError } from "@/lib/image-validation";

type ProfileFormProps = {
    initialFirstName: string;
    initialLastName: string;
    initialAvatarUrl: string;
};

export default function ProfileForm({
                                        initialFirstName,
                                        initialLastName,
                                        initialAvatarUrl,
                                    }: ProfileFormProps) {
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const avatarUrl = initialAvatarUrl;
    const [working, setWorking] = useState(false);
    const inFlight = useRef(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
    function chooseAvatar(selected: File | null) {
        if (!selected || inFlight.current) return;
        const error = imageError(selected);
        if (error) { setMessage(error); return; }
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
        setMessage("");
    }
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (inFlight.current) return;
        if (!firstName.trim() || !lastName.trim()) { setMessage("Enter your first and last name."); return; }
        inFlight.current = true;
        setWorking(true);
        setMessage("Saving...");
        try {

            const supabase = createClient();

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setMessage("You are not signed in.");
                return;
            }

            let newAvatarUrl = avatarUrl;

            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/avatar", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    setMessage("Could not upload profile photo.");
                    return;
                }

                const data = await response.json();
                newAvatarUrl = data.url;
            }

            const { data: savedProfile, error } = await supabase
                .from("profiles")
                .update({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    avatar_url: newAvatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id).select("id").single();

            if (error || !savedProfile) {
                console.error(error);
                setMessage("Could not save your profile. Your profile may be missing or unavailable. Please try signing in again.");
                return;
            }

            router.push("/");
            router.refresh();
        } catch {
            setMessage("Could not save your profile. Check your connection and try again.");
        } finally {
            inFlight.current = false;
            setWorking(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="profileAvatarSection">
                <div className="profileAvatarPreview">
                    {previewUrl || avatarUrl ? (
                        <img
                            src={previewUrl || avatarUrl}
                            alt="Your profile photo"
                            width={120}
                            height={120}
                        />
                    ) : (
                        <span className="profileAvatarPlaceholder">?</span>
                    )}
                </div>

                <div className="profileAvatarActions">
                    <label htmlFor="avatar" className="profileAvatarButton">
                        CHANGE PHOTO ↗
                    </label>

                    <p>JPG, PNG, OR WEBP · MAX 4 MB</p>
                </div>

                <input
                    id="avatar"
                    className="profileAvatarInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={working}
                    onChange={(e) => chooseAvatar(e.target.files?.[0] ?? null)}
                />
            </div>

            <div>
                <label htmlFor="firstName">First name</label>
                <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
            </div>

            <div>
                <label htmlFor="lastName">Last name</label>
                <input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />
            </div>

            <button type="submit" disabled={working}>{working ? "Saving..." : "Save profile"}</button>

            {message && <p role="status">{message}</p>}
        </form>
    );
}
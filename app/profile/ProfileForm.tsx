"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("Saving...");

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

        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: firstName,
                last_name: lastName,
                avatar_url: newAvatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (error) {
            console.error(error);
            setMessage("Could not save profile.");
            return;
        }

        router.push("/");
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit}>
            {avatarUrl && (
                <div>
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        width={120}
                        height={120}
                    />
                </div>
            )}

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

            <div>
                <label htmlFor="avatar">Profile photo</label>
                <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
            </div>

            <button type="submit">Save profile</button>

            {message && <p>{message}</p>}
        </form>
    );
}
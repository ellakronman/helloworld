import { signGeneration } from "@/lib/generation-proof";
import { startGeneration, finishGeneration } from "@/lib/generation-audit";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return Response.json(
            { error: "You must be signed in." },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => null);
    const imageUrl = body?.imageUrl;

    if (!imageUrl || typeof imageUrl !== "string") {
        return Response.json(
            { error: "An image URL is required." },
            { status: 400 }
        );
    }

    if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return Response.json({ error: "AI generation is not configured. Please contact the site owner." }, { status: 503 });
    }
    try {
        const url = new URL(imageUrl);
        if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com") ||
            !url.pathname.startsWith(`/caption-images/${user.id}/`)) throw new Error("Invalid image");
    } catch {
        return Response.json({ error: "Please upload your image before generating captions." }, { status: 400 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 0 });
    const auditId = await startGeneration(user.id, "image_description");
    try {
        const response = await openai.responses.create({
            model: "gpt-5.4-mini",
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text:
                                "Describe this image clearly and specifically. Focus on the visible subjects, their actions, expressions, setting, objects, and any unusual or potentially humorous details. Do not write jokes or captions. Return only a factual description of the image.",
                        },
                        {
                            type: "input_image",
                            image_url: imageUrl,
                            detail: "high",
                        },
                    ],
                },
            ],
        });

        if (!response.output_text?.trim()) throw new Error("Empty image description");
        await finishGeneration(auditId, "completed", response.output_text);
        return Response.json({
            description: response.output_text,
            descriptionProof: signGeneration({ userId: user.id, imageUrl, description: response.output_text }, process.env.SUPABASE_SERVICE_ROLE_KEY),
        });
    } catch (error) {
        await finishGeneration(auditId, "failed");
        console.error("Image description error:", error);

        return Response.json(
            { error: "Failed to describe image." },
            { status: 500 }
        );
    }
}
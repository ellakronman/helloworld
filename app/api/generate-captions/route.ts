import { signGeneration, verifyGeneration } from "@/lib/generation-proof";
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
    const signingKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const proof = verifyGeneration(body?.descriptionProof, user.id, signingKey);
    const description = proof?.description;

    if (!proof || !description || proof.captions) {
        return Response.json(
            { error: "Please generate an image description first, or regenerate if it has expired." },
            { status: 400 }
        );
    }

    if (!process.env.OPENAI_API_KEY) {
        return Response.json({ error: "AI generation is not configured. Please contact the site owner." }, { status: 503 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 0 });
    const auditId = await startGeneration(user.id, "captions");
    try {
        const response = await openai.responses.create({
            model: "gpt-5.4-mini",
            input: `You are writing funny captions for an image.

You cannot see the image. The only information you have about it is this factual description:

${description}

Based ONLY on that description, write exactly 4 distinct, short, funny captions.

Make them feel like internet humor rather than generic image descriptions. Vary the comedic angle between captions. Do not number them and do not include explanations.

Return the captions as exactly four lines, with one caption per line.`,
        });

        const captions = response.output_text
            .split("\n")
            .map((caption) => caption.trim())
            .filter((caption) => caption.length > 0);

        if (captions.length !== 4) {
            await finishGeneration(auditId, "failed");
            return Response.json(
                { error: "The model did not return exactly four captions." },
                { status: 500 }
            );
        }

        await finishGeneration(auditId, "completed", response.output_text);
        return Response.json({
            captions,
            generationProof: signGeneration({ userId: user.id, imageUrl: proof.imageUrl, description, captions }, signingKey),
        });
    } catch (error) {
        await finishGeneration(auditId, "failed");
        console.error("Caption generation error:", error);

        return Response.json(
            { error: "Failed to generate captions." },
            { status: 500 }
        );
    }
}
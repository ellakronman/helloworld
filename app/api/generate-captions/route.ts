import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

    const body = await request.json();
    const description = body.description;

    if (!description || typeof description !== "string") {
        return Response.json(
            { error: "An image description is required." },
            { status: 400 }
        );
    }

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
            .filter((caption) => caption.length > 0)
            .slice(0, 4);

        if (captions.length !== 4) {
            return Response.json(
                { error: "The model did not return exactly four captions." },
                { status: 500 }
            );
        }

        return Response.json({
            captions,
        });
    } catch (error) {
        console.error("Caption generation error:", error);

        return Response.json(
            { error: "Failed to generate captions." },
            { status: 500 }
        );
    }
}
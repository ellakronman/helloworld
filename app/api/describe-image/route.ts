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
    const imageUrl = body.imageUrl;

    if (!imageUrl || typeof imageUrl !== "string") {
        return Response.json(
            { error: "An image URL is required." },
            { status: 400 }
        );
    }

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

        return Response.json({
            description: response.output_text,
        });
    } catch (error) {
        console.error("Image description error:", error);

        return Response.json(
            { error: "Failed to describe image." },
            { status: 500 }
        );
    }
}
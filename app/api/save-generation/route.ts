import { verifyGeneration } from "@/lib/generation-proof";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Validate privileged configuration before creating any database rows.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return Response.json({ error: "Saving is not configured. Please contact the site owner." }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    const proof = verifyGeneration(body?.generationProof, user.id, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
    if (!proof) return Response.json({ error: "This generation cannot be verified or has expired. Please generate captions again." }, { status: 400 });
    const { imageUrl, description, captions } = proof;

    if (
        typeof imageUrl !== "string" ||
        typeof description !== "string" ||
        !Array.isArray(captions) ||
        captions.length !== 4 ||
        !captions.every(
            (caption) => typeof caption === "string" && caption.trim().length > 0
        )
    ) {
        return Response.json(
            { error: "Invalid generation data." },
            { status: 400 }
        );
    }

    const admin = createAdminClient();

    // Insert the image using the authenticated user's normal Supabase client.
    // Our images RLS policy requires user_id to equal auth.uid().
    const { data: image, error: imageError } = await supabase
        .from("images")
        .insert({
            user_id: user.id,
            image_url: imageUrl,
            description,
        })
        .select("id")
        .single();

    if (imageError || !image) {
        console.error("Image database error:", imageError);

        return Response.json(
            { error: "Failed to save image." },
            { status: 500 }
        );
    }

    // Users intentionally do not have permission to create arbitrary captions.
    // This trusted server endpoint inserts only the captions produced by our
    // generation pipeline.
    const { error: captionsError } = await admin.from("captions").insert(
        captions.map((caption: string) => ({
            image_id: image.id,
            text: caption.trim(),
        }))
    );

    if (captionsError) {
        console.error("Caption database error:", captionsError);

        // Avoid leaving behind an image with no captions.
        const { error: cleanupError } = await supabase.from("images").delete().eq("id", image.id).select("id").single();
        if (cleanupError) console.error("Incomplete generation cleanup failed:", cleanupError.code);

        return Response.json(
            { error: "Failed to save captions." },
            { status: 500 }
        );
    }

    return Response.json({
        imageId: image.id,
    });
}
import { imageError } from "@/lib/image-validation";
import { put } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const validationError = imageError(file);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    try {
        const blob = await put(
            `avatars/${user.id}/${file.name}`,
            file,
            {
                access: "public",
                addRandomSuffix: true,
            }
        );

        return Response.json({ url: blob.url });
    } catch {
        return Response.json({ error: "Image upload failed. Please try again in a moment." }, { status: 503 });
    }
}

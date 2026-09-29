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

    if (!file.type.startsWith("image/")) {
        return Response.json({ error: "File must be an image" }, { status: 400 });
    }

    const blob = await put(
        `avatars/${user.id}/${file.name}`,
        file,
        {
            access: "public",
            addRandomSuffix: true,
        }
    );

    return Response.json({ url: blob.url });
}
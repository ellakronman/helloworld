import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(
            new URL("/auth-error", requestUrl.origin)
        );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Error exchanging code:", error.message);

        return NextResponse.redirect(
            new URL("/auth-error", requestUrl.origin)
        );
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(
            new URL("/auth-error", requestUrl.origin)
        );
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

    // New users need to complete their profile.
    if (!profile?.first_name || !profile?.last_name) {
        return NextResponse.redirect(
            new URL("/profile", requestUrl.origin)
        );
    }

    return NextResponse.redirect(
        new URL("/members", requestUrl.origin)
    );
}
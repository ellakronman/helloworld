import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Server Components cannot persist refreshed session cookies. Refresh them here
// and forward the same cookies to both the render and the browser.
export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll(cookies) {
                    cookies.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                    response.headers.set("Cache-Control", "private, no-store");
                },
            },
        },
    );
    await supabase.auth.getUser();
    return response;
}

export const config = {
    matcher: ["/", "/arena", "/upload", "/profile", "/members"],
};

import { createHmac, timingSafeEqual } from "node:crypto";

type GenerationProof = {
    userId: string;
    imageUrl: string;
    description: string;
    captions?: string[];
    expiresAt: number;
};
function signature(payload: string, key: string) {
    return createHmac("sha256", key).update(`caption-fight-club:generation:${payload}`).digest();
}
export function signGeneration(data: Omit<GenerationProof, "expiresAt">, key: string) {
    if (!key) throw new Error("Generation signing is not configured.");
    const payload = Buffer.from(JSON.stringify({ ...data, expiresAt: Date.now() + 86_400_000 })).toString("base64url");
    return `${payload}.${signature(payload, key).toString("base64url")}`;
}
export function verifyGeneration(token: unknown, userId: string, key: string): GenerationProof | null {
    if (!key || typeof token !== "string" || token.length > 100_000) return null;
    try {
        const parts = token.split(".");
        if (parts.length !== 2) return null;
        const [payload, mac] = parts;
        const supplied = Buffer.from(mac, "base64url");
        const expected = signature(payload, key);
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
        const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as GenerationProof;
        if (data.userId !== userId || !Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now()) return null;
        if (typeof data.imageUrl !== "string" || typeof data.description !== "string") return null;
        return data;
    } catch { return null; }
}

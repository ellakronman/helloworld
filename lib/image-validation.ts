// Leave room for multipart headers below Vercel's 4.5 MB request limit.
export const MAX_IMAGE_BYTES = 4_000_000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export function imageError(file: { size: number; type: string }): string | null {
    if (!IMAGE_TYPES.includes(file.type)) return "Choose a JPG, PNG, or WebP image.";
    if (!file.size) return "This image is empty. Choose another photo.";
    if (file.size > MAX_IMAGE_BYTES) return "Choose an image smaller than 4 MB.";
    return null;
}

/**
 * Extracts Youtube Video ID from a given URL.
 * Supports standard URLs, short URLs (youtu.be), and Shorts URLs.
 * 
 * @param url The full Youtube URL
 * @returns The Video ID if found, video ID if it was already an ID, or null if invalid
 */
export function extractYoutubeId(url: string): string | null {
    if (!url) return null;

    // Regex to match various YouTube URL formats
    // 1. https://www.youtube.com/shorts/VIDEO_ID
    // 2. https://youtu.be/VIDEO_ID
    // 3. https://www.youtube.com/watch?v=VIDEO_ID
    // 4. Standard Video ID (11 chars) - fallback
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;

    const match = url.match(regex);

    if (match && match[1]) {
        return match[1];
    }

    // If the input itself looks like a video ID (11 characters, alphanumeric + - _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

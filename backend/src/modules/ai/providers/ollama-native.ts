/**
 * Native Ollama /api/generate handler.
 * Used as a fallback when OpenAI-compatible /chat/completions is unavailable.
 */
export async function generateWithOllamaNative(
    url: string,
    model: string,
    system: string,
    prompt: string,
    maxTokens = 600,
) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model,
                prompt: `${system}\n\n${prompt}`,
                stream: false,
                options: {
                    num_predict: maxTokens,
                },
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`Ollama native request failed with status ${response.status}`);
        }

        const data = (await response.json()) as { response?: string };
        const text = data.response?.trim();
        if (!text) throw new Error('Ollama native returned empty content');
        return text;
    } finally {
        clearTimeout(timeout);
    }
}

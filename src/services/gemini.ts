/**
 * Gemini client — calls the Cloudflare Worker proxy, never Gemini directly.
 *
 * Not used by the MVP (Tab 1 + Tab 2 are fully static + Web Speech API).
 * Included here as the foundation for v0.2 features (AI example sentences,
 * image generation, storyboards).
 *
 * Config: update WORKER_ENDPOINT once Jason deploys the worker.
 */

const WORKER_ENDPOINT = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export interface GenerateOptions {
  prompt: string;
  model?: string;
  temperature?: number;
}

export async function generateText(opts: GenerateOptions): Promise<string> {
  const resp = await fetch(`${WORKER_ENDPOINT}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(
      typeof err === 'object' && err && 'error' in err ? String(err.error) : 'Gemini error'
    );
  }

  const data = (await resp.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const resp = await fetch(`${WORKER_ENDPOINT}/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

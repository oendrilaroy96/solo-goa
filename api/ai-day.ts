import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const VALID_CATEGORIES = [
  'restaurant', 'cafe', 'bar', 'gallery', 'museum', 'heritage',
  'workshop', 'transport', 'hotel', 'shopping', 'nature', 'viewpoint', 'activity',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { description, destination, dateLabel } = (req.body ?? {}) as Record<string, string>;
  if (!description?.trim()) return res.status(400).json({ error: 'description is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI not configured — set ANTHROPIC_API_KEY in Vercel env vars' });

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a travel itinerary assistant. The trip is to ${destination || 'the destination'} on ${dateLabel || 'a travel day'}.

The traveller wants: "${description.trim()}"

Create a realistic, well-timed day itinerary with 4–8 events. Include travel time between places. Return ONLY a valid JSON object with no markdown fences or explanation:

{"events":[{"time":"9:00 AM","title":"Place or activity name","description":"1–2 sentences.","categories":["heritage"],"tag":"₹200","tagVariant":"default"}]}

Rules:
- categories must only use values from: ${VALID_CATEGORIES.join(', ')}
- tagVariant must be one of: default, pending, free
- tag is an optional cost string like "₹500" or "Free" — or empty ""
- times in "H:MM AM/PM" format, spaced realistically (30–90 min per stop)
- description should be practical and helpful, not generic`,
      }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Could not parse AI response' });

    const parsed = JSON.parse(jsonMatch[0]) as { events: unknown[] };
    if (!Array.isArray(parsed.events)) return res.status(500).json({ error: 'Unexpected AI response shape' });

    // Sanitise each event
    const events = parsed.events.map((e: unknown) => {
      const ev = e as Record<string, unknown>;
      return {
        time:        String(ev.time        ?? ''),
        title:       String(ev.title       ?? ''),
        description: String(ev.description ?? ''),
        categories:  (Array.isArray(ev.categories) ? ev.categories as string[] : [])
                       .filter(c => VALID_CATEGORIES.includes(c)),
        tag:         String(ev.tag ?? ''),
        tagVariant:  ['default', 'pending', 'free'].includes(String(ev.tagVariant)) ? ev.tagVariant : 'default',
      };
    });

    return res.status(200).json({ events });
  } catch (err) {
    console.error('[ai-day]', err);
    return res.status(500).json({ error: 'AI request failed' });
  }
}

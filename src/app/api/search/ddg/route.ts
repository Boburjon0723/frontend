import { NextRequest, NextResponse } from 'next/server';

/**
 * DuckDuckGo Instant Answer API proksi — iframe o‘rniga JSON.
 * Brauzer CORS yoki tarmoq cheklovlarida ishlaydi.
 */
export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q) {
        return NextResponse.json({ error: 'q kerak' }, { status: 400 });
    }

    const upstream = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1&t=mali_consult`;
    try {
        const r = await fetch(upstream, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(12_000),
        });
        if (!r.ok) {
            return NextResponse.json(
                { error: `DuckDuckGo: ${r.status}`, Heading: '', AbstractText: '', RelatedTopics: [] },
                { status: 502 }
            );
        }
        const data = await r.json();
        return NextResponse.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'fetch xatosi';
        return NextResponse.json(
            { error: msg, Heading: '', AbstractText: '', RelatedTopics: [] },
            { status: 502 }
        );
    }
}

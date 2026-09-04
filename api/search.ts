type VercelReq = {
  query: Record<string, string | string[] | undefined>;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const rawQuery = req.query['q'];
  const q = typeof rawQuery === 'string' ? rawQuery : Array.isArray(rawQuery) ? rawQuery[0] ?? '' : '';

  const rawN = req.query['n'];
  const parsedN = typeof rawN === 'string' ? parseFloat(rawN) : Array.isArray(rawN) ? parseFloat(rawN[0] ?? '') : NaN;
  const n = Number.isFinite(parsedN) ? Math.min(Math.max(Math.floor(parsedN), 1), 100) : 40;

  const rawP = req.query['p'];
  const parsedP = typeof rawP === 'string' ? parseFloat(rawP) : Array.isArray(rawP) ? parseFloat(rawP[0] ?? '') : NaN;
  const p = Number.isFinite(parsedP) ? Math.max(Math.floor(parsedP), 1) : 1;

  if (!q.trim()) {
    res.status(400).json({ error: 'missing query param q' });
    return;
  }

  const url =
    `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&n=${n}&p=${p}&q=${encodeURIComponent(q)}&_marker=0`;

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    const text = await upstream.text();
    const json = JSON.parse(text.trim());
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(upstream.ok ? 200 : upstream.status).json(json);
  } catch {
    res.status(502).json({ error: 'upstream search failed' });
  }
}
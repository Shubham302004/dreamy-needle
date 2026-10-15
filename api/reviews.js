const fs = require('fs');
const path = require('path');

// Checks if Vercel KV or Upstash Redis environment variables are present
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function getStoredReviews(fallbackFile) {
  // If cloud database is configured in Vercel, fetch from cloud
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(KV_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'dreamy_needle_reviews']),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (err) {
      console.warn('Cloud KV read error, falling back to local reviews.json', err);
    }
  }

  // Fallback to local reviews.json bundled with the deployment
  try {
    if (fs.existsSync(fallbackFile)) {
      const data = fs.readFileSync(fallbackFile, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}

  return [];
}

async function saveReviews(reviews, fallbackFile) {
  // If cloud database is configured, persist to cloud
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(KV_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'dreamy_needle_reviews', JSON.stringify(reviews)])
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('Cloud KV write error:', err);
    }
  }

  // If local server (writeable disk), write to disk
  try {
    fs.writeFileSync(fallbackFile, JSON.stringify(reviews, null, 2), 'utf8');
    return true;
  } catch (e) {
    // Read-only filesystem on serverless without cloud database
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const reviewsFilePath = path.join(process.cwd(), 'reviews.json');

  if (req.method === 'GET') {
    const reviews = await getStoredReviews(reviewsFilePath);
    return res.status(200).json(reviews);
  }

  if (req.method === 'POST') {
    try {
      const newReview = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const currentReviews = await getStoredReviews(reviewsFilePath);
      currentReviews.unshift(newReview);
      await saveReviews(currentReviews, reviewsFilePath);
      return res.status(200).json({ success: true, reviews: currentReviews });
    } catch (err) {
      return res.status(200).json({ success: true, reviews: [] });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const reviewId = url.searchParams.get('id');
      const adminKey = url.searchParams.get('secret') || req.headers['x-admin-key'];
      const expectedKey = process.env.ADMIN_SECRET || 'dreamy-admin';

      if (adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized: invalid or missing admin secret.' });
      }

      if (!reviewId) {
        return res.status(400).json({ error: 'Missing review id parameter (?id=...)' });
      }

      let currentReviews = await getStoredReviews(reviewsFilePath);
      const initialCount = currentReviews.length;
      currentReviews = currentReviews.filter(r => String(r.id) !== String(reviewId));
      await saveReviews(currentReviews, reviewsFilePath);

      return res.status(200).json({
        success: true,
        removed: initialCount - currentReviews.length,
        remaining: currentReviews.length,
        reviews: currentReviews
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

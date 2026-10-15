const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const reviewsFilePath = path.join(process.cwd(), 'reviews.json');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(reviewsFilePath)) {
        const data = fs.readFileSync(reviewsFilePath, 'utf8');
        return res.status(200).json(JSON.parse(data || '[]'));
      }
    } catch (e) {}
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    try {
      const newReview = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      return res.status(200).json({ success: true, review: newReview });
    } catch (err) {
      return res.status(200).json({ success: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

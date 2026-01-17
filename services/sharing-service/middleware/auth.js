const axios = require('axios');

async function requireAuth(req, res, next) {
  try {
    const cookie = req.headers.cookie || '';
    if (!cookie) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    const r = await axios.get(`${process.env.USER_SERVICE_URL}/api/users/me`, {
      headers: { Cookie: cookie },
      withCredentials: true,
      validateStatus: () => true
    });

    if (!r.data || !r.data.data || !r.data.data.id) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    req.user = r.data.data;   
    req.userId = req.user.id;

    return next();
  } catch (e) {
    console.error('[AUTH PROXY]', e.message);
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }
}

module.exports = { requireAuth };

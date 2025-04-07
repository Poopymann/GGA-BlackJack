export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No code provided.');
  }

  const params = new URLSearchParams();
  params.append('client_id', process.env.DISCORD_CLIENT_ID);
  params.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', process.env.DISCORD_REDIRECT_URI);
  params.append('scope', 'identify');

  try {
    // Step 1: Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Failed to get access token.', details: tokenData });
    }

    // Step 2: Set the token as a cookie (for use in /api/me.js)
    res.setHeader('Set-Cookie', `discord_token=${tokenData.access_token}; Path=/; HttpOnly; Max-Age=86400; Secure; SameSite=None`);

    // Step 3: Redirect back to site
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.', details: err.message });
  }
}

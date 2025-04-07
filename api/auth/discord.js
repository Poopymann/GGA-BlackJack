export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: 'Missing code in request' });
  }

  const params = new URLSearchParams();
  params.append('client_id', '1358833653676773416');
  params.append('client_secret', 'eWL54Xmp7m4mT7JNRxiqi1UEkfX4Bq02');
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', 'https://ggaaffblackjack.vercel.app/auth/discord');
  params.append('scope', 'identify');

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userRes.json();

    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ error: 'OAuth2 error', details: error.message });
  }
}

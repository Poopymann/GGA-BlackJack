export default async function handler(req, res) {
  const access_token = req.cookies['discord_token'];

  if (!access_token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const discordRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!discordRes.ok) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const user = await discordRes.json();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

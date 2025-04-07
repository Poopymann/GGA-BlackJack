export default async function handler(req, res) {
  const token = req.cookies['discord_token'];

  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const discordRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!discordRes.ok) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const user = await discordRes.json();
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

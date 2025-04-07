import { getSession } from '../auth/session'; // Adjust path if needed

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const userId = session.user.id;

  if (req.method === 'GET') {
    const coins = await fetchUserCoins(userId);
    return res.status(200).json({ coins });
  }

  if (req.method === 'POST') {
    const { delta } = req.body;
    if (typeof delta !== 'number') {
      return res.status(400).json({ error: 'Invalid delta' });
    }
    const newBalance = await updateUserCoins(userId, delta);
    return res.status(200).json({ coins: newBalance });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

// Mock functions — replace with real DB/store logic
async function fetchUserCoins(userId) {
  return 1000; // pretend this comes from DB
}

async function updateUserCoins(userId, delta) {
  return 1000 + delta; // pretend update happened
}

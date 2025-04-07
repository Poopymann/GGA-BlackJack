let deck = [], dealerCards = [], playerCards = [];
let gameOver = false, isAnimating = false, user = null;
let playerBet = 1;

const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerTotalEl = document.getElementById('dealer-total');
const playerTotalEl = document.getElementById('player-total');
const messageEl = document.getElementById('message');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const playBtn = document.getElementById('play-btn');
const loginBtn = document.getElementById('login-btn');
const userInfo = document.getElementById('user-info');
const controlsEl = document.getElementById('controls');
const welcomePopup = document.getElementById('welcome-popup');
const welcomeOverlay = document.getElementById('welcome-overlay');
const closeWelcome = document.getElementById('close-welcome');
const resultPopup = document.getElementById('result-popup');
const resultOverlay = document.getElementById('result-overlay');
const closeResult = document.getElementById('close-result');
const resultTitle = document.getElementById('result-title');
const resultSubtitle = document.getElementById('result-subtitle');

const suits = ['♠', '♣', '♥', '♦'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function initGame() {
  resultPopup.style.display = 'none';
  resultOverlay.style.display = 'none';
  welcomePopup.style.display = 'block';
  welcomeOverlay.style.display = 'block';

  closeWelcome.onclick = () => {
    welcomePopup.style.display = 'none';
    welcomeOverlay.style.display = 'none';
  };

  closeResult.onclick = () => {
    resultPopup.style.display = 'none';
    resultOverlay.style.display = 'none';
  };

  loginBtn.onclick = () => {
    const clientId = "1358833653676773416";
    const redirectUri = encodeURIComponent("https://ggaaffblackjack.vercel.app/api/auth/discord");
    const scope = "identify";
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };

  playBtn.onclick = startGame;
  hitBtn.onclick = hit;
  standBtn.onclick = stand;
  doubleBtn.onclick = double;

  disableControls();
  checkLogin();
  window.addEventListener('resize', adjustLayout);
}

function disableControls() {
  hitBtn.disabled = true;
  standBtn.disabled = true;
  doubleBtn.disabled = true;
  playBtn.disabled = true;
}

function enableControls() {
  hitBtn.disabled = false;
  standBtn.disabled = false;
  doubleBtn.disabled = playerCards.length !== 2;
  playBtn.disabled = true;
}

async function checkLogin() {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) throw new Error();
    user = await res.json();
    userInfo.textContent = `Logged in as ${user.username}#${user.discriminator}`;
    loginBtn.style.display = "none";
    playBtn.disabled = false;
  } catch {
    userInfo.textContent = "You must log in with Discord to play.";
    playBtn.disabled = true;
  }
}

function adjustLayout() {
  controlsEl.classList.toggle('controls-column', window.innerWidth < 768);
}

function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

async function startGame() {
  if (!user) return;

  createDeck();
  dealerCards = [], playerCards = [];
  gameOver = false;
  isAnimating = false;
  playerBet = 1;

  dealerCardsEl.innerHTML = '';
  playerCardsEl.innerHTML = '';
  dealerTotalEl.textContent = '';
  playerTotalEl.textContent = '';
  messageEl.textContent = "21 PAYS 3 TO 2";

  resultPopup.style.display = 'none';
  resultOverlay.style.display = 'none';
  welcomePopup.style.display = 'none';
  welcomeOverlay.style.display = 'none';

  await dealInitialCards();
  enableControls();

  if (calculateTotal(playerCards) === 21) {
    await stand();
  }
}

async function dealInitialCards() {
  isAnimating = true;
  playerCards.push(drawCard()); renderCards(); await sleep(400);
  dealerCards.push(drawCard()); renderCards(); await sleep(400);
  playerCards.push(drawCard()); renderCards(); await sleep(400);
  dealerCards.push(drawCard()); renderCards(); await sleep(400);
  updateTotals();
  isAnimating = false;
}

function drawCard() {
  return deck.pop();
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function calculateTotal(cards) {
  let total = 0, aces = 0;
  for (let card of cards) {
    if (card.value === 'A') {
      total += 11;
      aces++;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      total += 10;
    } else {
      total += parseInt(card.value);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function renderCards() {
  dealerCardsEl.innerHTML = '';
  playerCardsEl.innerHTML = '';

  dealerCards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    if (i === 0 && !gameOver) {
      el.classList.add('hidden-card');
    } else {
      if (['♥', '♦'].includes(card.suit)) el.classList.add('red');
      el.innerHTML = `<div class="card-top">${card.value}</div><div class="card-value">${card.suit}</div><div class="card-bottom">${card.value}</div>`;
    }
    dealerCardsEl.appendChild(el);
  });

  playerCards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'card';
    if (['♥', '♦'].includes(card.suit)) el.classList.add('red');
    el.innerHTML = `<div class="card-top">${card.value}</div><div class="card-value">${card.suit}</div><div class="card-bottom">${card.value}</div>`;
    playerCardsEl.appendChild(el);
  });
}

function updateTotals() {
  const playerTotal = calculateTotal(playerCards);
  const dealerTotal = calculateTotal(dealerCards);
  playerTotalEl.textContent = playerTotal > 21 ? 'BUST' : (playerTotal === 21 && playerCards.length === 2) ? 'BJ' : playerTotal;
  dealerTotalEl.textContent = gameOver ? (dealerTotal > 21 ? 'BUST' : (dealerTotal === 21 && dealerCards.length === 2) ? 'BJ' : dealerTotal) : '';
  return playerTotal;
}

async function hit() {
  if (gameOver || isAnimating) return;
  isAnimating = true;
  playerCards.push(drawCard());
  renderCards();
  const total = updateTotals();
  if (total >= 21) {
    await sleep(400);
    total === 21 ? await stand() : endGame(false);
  }
  isAnimating = false;
}

async function stand() {
  if (gameOver || isAnimating) return;
  gameOver = true;
  isAnimating = true;
  renderCards(); updateTotals(); await sleep(800);
  await dealerPlay();
  isAnimating = false;
}

async function double() {
  if (gameOver || isAnimating || playerCards.length !== 2) return;
  playerBet *= 2;
  disableControls();
  playerCards.push(drawCard());
  renderCards();
  updateTotals();
  await sleep(400);
  await stand();
}

async function dealerPlay() {
  while (calculateTotal(dealerCards) < 17) {
    dealerCards.push(drawCard());
    renderCards(); updateTotals(); await sleep(600);
  }
  determineWinner();
}

function determineWinner() {
  const playerTotal = calculateTotal(playerCards);
  const dealerTotal = calculateTotal(dealerCards);

  if (playerTotal > 21) return endGame(false);
  if (dealerTotal > 21 || playerTotal > dealerTotal) return endGame(true);
  if (playerTotal === dealerTotal) {
    messageEl.textContent = "PUSH";
    showResult("Push!", "It's a tie!");
    playBtn.disabled = false;
    return;
  }

  endGame(false);
}

function endGame(playerWins) {
  gameOver = true;
  disableControls();
  playBtn.disabled = false;
  updateTotals();
  messageEl.textContent = playerWins ? "YOU WIN!" : "YOU LOSE!";
  showResult(playerWins ? "You Defeated Rickyy" : "You Lost!", playerWins ? "GGs!" : "Try again!");
  updateGambaBalance(playerWins);
}

function showResult(title, subtitle) {
  resultTitle.textContent = title;
  resultSubtitle.textContent = subtitle;
  resultPopup.style.display = 'block';
  resultOverlay.style.display = 'block';
}

function updateGambaBalance(win) {
  console.log(`Adjusting Gamba Coins: ${win ? '+' : '-'}${playerBet}`);
  // Hook into backend API here to adjust real balance
}

window.onload = initGame;

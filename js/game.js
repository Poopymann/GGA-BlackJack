let deck = [];
let dealerCards = [];
let playerCards = [];
let gameOver = false;
let isAnimating = false;
let user = null;

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

    closeWelcome.addEventListener('click', () => {
        welcomePopup.style.display = 'none';
        welcomeOverlay.style.display = 'none';
    });

    closeResult.addEventListener('click', () => {
        resultPopup.style.display = 'none';
        resultOverlay.style.display = 'none';
    });

    loginBtn.addEventListener('click', () => {
        const clientId = "1358833653676773416";
        const redirectUri = encodeURIComponent("https://ggaaffblackjack.vercel.app/api/auth/discord");
        const scope = "identify";
        const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
        window.location.href = discordOAuthUrl;
    });

    playBtn.addEventListener('click', startGame);
    hitBtn.addEventListener('click', hit);
    standBtn.addEventListener('click', stand);
    doubleBtn.addEventListener('click', double);

    disableControls();
    checkLogin();
    adjustLayout();
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
    doubleBtn.disabled = false;
    playBtn.disabled = false;
}

async function checkLogin() {
    try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error("Not logged in");

        user = await res.json();
        userInfo.textContent = `Logged in as ${user.username}#${user.discriminator}`;
        loginBtn.style.display = "none";
        playBtn.disabled = false;   // ✅ Enable play button
    } catch {
        user = null;
        userInfo.textContent = "You must log in with Discord to play.";
        loginBtn.style.display = "inline-block";
        playBtn.disabled = true;    // ✅ Disable play button
    }
}

function adjustLayout() {
    if (window.innerWidth >= 768) {
        controlsEl.classList.remove('controls-column');
    } else {
        controlsEl.classList.add('controls-column');
    }
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

    welcomeOverlay.style.display = 'none';
    welcomePopup.style.display = 'none';
    resultOverlay.style.display = 'none';
    resultPopup.style.display = 'none';

    createDeck();
    dealerCards = [];
    playerCards = [];
    gameOver = false;
    isAnimating = false;

    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    dealerTotalEl.textContent = '';
    playerTotalEl.textContent = '';

    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = false;
    playBtn.disabled = true;

    messageEl.textContent = "21 PAYS 3 TO 2";

    await dealInitialCards();

    if (calculateTotal(playerCards) === 21) {
        await stand();
    }
}

async function dealInitialCards() {
    isAnimating = true;

    playerCards.push(drawCard());
    renderCards(false, 'player');
    await sleep(500);

    dealerCards.push(drawCard());
    renderCards(false, 'dealer');
    await sleep(500);

    playerCards.push(drawCard());
    renderCards(false, 'player');
    await sleep(500);

    dealerCards.push(drawCard());
    renderCards(false, 'dealer');
    await sleep(500);

    updateTotals();
    isAnimating = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function drawCard() {
    return deck.pop();
}

function calculateTotal(cards) {
    let total = 0;
    let aces = 0;

    for (let card of cards) {
        if (card.value === 'A') {
            aces++;
            total += 11;
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

function renderCards(updateAll = false, animateTarget = null) {
    if (updateAll) {
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';
    }

    dealerCards.forEach((card, index) => {
        if (!updateAll && dealerCardsEl.children.length > index) return;
        if (index === 0 && !gameOver) {
            const cardEl = document.createElement('div');
            cardEl.className = 'card hidden-card';
            dealerCardsEl.appendChild(cardEl);
        } else {
            const cardEl = createCardElement(card.value, card.suit);
            if (animateTarget === 'dealer' && index === dealerCards.length - 1) {
                cardEl.classList.add('dealing');
            }
            dealerCardsEl.appendChild(cardEl);
        }
    });

    playerCards.forEach((card, index) => {
        if (!updateAll && playerCardsEl.children.length > index) return;
        const cardEl = createCardElement(card.value, card.suit);
        if (animateTarget === 'player' && index === playerCards.length - 1) {
            cardEl.classList.add('dealing');
        }
        playerCardsEl.appendChild(cardEl);
    });
}

function createCardElement(value, suit) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    if (suit === '♥' || suit === '♦') {
        cardEl.classList.add('red');
    }

    cardEl.innerHTML = `
        <div class="card-top">${value}</div>
        <div class="card-value">${suit}</div>
        <div class="card-bottom">${value}</div>
    `;

    return cardEl;
}

function updateTotals() {
    const dealerTotal = calculateTotal(dealerCards);
    const playerTotal = calculateTotal(playerCards);

    if (gameOver) {
        if (dealerTotal > 21) {
            dealerTotalEl.innerHTML = `<span class="bust">BUST</span>`;
        } else if (dealerTotal === 21 && dealerCards.length === 2) {
            dealerTotalEl.innerHTML = `<span class="blackjack">BJ</span>`;
        } else {
            dealerTotalEl.textContent = dealerTotal;
        }
    } else {
        dealerTotalEl.textContent = '';
    }

    if (playerTotal > 21) {
        playerTotalEl.innerHTML = `<span class="bust">BUST</span>`;
    } else if (playerTotal === 21 && playerCards.length === 2) {
        playerTotalEl.innerHTML = `<span class="blackjack">BJ</span>`;
    } else {
        playerTotalEl.textContent = playerTotal;
    }

    return playerTotal;
}

async function hit() {
    if (gameOver || isAnimating) return;

    isAnimating = true;
    playerCards.push(drawCard());
    renderCards(false, 'player');
    const playerTotal = updateTotals();

    if (playerTotal >= 21) {
        await sleep(500);
        if (playerTotal === 21) {
            await stand();
        } else {
            endGame(false);
        }
    }

    isAnimating = false;
}

async function stand() {
    if (gameOver || isAnimating) return;

    gameOver = true;
    isAnimating = true;
    messageEl.textContent = "Rickyy is playing...";

    renderCards(true);
    updateTotals();
    await sleep(1000);

    await dealerPlay();
    isAnimating = false;
}

async function double() {
    if (gameOver || isAnimating) return;
    if (playerCards.length !== 2) return;

    isAnimating = true;
    playerCards.push(drawCard());
    renderCards(false, 'player');
    updateTotals();
    await sleep(500);
    await stand();
    isAnimating = false;
}

async function dealerPlay() {
    let dealerTotal = calculateTotal(dealerCards);

    while (dealerTotal < 17) {
        dealerCards.push(drawCard());
        renderCards(false, 'dealer');
        dealerTotal = calculateTotal(dealerCards);
        updateTotals();
        await sleep(1000);
    }

    await sleep(500);
    determineWinner();
}

function determineWinner() {
    const playerTotal = calculateTotal(playerCards);
    const dealerTotal = calculateTotal(dealerCards);

    let playerWins = false;

    if (playerTotal > 21) {
        playerWins = false;
    } else if (dealerTotal > 21) {
        playerWins = true;
    } else if (playerTotal > dealerTotal) {
        playerWins = true;
    } else if (playerTotal === dealerTotal) {
        messageEl.textContent = "PUSH";
        showResult("Push!", "It's a tie!");
        playBtn.disabled = false;
        return;
    } else {
        playerWins = false;
    }

    endGame(playerWins);
}

function endGame(playerWins) {
    gameOver = true;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    playBtn.disabled = false;

    updateTotals();

    if (playerWins) {
        messageEl.textContent = "YOU WIN!";
        showResult("You Defeated Rickyy", "Congratulations!");
    } else {
        messageEl.textContent = "YOU LOSE!";
        showResult("You Lost!", "Rickyy wins this time!");
    }
}

function showResult(title, subtitle) {
    resultTitle.textContent = title;
    resultSubtitle.textContent = subtitle;
    resultPopup.style.display = 'block';
    resultOverlay.style.display = 'block';
}

window.onload = initGame;

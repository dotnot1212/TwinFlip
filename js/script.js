// ------------------ تنظیمات اولیه بازی ------------------
const totalIcons = 30;
const TOTAL_PAIRS = 8;

function getRandomIcons() {
  let availableIcons = Array.from(
    { length: totalIcons },
    (_, i) => `icons/${i + 1}.png`
  );
  availableIcons.sort(() => Math.random() - 0.5);
  return availableIcons.slice(0, 8);
}

function preloadIcons(icons) {
  icons.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

const selectedIcons = getRandomIcons();
preloadIcons(selectedIcons);

let cardsArray = selectedIcons.flatMap((icon) => [icon, icon]);

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

// ------------------ متغیرهای وضعیت بازی ------------------
let cards = [];
let flippedCards = [];
let matchedCards = [];
let errors = 0;
let correct = 0;
let pairsLeft = TOTAL_PAIRS;
let timer;
let time = 0;
let gameInProgress = false;
let coins = parseInt(localStorage.getItem("coins")) || 0;
let doubleCoinsActive = false; // وضعیت دو برابر شدن سکه‌ها
let doubleCoinsTimeout; // تایمر برای غیرفعال کردن دو برابر شدن

// المان‌های DOM
const gameBoard = document.querySelector(".game-board");
const timeDisplay = document.getElementById("time");
const errorsDisplay = document.getElementById("errors");
const correctDisplay = document.getElementById("correct");
const pairsLeftDisplay = document.getElementById("pairs-left");
const coinsDisplay = document.getElementById("coins");
const resetButton = document.getElementById("reset");
const reloadButton = document.getElementById("reload");
const greenLight = document.querySelector(".green-light");
const yellowLight = document.querySelector(".yellow-light");
const redLight = document.querySelector(".red-light");
const lights = document.querySelectorAll(".lights-group .light-item");
const hintButton = document.getElementById("hint");
const extraTimeButton = document.getElementById("extra-time");
const doubleCoinsButton = document.getElementById("double-coins"); // دکمه جدید

// قیمت گزینه‌های کمکی
const HINT_COST = 50;
const EXTRA_TIME_COST = 30;
const DOUBLE_COINS_COST = 70; // قیمت برای Double Coins

function shouldShowLights() {
  return window.innerWidth >= 576;
}

// ------------------ توابع بازی ------------------

function initBoard() {
  cards = shuffle([...cardsArray]);
  gameBoard.innerHTML = "";
  flippedCards = [];
  matchedCards = [];
  errors = 0;
  correct = 0;
  pairsLeft = TOTAL_PAIRS;
  time = 0;
  gameInProgress = false;
  doubleCoinsActive = false; // ریست وضعیت دو برابر شدن
  clearTimeout(doubleCoinsTimeout); // حذف تایمر قبلی
  updateUI();

  cards.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("col", "card", "bg-transparent");
    cardElement.setAttribute("data-index", index);
    cardElement.innerHTML = `
      <div class="card-inner">
        <div class="card-front">?</div>
        <div class="card-back"></div>
      </div>
    `;
    gameBoard.appendChild(cardElement);
    cardElement.addEventListener("click", () =>
      flipCard(cardElement, card, index)
    );
  });
}

function startGame() {
  gameInProgress = true;
  time = 60;
  timeDisplay.textContent = time;
  clearInterval(timer);
  timer = setInterval(() => {
    if (gameInProgress) {
      time--;
      timeDisplay.textContent = time;
      if (time <= 0) {
        clearInterval(timer);
        gameInProgress = false;
        alert("زمان تمام شد!");
        setTimeout(() => {
          initBoard();
          document.querySelector(".overlay").style.display = "flex";
        }, 500);
      }
    }
  }, 1000);
}

function updateUI() {
  errorsDisplay.textContent = errors;
  correctDisplay.textContent = correct;
  pairsLeftDisplay.textContent = `${pairsLeft}/${TOTAL_PAIRS}`;
  coinsDisplay.textContent = coins;
  localStorage.setItem("coins", coins);
  updateHelpButtons();
}

function flipCard(cardElement, card, index) {
  if (
    !gameInProgress ||
    flippedCards.length >= 2 ||
    matchedCards.includes(cardElement) ||
    flippedCards.some((c) => c.index === index)
  ) {
    return;
  }

  cardElement.classList.add("flipped");
  const cardBack = cardElement.querySelector(".card-back");
  cardBack.innerHTML = `<img src="${card}" alt="icon" class="card-img">`;
  cardBack.classList.add("revealed");

  flippedCards.push({ cardElement, card, index });

  if (flippedCards.length === 1 && shouldShowLights()) {
    lights.forEach((light) => {
      if (light.classList.contains("active")) {
        light.classList.remove("active");
      }
    });
    yellowLight.classList.add("active");
  }
  if (flippedCards.length === 2) {
    if (shouldShowLights()) {
      yellowLight.classList.remove("active");
    }
    checkMatch();
  }
}

function checkMatch() {
  const [firstCard, secondCard] = flippedCards;

  if (firstCard.card === secondCard.card) {
    matchedCards.push(firstCard.cardElement, secondCard.cardElement);
    firstCard.cardElement.classList.add("matched");
    secondCard.cardElement.classList.add("matched");

    if (shouldShowLights()) {
      lights.forEach((light) => {
        if (light.classList.contains("active")) {
          light.classList.remove("active");
        }
      });
      greenLight.classList.add("active");
      setTimeout(() => greenLight.classList.remove("active"), 2500);
    }

    correct++;
    pairsLeft--;
    coins += doubleCoinsActive ? 20 : 10; // اگر دو برابر فعال باشه 20 سکه، иначе 10
    updateUI();
    flippedCards = [];

    if (pairsLeft === 0) {
      setTimeout(() => {
        alert("🎉 تبریک! شما بازی را بردید! 🎉");
        initBoard();
        document.querySelector(".overlay").style.display = "flex";
        clearInterval(timer);
      }, 500);
    }
  } else {
    errors++;
    if (shouldShowLights()) {
      lights.forEach((light) => {
        if (light.classList.contains("active")) {
          light.classList.remove("active");
        }
      });
      redLight.classList.add("active");
      setTimeout(() => redLight.classList.remove("active"), 2500);
    }

    const allCards = document.querySelectorAll(".card");
    allCards.forEach((card) => card.classList.add("shake"));

    setTimeout(() => {
      allCards.forEach((card) => card.classList.remove("shake"));
      firstCard.cardElement.classList.remove("flipped");
      secondCard.cardElement.classList.remove("flipped");
      firstCard.cardElement.querySelector(".card-back").innerHTML = "";
      secondCard.cardElement.querySelector(".card-back").innerHTML = "";
      flippedCards = [];
      updateUI();
    }, 1000);
  }
}

// ------------------ توابع گزینه‌های کمکی ------------------

function updateHelpButtons() {
  hintButton.disabled = coins < HINT_COST;
  extraTimeButton.disabled = coins < EXTRA_TIME_COST;
  doubleCoinsButton.disabled = coins < DOUBLE_COINS_COST || doubleCoinsActive; // غیرفعال اگه قبلاً فعال باشه
}

function useHint() {
  if (coins < HINT_COST || flippedCards.length > 0) return;
  coins -= HINT_COST;

  const unmatchedCards = cards
    .map((card, index) => ({ card, index }))
    .filter((c) => !matchedCards.includes(gameBoard.children[c.index]));
  const firstCard = unmatchedCards.find((c) =>
    unmatchedCards.some((other) => other.card === c.card && other.index !== c.index)
  );
  const secondCard = unmatchedCards.find(
    (c) => c.card === firstCard.card && c.index !== firstCard.index
  );

  const card1 = gameBoard.children[firstCard.index];
  const card2 = gameBoard.children[secondCard.index];
  card1.classList.add("flipped");
  card2.classList.add("flipped");
  card1.querySelector(".card-back").innerHTML = `<img src="${firstCard.card}" alt="icon" class="card-img">`;
  card2.querySelector(".card-back").innerHTML = `<img src="${secondCard.card}" alt="icon" class="card-img">`;

  setTimeout(() => {
    if (!matchedCards.includes(card1)) {
      card1.classList.remove("flipped");
      card1.querySelector(".card-back").innerHTML = "";
    }
    if (!matchedCards.includes(card2)) {
      card2.classList.remove("flipped");
      card2.querySelector(".card-back").innerHTML = "";
    }
    updateUI();
  }, 2000);
}

function useExtraTime() {
  if (coins < EXTRA_TIME_COST) return;
  coins -= EXTRA_TIME_COST;
  time += 10;
  timeDisplay.textContent = time;
  updateUI();
}

function useDoubleCoins() {
  if (coins < DOUBLE_COINS_COST || doubleCoinsActive) return;
  coins -= DOUBLE_COINS_COST;
  doubleCoinsActive = true;
  doubleCoinsButton.classList.add("active"); // افزودن کلاس برای نمایش فعال بودن (اختیاری)

  doubleCoinsTimeout = setTimeout(() => {
    doubleCoinsActive = false;
    doubleCoinsButton.classList.remove("active"); // حذف کلاس بعد از اتمام
    updateUI();
  }, 10000); // 10 ثانیه

  updateUI();
}

// ------------------ رویدادها ------------------

resetButton.addEventListener("click", () => {
  clearInterval(timer);
  initBoard();
  document.querySelector(".overlay").style.display = "flex";
});

reloadButton.addEventListener("click", () => location.reload());

const playButton = document.querySelector(".overlay button");
playButton.addEventListener("click", () => {
  document.querySelector(".overlay").style.display = "none";
  startGame();
});

const themeToggleBtn = document.querySelector("#themeToggle");
themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
});

hintButton.addEventListener("click", useHint);
extraTimeButton.addEventListener("click", useExtraTime);
doubleCoinsButton.addEventListener("click", useDoubleCoins); // رویداد جدید

function setTheme(theme) {
  const themeToggleBtn = document.getElementById("themeToggle");
  const icon = themeToggleBtn.querySelector("i");
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  } else {
    document.body.classList.remove("dark-mode");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  }
  localStorage.setItem("theme", theme);
}

initBoard();

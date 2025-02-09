// تعداد کل آیکون‌ها در پوشه icons/
const totalIcons = 30;

// تابعی که به‌صورت تصادفی ۸ آیکون از بین ۳۰ آیکون انتخاب می‌کند
function getRandomIcons() {
  let availableIcons = Array.from(
    { length: totalIcons },
    (_, i) => `icons/${i + 1}.png`
  );
  availableIcons.sort(() => Math.random() - 0.5); // تصادفی‌سازی لیست
  return availableIcons.slice(0, 8); // گرفتن ۸ آیکون اول
}

// =====================
// **بخش پیش‌بارگذاری آیکون‌ها (Preload)**
// =====================
function preloadIcons(icons) {
  icons.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// انتخاب آیکون‌ها به‌صورت تصادفی
const selectedIcons = getRandomIcons();

// پیش‌بارگذاری آیکون‌های انتخاب‌شده
preloadIcons(selectedIcons);

// تولید آرایه کارت‌ها (هر آیکون دوبار تکرار می‌شود)
let cardsArray = selectedIcons.flatMap((icon) => [icon, icon]);

// تابع شافل با الگوریتم Fisher-Yates
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

// متغیرهای وضعیت بازی
let cards = []; // آرایه شافل‌شده کارت‌ها
let flippedCards = []; // کارت‌های در حال نمایش
let matchedCards = []; // کارت‌های تطبیق داده شده
let errors = 0; // تعداد خطاها
let correct = 0; // تعداد تطبیق‌ها
let pairsLeft = 8; // تعداد جفت‌های باقی‌مانده
let timer; // تایمر بازی
let time = 0; // زمان گذشته
let gameInProgress = false; // وضعیت بازی

// المان‌های DOM
const gameBoard = document.querySelector(".game-board");
const timeDisplay = document.getElementById("time");
const errorsDisplay = document.getElementById("errors");
const correctDisplay = document.getElementById("correct");
const pairsLeftDisplay = document.getElementById("pairs-left");
const resetButton = document.getElementById("reset");
const reloadButton = document.getElementById("reload");

// تابع برای چیدن کارت‌ها بدون شروع بازی
function initBoard() {
  cards = shuffle([...cardsArray]);
  gameBoard.innerHTML = "";
  flippedCards = [];
  matchedCards = [];
  errors = 0;
  correct = 0;
  pairsLeft = 8;
  time = 0;
  gameInProgress = false; // بازی هنوز شروع نشده
  updateUI();

  // ایجاد و چیدن کارت‌ها
  cards.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("col", "card");
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

// تابع شروع بازی (فعال کردن بازی و شروع تایمر)
function startGame() {
  gameInProgress = true;
  time = 60; // تنظیم زمان شروع به ۶۰ ثانیه
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
        // ریست بازی پس از اتمام زمان (می‌تونی اینجا تغییرات دلخواهت رو اعمال کنی)
        setTimeout(() => {
          initBoard();
          document.querySelector(".overlay").style.display = "flex";
        }, 500);
      }
    }
  }, 1000);
}

// بروزرسانی اطلاعات UI
function updateUI() {
  errorsDisplay.textContent = errors;
  correctDisplay.textContent = correct;
  pairsLeftDisplay.textContent = pairsLeft;
}

// تابع فلیپ کردن کارت
function flipCard(cardElement, card, index) {
  // اگر بازی شروع نشده یا دو کارت در حال نمایش هستند، کاری انجام نده
  if (
    !gameInProgress ||
    flippedCards.length >= 2 ||
    matchedCards.includes(cardElement) ||
    flippedCards.some((c) => c.index === index)
  ) {
    return;
  }

  cardElement.classList.add("flipped");

  // نمایش تصویر روی کارت
  const cardBack = cardElement.querySelector(".card-back");
  cardBack.innerHTML = `<img src="${card}" alt="icon" class="card-img">`;

  flippedCards.push({ cardElement, card, index });

  if (flippedCards.length === 2) {
    checkMatch();
  }
}

// بررسی تطبیق کارت‌ها

function checkMatch() {
  const [firstCard, secondCard] = flippedCards;

  if (firstCard.card === secondCard.card) {
    // در صورت تطبیق
    matchedCards.push(firstCard.cardElement, secondCard.cardElement);
    firstCard.cardElement.classList.add("matched");
    secondCard.cardElement.classList.add("matched");

    correct++;
    pairsLeft--;
    updateUI();
    flippedCards = [];

    if (pairsLeft === 0) {
      setTimeout(() => {
        alert("🎉 تبریک! شما بازی را بردید! 🎉");
        initBoard();
        startGame(); // شروع بازی جدید بلافاصله
        document.querySelector(".overlay").style.display = "flex";
        clearInterval(timer);
      }, 500);
    }
  } else {
    // در صورت انتخاب اشتباه
    errors++;

    // اضافه کردن افکت لرزش به تمام کارت‌ها
    const allCards = document.querySelectorAll(".card");
    allCards.forEach((card) => card.classList.add("shake"));

    // پس از ۱ ثانیه، افکت لرزش حذف شده و کارت‌های اشتباه برگردانده می‌شوند
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

// رویداد دکمه Reset: ریست بازی و نمایش دوباره overlay
resetButton.addEventListener("click", () => {
  clearInterval(timer);
  initBoard();
  document.querySelector(".overlay").style.display = "flex";
});

// رویداد دکمه Reload: بارگذاری مجدد صفحه
reloadButton.addEventListener("click", () => location.reload());

// رویداد کلیک بر روی دکمه Play در overlay
const playButton = document.querySelector(".overlay button");
playButton.addEventListener("click", () => {
  // پنهان کردن overlay
  document.querySelector(".overlay").style.display = "none";
  // شروع بازی (فعال شدن بازی و تایمر)
  startGame();
});

const themeToggleBtn = document.querySelector('#themeToggle')
// اصلاح بخش رویداد کلیک
themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
});

// تابع اصلاح شده setTheme
function setTheme(theme) {
  const themeToggleBtn = document.getElementById("themeToggle");
  const icon = themeToggleBtn.querySelector('i');
  
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  } else {
    document.body.classList.remove("dark-mode");
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }
  localStorage.setItem("theme", theme);
}

// هنگام لود صفحه، کارت‌ها چیده می‌شوند اما بازی شروع نیست
initBoard();

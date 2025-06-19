const canvas = document.getElementById("wheel"),
      ctx = canvas.getContext("2d"),
      nameInput = document.getElementById("name-input"),
      spinBtn = document.getElementById("spin"),
      winnerNameEl = document.getElementById("winner-name"),
      winnerDisplayEl = document.getElementById("winner-name-display"),
      winModal = document.getElementById("winner-modal"),
      closeModal = document.getElementById("close-modal"),
      removeWinner = document.getElementById("remove-winner"),
      resetBtn = document.getElementById("reset-names"),
      toggleDark = document.getElementById("toggle-dark"),
      spinSound = document.getElementById("spin-sound"),
      winSound = document.getElementById("win-sound"),
      forceToggle = document.getElementById("force-winner-toggle");

let names = [];
let startAngle = 0, spinVel = 0, spinning = false, frame;
let selectedVoice = null;

function setVoice() {
  const voices = window.speechSynthesis.getVoices();
  selectedVoice = voices.find(voice =>
    voice.name.includes("Google UK English Female") ||
    voice.name.includes("Microsoft Zira") ||
    voice.name.includes("Neelam") ||
    voice.name.toLowerCase().includes("female")
  );
}
window.speechSynthesis.onvoiceschanged = setVoice;

function drawWheel() {
  const N = names.length || 6;
  const arc = 2 * Math.PI / N;
  const radius = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < N; i++) {
    const angle = startAngle + i * arc;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 10, angle, angle + arc);
    ctx.fillStyle = `hsl(${i * 360 / N}, 70%, 80%)`;
    ctx.fill();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "bold 18px sans-serif";
    const label = names[i] || " ";
    ctx.fillText(label.length > 15 ? label.slice(0, 12) + '…' : label, radius - 20, 10);
    ctx.restore();
  }
}

function spin() {
  if (spinning || names.length === 0) return;
  spinVel = Math.random() * 0.3 + 0.25;
  if (spinSound) spinSound.play();
  spinning = true;
  rotate();
}

function rotate() {
  spinVel *= 0.985;
  startAngle += spinVel;
  drawWheel();
  if (spinVel > 0.002) {
    frame = requestAnimationFrame(rotate);
  } else {
    cancelAnimationFrame(frame);
    spinning = false;
    showWinner();
  }
}

function showWinner() {
  let winner;
  if (forceToggle.checked) {
    winner = names[0];
  } else {
    const arc = 2 * Math.PI / names.length;
    const angle = (2 * Math.PI - (startAngle % (2 * Math.PI))) % (2 * Math.PI);
    const index = Math.floor(angle / arc);
    winner = names[index];
  }

  winnerNameEl.textContent = winner || "No one";
  winnerDisplayEl.textContent = winner || "--";
  winModal.style.display = "flex";

  if (typeof confetti === "function") {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
  }

  if (winSound) winSound.play();

  if (winner) {
    const msg = new SpeechSynthesisUtterance(`The winner is ${winner}`);
    msg.pitch = 1.2;
    msg.rate = 1;
    msg.volume = 1;
    if (selectedVoice) msg.voice = selectedVoice;
    speechSynthesis.speak(msg);
  }
}

nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const val = nameInput.value.trim();
    if (val && !names.includes(val)) {
      names.push(val);
      nameInput.value = "";
      drawWheel();
    }
  }
});

closeModal.onclick = () => winModal.style.display = "none";

removeWinner.onclick = () => {
  const winner = winnerNameEl.textContent;
  names = names.filter(n => n !== winner);
  drawWheel();
  winModal.style.display = "none";
  winnerDisplayEl.textContent = "--";
};

toggleDark.onclick = () => document.body.classList.toggle("dark");

resetBtn.onclick = () => {
  names = [];
  drawWheel();
  winnerDisplayEl.textContent = "--";
};

const emojiToggle = document.querySelector(".emoji-toggle");
forceToggle.addEventListener("change", () => {
  emojiToggle.textContent = "🎯";
});

// ✅ Touch swipe
let touchStartX = 0;
canvas.addEventListener("touchstart", (e) => {
  if (spinning) return;
  touchStartX = e.touches[0].clientX;
});
canvas.addEventListener("touchend", (e) => {
  if (spinning) return;
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchEndX - touchStartX;
  if (Math.abs(diff) > 50) {
    spin();
  }
});

// ✅ Tap to spin (wheel + logo)
canvas.addEventListener("click", () => {
  if (!spinning) spin();
});
document.getElementById("wheel-center-logo").addEventListener("click", (e) => {
  e.stopPropagation();
  if (!spinning) spin();
});
document.getElementById("wheel-center-logo").addEventListener("touchstart", (e) => {
  e.stopPropagation();
  if (!spinning) spin();
});

drawWheel();

// ===== ตัวช่วย =====
const $ = (id) => document.getElementById(id);

// แปลงเลขไทยเป็นเลขอารบิก เช่น ๔ → 4
const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
const toArabicDigits = (text) => text.replace(/[๐-๙]/g, (d) => THAI_DIGITS.indexOf(d));

// ทำให้ข้อความเทียบกันง่ายขึ้น:
// NFKC รวมรูปสระ "ำ" ที่พิมพ์แยกให้เป็นตัวเดียวกัน, แปลงเลขไทย, ตัดช่องว่าง, แปลงเป็นตัวเล็ก
const normalize = (text) =>
  toArabicDigits(text.normalize('NFKC')).replace(/\s/g, '').toLowerCase();

// ข้อความที่ขึ้นเมื่อพิมพ์คำต้องห้าม (ไม่นับเป็นตอบผิด)
const BANNED_REPLY = '🤮';

const STEP_IDS = [
  'step-love',
  'step-date',
  'step-q1',
  'step-q2',
  'step-q3',
  'step-q4',
  'step-q5',
  'step-final',
  'step-fail',
  'step-ngo',
  'step-ask',
  'step-forgiven',
];
const COUNTER_STEPS = ['step-date', 'step-q1', 'step-q2', 'step-q3', 'step-q4', 'step-q5'];

const MAX_WRONG = 10;
let wrongCount = 0;

const counterEl = $('counter');

// ===== คำต้องห้าม: ถ้าพิมพ์คำเหล่านี้ จะขึ้น BANNED_REPLY (ไม่นับเป็นตอบผิด) =====
const BANNED_WORDS = [
  'คนเก่า',
  'เนย',
  'ไอโฟน',
  'มินนี่',
  'แฟนเก่า',
  'เมียเก่า',
  'มินิ',
  'วัตถุโบราณ',
  'ชู้',
  'กิ๊ก',
  'ซ้อม',
  'ตี' ,
  'ตบ' ,
  'ต่อย' ,
  'รุนแรง' ,
].map(normalize);

function isBanned(text) {
  const t = normalize(text);
  return BANNED_WORDS.some((word) => t.includes(word));
}

// ===== ตรวจคำตอบ =====
// - ถ้ามี "ไม่" ในคำตอบ ถือว่าไม่ผ่านเสมอ (กันพวก "ไม่กลัวงู", "ไม่ชอบเขียนโค้ด")
// - exact = true ต้องตรงทั้งคำ, exact = false แค่มีคีย์อยู่ในคำตอบก็ผ่าน
function isCorrect(raw, keys, exact = false) {
  const answer = normalize(raw);
  if (answer.includes('ไม่')) return false;
  return exact ? keys.includes(answer) : keys.some((key) => answer.includes(key));
}

// ===== สลับหน้า =====
function showStep(id) {
  STEP_IDS.forEach((s) => $(s).classList.toggle('active', s === id));
  counterEl.classList.toggle('hidden', !COUNTER_STEPS.includes(id));
}

function updateCounter() {
  counterEl.textContent = `ตอบผิด ${wrongCount}/${MAX_WRONG} ครั้ง`;
}

// ===== ตรวจวันที่ (วัน/เดือน ไม่ต้องใส่ปี) =====
// รองรับ 17/08, 17-8, 17.08 และ 17 8
function parseDate(text) {
  const t = toArabicDigits(text.trim());

  const parts = t.split(/[\/\-.\s]+/);
  if (parts.length !== 2 || parts.some((p) => p === '')) return null;

  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isInteger(n))) return null;

  const [day, month] = nums;
  return { day, month };
}

// วันเกิด 17/08
function isBirthdayCorrect(text) {
  const d = parseDate(text);
  return !!d && d.day === 17 && d.month === 8;
}

// วันครบรอบ 13/03 หรือ 14/03
function isAnniversaryCorrect(text) {
  const d = parseDate(text);
  return !!d && (d.day === 13 || d.day === 14) && d.month === 3;
}

// ===== ข้อความใต้ช่องคำตอบ =====
// แสดงข้อความพร้อมแอนิเมชันสั่น
function showMsg(msgId, text) {
  const el = $(msgId);
  el.textContent = text;
  el.classList.remove('shake');
  void el.offsetWidth; // รีเซ็ตแอนิเมชันให้เล่นซ้ำได้
  el.classList.add('shake');
}

function clearMsg(msgId) {
  const el = $(msgId);
  el.textContent = '';
  el.classList.remove('shake');
}

// ตอบผิด: นับจำนวน ถ้าเกินที่กำหนดให้ไปหน้าแพ้
function markWrong(msgId, text) {
  wrongCount++;
  updateCounter();

  if (wrongCount > MAX_WRONG) {
    showStep('step-fail');
    return;
  }
  showMsg(msgId, text);
}

// ===== หัวใจลอยพื้นหลัง =====
const HEARTS = ['💗', '💖', '💕', '💞', '🌸', '💘'];
const randomHeart = () => HEARTS[Math.floor(Math.random() * HEARTS.length)];
const heartsLayer = $('hearts');

function spawnFloatingHeart() {
  const h = document.createElement('span');
  h.className = 'float-heart';
  h.textContent = randomHeart();
  h.style.left = `${Math.random() * 100}%`;
  h.style.fontSize = `${14 + Math.random() * 22}px`;
  h.style.animationDuration = `${6 + Math.random() * 6}s`;
  heartsLayer.appendChild(h);
  setTimeout(() => h.remove(), 12000);
}

// หัวใจพุ่งกระจายออกจากกลางจอ
function burstHearts(count = 30) {
  for (let i = 0; i < count; i++) {
    const h = document.createElement('span');
    h.className = 'burst-heart';
    h.textContent = randomHeart();

    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 180;
    h.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
    h.style.setProperty('--y', `${Math.sin(angle) * dist}px`);

    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }
}

// ===== ขั้นที่ 1: รักแฟนไหม =====
const btnYes = $('btn-yes');
const btnNo = $('btn-no');
const sadMsg = $('sad-msg');
const btnSure = $('btn-sure');

const NO_START = 20; // ขนาดฟอนต์เริ่มต้นของปุ่ม "ไม่รัก" (px)
const NO_MIN = 10; // ขนาดที่เล็กที่สุด (px)
const NO_STEP = 2; // ลดทีละกี่ px ต่อการกด
let noSize = NO_START;

btnYes.addEventListener('click', () => {
  burstHearts(40);
  showStep('step-date');
});

btnNo.addEventListener('click', () => {
  // ยังไม่เล็กที่สุด ให้ลดขนาดปุ่มลงและขยายปุ่ม "รัก" ขึ้นเล็กน้อย
  if (noSize > NO_MIN) {
    noSize -= NO_STEP;
    btnNo.style.fontSize = `${noSize}px`;
    btnYes.style.transform = `scale(${1 + (NO_START - noSize) * 0.03})`;
    return;
  }

  // เล็กที่สุดแล้ว ซ่อนปุ่มและแสดงข้อความ
  btnNo.classList.add('hidden');
  sadMsg.textContent = 'ม่ายร้ากกานแย้วหยออ🥺';
  sadMsg.classList.add('show');
  btnSure.classList.remove('hidden');
});

// ===== ขั้นที่ 2: วันเกิดและวันครบรอบ =====
$('btn-date').addEventListener('click', () => {
  const birthday = $('birthday').value;
  const anniversary = $('anniversary').value;

  if (!birthday.trim() || !anniversary.trim()) {
    showMsg('msg-date', 'กรอกห้ายครบบบๆ');
    return;
  }

  if (isBanned(birthday) || isBanned(anniversary)) {
    showMsg('msg-date', BANNED_REPLY);
    return;
  }

  if (isBirthdayCorrect(birthday) && isAnniversaryCorrect(anniversary)) {
    clearMsg('msg-date');
    showStep('step-q1');
  } else {
    markWrong('msg-date', 'ลองอีกทีนะคะะ 🥹');
  }
});

// ===== ขั้นที่ 3: เค้าชอบกินอะไร =====
const FOOD_KEYS = ['เย็นตาโฟ', 'เมีย', 'แฟน', 'เด่ก'].map(normalize);

$('btn-q1').addEventListener('click', () => {
  const raw = $('food').value;

  if (!normalize(raw)) {
    showMsg('msg-q1', 'พิมพ์ก่อนค้าบบ');
    return;
  }

  if (isBanned(raw)) {
    showMsg('msg-q1', BANNED_REPLY);
    return;
  }

  if (isCorrect(raw, FOOD_KEYS)) {
    clearMsg('msg-q1');
    showStep('step-q2');
  } else {
    markWrong('msg-q1', 'ลองอีกทีค้าบบ');
  }
});

// ===== ขั้นที่ 4: เค้าชอบทำอะไร =====
const HOBBY_KEYS = [
  'โค้ด',
  'เขียนโปรแกรม',
  'เขียนโค้ด',
  'ชักว่าว',
  'โฟกัส',
  'แฟน',
  'ซ้อมเทควันโด',
  'เทควันโด',
  'เด่ก',
  'อ้วน',
  'อ้วง',
  'เมีย',
  'ทำคอม',
  'ซ้อมคอม',
  'คอม' ,
].map(normalize);

$('btn-q2').addEventListener('click', () => {
  const raw = $('hobby').value;

  if (!normalize(raw)) {
    showMsg('msg-q2', 'พิมพ์ก่อนน้าาา');
    return;
  }

  if (isBanned(raw)) {
    showMsg('msg-q2', BANNED_REPLY);
    return;
  }

  if (isCorrect(raw, HOBBY_KEYS)) {
    clearMsg('msg-q2');
    showStep('step-q3');
  } else {
    markWrong('msg-q2', 'ม่ายช่ายยย');
  }
});

// ===== ขั้นที่ 5: เค้ากลัวอะไรมากที่สุด =====
// เทียบทั้งคำ (exact) เพื่อกันคำอย่าง "ผีเสื้อ" หรือ "ปมด้อย" ผ่านโดยบังเอิญ
// ถ้าอยากให้รับ "กลัวงู" เพิ่มเข้าไปในรายการนี้เอง
const FEAR_KEYS = [
  'งู',
  'แมงมุม',
  'แมลงสาบ',
  'มด',
  'ปมด้อย',
  'ผี',
  'แฟนทิ้ง', 
  'เมียทิ้ง', 
  'โฟกัสทิ้ง', 
  'เด่กทิ้ง',
  'เมีย',
  'แฟน' ,
  'เด่ก',
].map(normalize);

$('btn-q3').addEventListener('click', () => {
  const raw = $('fear').value;

  if (!normalize(raw)) {
    showMsg('msg-q3', 'พิมพ์ก่อนค้าบบ');
    return;
  }

  if (isBanned(raw)) {
    showMsg('msg-q3', BANNED_REPLY);
    return;
  }

  if (isCorrect(raw, FEAR_KEYS, true)) {
    clearMsg('msg-q3');
    showStep('step-q4');
  } else {
    markWrong('msg-q3', 'ลองอีกทีนะ 🥹');
  }
});

// ===== ขั้นที่ 6: เค้าเริ่มใส่แว่นตอนไหน =====
const GLASSES_KEYS = ['ป.4', 'ป4', 'ประถม4', 'ประถมศึกษาปีที่4'].map(normalize);

$('btn-q4').addEventListener('click', () => {
  const raw = $('glasses').value;

  if (!normalize(raw)) {
    showMsg('msg-q4', 'พิมพ์ก่อนน้าาา');
    return;
  }

  if (isBanned(raw)) {
    showMsg('msg-q4', BANNED_REPLY);
    return;
  }

  if (isCorrect(raw, GLASSES_KEYS)) {
    clearMsg('msg-q4');
    showStep('step-q5');
  } else {
    markWrong('msg-q4', 'ม่ายช่ายยย');
  }
});

// ===== ขั้นที่ 7: เค้าร้ากเทอม้าย (ปุ่ม ร้าก = ถูก, ไม่ร้าก = ผิด) =====
$('btn-q5-yes').addEventListener('click', () => {
  clearMsg('msg-q5');
  showStep('step-final');
});

$('btn-q5-no').addEventListener('click', () => {
  markWrong('msg-q5', 'เค้าร้ากกกก🥹');
});

// ===== ขั้นสุดท้าย: บอกรักกลับ + นับจำนวนครั้งที่กด =====
const LOVE_TARGET = 20; // ครบจำนวนนี้จะขึ้นข้อความพิเศษ แล้วนับต่อเรื่อยๆ
let loveTaps = 0;

$('btn-love-back').addEventListener('click', () => {
  loveTaps++;

  const msgEl = $('love-back-msg');
  msgEl.classList.add('show');

  if (loveTaps < LOVE_TARGET) {
    msgEl.textContent = ` ${loveTaps}/${LOVE_TARGET}💗`;
    burstHearts(10);
  } else {
    msgEl.textContent = `ร้ากเทอที่ฉุดนายโลกเยยย 💞 ${loveTaps} ครั้ง`;
    burstHearts(25);
  }
});

// ===== ทางเลือก "ช่าย" → หน้าง้อ 100 ครั้ง → ร้ากหม้าย → หายงอน =====
const NGO_TARGET = 100; // ต้องง้อให้ครบจำนวนนี้
let ngoTaps = 0;

function updateNgoCount() {
  $('ngo-count').textContent = `ง้อไปแล้ว ${ngoTaps}/${NGO_TARGET} ครั้ง`;
}

btnSure.addEventListener('click', () => {
  showStep('step-ngo');
});

$('btn-ngo').addEventListener('click', () => {
  ngoTaps++;
  updateNgoCount();

  if (ngoTaps >= NGO_TARGET) {
    showStep('step-ask');
  } else {
    burstHearts(3);
  }
});

$('btn-ask-yes').addEventListener('click', () => {
  showStep('step-forgiven');
  burstHearts(40);
});

// กลับไปหน้าแรก และรีเซ็ตทุกอย่าง
$('btn-back').addEventListener('click', () => resetAll());

// ===== เริ่มใหม่ =====
function resetAll() {
  wrongCount = 0;
  updateCounter();
  loveTaps = 0;

  ngoTaps = 0;
  updateNgoCount();
  btnSure.classList.add('hidden');

  noSize = NO_START;
  btnNo.style.fontSize = '';
  btnNo.classList.remove('hidden');
  btnYes.style.transform = '';

  sadMsg.textContent = '';
  sadMsg.classList.remove('show');
  $('love-back-msg').textContent = '';
  $('love-back-msg').classList.remove('show');

  ['birthday', 'anniversary', 'food', 'hobby', 'fear', 'glasses'].forEach((id) => {
    $(id).value = '';
  });
  ['msg-date', 'msg-q1', 'msg-q2', 'msg-q3', 'msg-q4', 'msg-q5'].forEach(clearMsg);

  showStep('step-love');
}

$('btn-restart').addEventListener('click', resetAll);

// กด Enter ในช่องกรอกเพื่อส่งคำตอบได้เลย
[
  ['birthday', 'btn-date'],
  ['anniversary', 'btn-date'],
  ['food', 'btn-q1'],
  ['hobby', 'btn-q2'],
  ['fear', 'btn-q3'],
  ['glasses', 'btn-q4'],
].forEach(([inputId, btnId]) => {
  $(inputId).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $(btnId).click();
  });
});

// ===== เริ่มต้น =====
showStep('step-love');
updateCounter();
setInterval(spawnFloatingHeart, 400);

// ============================================================================
//  FESTIVAL CALENDAR  (West Bengal)
//  The app picks today's festival from this list and shows the greeting by itself.
//
//  HOW TO ADD A FESTIVAL LATER
//  - Festival that falls on a DIFFERENT date every year (Durga Puja, Kali Puja, Eid ...):
//      add one line inside DATED, with the exact date  'YYYY-MM-DD'.
//  - Festival on the SAME date every year (Republic Day, Christmas ...):
//      add one line inside YEARLY, with  md: 'MM-DD'.
//  - days: how many days the greeting stays (default 1).
//  - Dates of lunar festivals come from the West Bengal holiday list. Add next year's
//    dates when that list is published (usually in December).
// ============================================================================

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBnDigits = (n) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

// ---- colour sets: [left, middle, right]  (used for the banner, popup and app background) ----
const RED_GOLD = ['#991b1b', '#ea580c', '#f59e0b'];
const GOLD = ['#92400e', '#d97706', '#fbbf24'];
const TRICOLOUR = ['#c2410c', '#1e3a8a', '#166534'];
const NIGHT_LIGHTS = ['#312e81', '#7c3aed', '#f59e0b'];
const GREEN_GOLD = ['#064e3b', '#047857', '#d4a017'];

// ---------------------------------------------------------------------------
//  Durga Puja: six days, one entry per day.   panchamiDate = the date of Maha Panchami
// ---------------------------------------------------------------------------
function durgaSeries(year, panchamiDate) {
  const days = [
    {
      key: 'panchami',
      bn: 'শুভ মহাপঞ্চমী',
      en: 'Happy Maha Panchami',
      line: 'The countdown is over and Ma Durga is almost here! May her blessings bring joy, strength and good fortune to you and your family.',
      lineBn: 'মা আসছেন! এই পুজোয় আপনার ও আপনার পরিবারের জীবন আনন্দে, শক্তিতে ও সৌভাগ্যে ভরে উঠুক।'
    },
    {
      key: 'shashthi',
      bn: 'শুভ মহাষষ্ঠী',
      en: 'Happy Maha Shashthi',
      line: 'Bodhon begins and the Goddess arrives. Let the sound of the dhaak fill every heart with happiness.',
      lineBn: 'বোধন শুরু, মা দুর্গা এলেন। ঢাকের তালে সবার মন আনন্দে ভরে উঠুক।'
    },
    {
      key: 'saptami',
      bn: 'শুভ মহাসপ্তমী',
      en: 'Happy Maha Saptami',
      line: 'Pujo is in full swing! Wishing you new clothes, good food and lovely pandal-hopping with your loved ones.',
      lineBn: 'পুজো এসে গেছে! নতুন জামা, ভালো খাবার আর প্রিয়জনদের সঙ্গে ঠাকুর দেখার আনন্দে কাটুক সময়।'
    },
    {
      key: 'ashtami',
      bn: 'শুভ মহাষ্টমী',
      en: 'Happy Maha Ashtami',
      line: 'May the blessings of Ma Durga on Ashtami fill your life with courage and peace. Shubho Anjali!',
      lineBn: 'মা দুর্গার আশীর্বাদে আপনার জীবন সাহস ও শান্তিতে ভরে উঠুক। শুভ অঞ্জলি!'
    },
    {
      key: 'navami',
      bn: 'শুভ মহানবমী',
      en: 'Happy Maha Navami',
      line: 'The last full day of Pujo. Enjoy every moment with family and friends.',
      lineBn: 'পুজোর শেষ পূর্ণ দিন। পরিবার ও বন্ধুদের সঙ্গে প্রতিটি মুহূর্ত উপভোগ করুন।'
    },
    {
      key: 'bijoya',
      bn: 'শুভ বিজয়া',
      en: 'Shubho Bijoya',
      days: 4,
      line: 'Wishing you and your family love, joy and blessings. Shubho Bijoya to everyone at Ambica-Hind!',
      lineBn: 'শুভ বিজয়া! বড়দের প্রণাম, ছোটদের ভালোবাসা ও সবাইকে শুভেচ্ছা।'
    }
  ];
  const [y, m, d] = panchamiDate.split('-').map(Number);
  return days.map((x, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const iso = dt.toISOString().slice(0, 10);
    return {
      id: `durga-${x.key}-${year}`,
      date: iso,
      days: x.days || 1,
      bn: x.bn,
      en: x.en,
      line: x.line,
      lineBn: x.lineBn,
      colors: RED_GOLD,
      icon: '🔱',
      particles: ['🌺', '🪔', '✨', '🌸'],
      priority: 10
    };
  });
}

// ---------------------------------------------------------------------------
//  DATED: festivals whose date changes every year
// ---------------------------------------------------------------------------
export const DATED = [
  // ----- Durga Puja -----
  ...durgaSeries(2026, '2026-10-15'),
  ...durgaSeries(2027, '2027-10-04'),

  // ----- Rest of 2026 -----
  {
    id: 'lakshmi-puja-2026',
    date: '2026-10-25',
    bn: 'শুভ কোজাগরী লক্ষ্মীপূজা',
    en: 'Happy Kojagari Lakshmi Puja',
    line: 'May Goddess Lakshmi bless every home and every business with prosperity and good health.',
    lineBn: 'মা লক্ষ্মীর আশীর্বাদে সকলের ঘরে ও কর্মক্ষেত্রে সুখ, সমৃদ্ধি ও সুস্বাস্থ্য বিরাজ করুক।',
    colors: GOLD,
    icon: '🪔',
    particles: ['🌼', '✨', '🪔']
  },
  {
    id: 'kali-puja-2026',
    date: '2026-11-08',
    days: 2,
    bn: 'শুভ কালীপূজা ও দীপাবলি',
    en: 'Happy Kali Puja & Diwali',
    line: 'May the festival of lights drive away darkness and fill our lives with brightness, prosperity and new beginnings.',
    lineBn: 'আলোর উৎসবে সকলের জীবন আলোকিত হোক। কালীপূজা ও দীপাবলির আন্তরিক শুভেচ্ছা।',
    colors: NIGHT_LIGHTS,
    icon: '🪔',
    particles: ['🪔', '✨', '🎆'],
    priority: 8
  },
  {
    id: 'bhai-phonta-2026',
    date: '2026-11-10',
    days: 2,
    bn: 'শুভ ভাইফোঁটা',
    en: 'Happy Bhai Phonta',
    line: 'A day for the special bond between brothers and sisters. Wishing love, health and happiness to all siblings.',
    lineBn: 'ভাই-বোনের ভালোবাসার বন্ধন অটুট থাকুক। সকলকে ভাইফোঁটার শুভেচ্ছা।',
    colors: ['#9d174d', '#db2777', '#fb923c'],
    icon: '🌺',
    particles: ['🌺', '✨', '💫']
  },
  {
    id: 'chhath-2026',
    date: '2026-11-15',
    bn: 'छठ पूजा की हार्दिक शुभकामनाएँ',
    en: 'Happy Chhath Puja',
    line: 'Wishing everyone health, happiness and the blessings of Surya Dev and Chhathi Maiya.',
    lineBn: 'सूर्य देव और छठी मैया की कृपा से सभी के जीवन में सुख, स्वास्थ्य और समृद्धि बनी रहे।',
    colors: ['#9a3412', '#f97316', '#facc15'],
    icon: '🌅',
    particles: ['🌅', '✨', '🌼']
  },
  {
    id: 'jagaddhatri-2026',
    date: '2026-11-18',
    bn: 'শুভ জগদ্ধাত্রী পূজা',
    en: 'Happy Jagaddhatri Puja',
    line: 'Wishing you peace, strength and the blessings of Ma Jagaddhatri.',
    lineBn: 'মা জগদ্ধাত্রীর আশীর্বাদে সবার জীবনে শান্তি ও শক্তি বিরাজ করুক।',
    colors: ['#7c2d12', '#c2410c', '#fbbf24'],
    icon: '🔱',
    particles: ['🌺', '✨', '🪔']
  },
  {
    id: 'guru-nanak-2026',
    date: '2026-11-24',
    bn: 'গুরু নানক জয়ন্তীর শুভেচ্ছা',
    en: 'Happy Guru Nanak Jayanti',
    line: "Wishing everyone peace, kindness and the light of Guru Nanak's teachings.",
    lineBn: 'গুরু নানকের শিক্ষার আলোয় সকলের জীবন শান্তি ও সদ্ভাবনায় ভরে উঠুক।',
    colors: ['#1e3a8a', '#2563eb', '#f59e0b'],
    icon: '🙏',
    particles: ['✨', '🌼', '🙏']
  },

  // ----- 2027 -----
  {
    id: 'saraswati-puja-2027',
    date: '2027-02-11',
    bn: 'শুভ সরস্বতী পূজা',
    en: 'Happy Saraswati Puja',
    line: 'Wishing wisdom, learning and a bright year of growth for everyone.',
    lineBn: 'জ্ঞান, বিদ্যা ও উন্নতির আলোয় সকলের জীবন ভরে উঠুক। শুভ সরস্বতী পূজা!',
    colors: ['#854d0e', '#ca8a04', '#f59e0b'],
    icon: '📚',
    particles: ['🌼', '📚', '✨']
  },
  {
    id: 'eid-ul-fitr-2027',
    date: '2027-03-09', // moon-sighting festival, so the greeting stays for 2 days
    days: 2,
    bn: 'ঈদ মোবারক',
    en: 'Eid Mubarak',
    line: 'Wishing you and your family peace, happiness and countless blessings on Eid.',
    lineBn: 'ঈদের আনন্দে সবার জীবন শান্তি ও সুখে ভরে উঠুক। ঈদ মোবারক!',
    colors: GREEN_GOLD,
    icon: '🌙',
    particles: ['🌙', '⭐', '✨']
  },
  {
    id: 'dol-jatra-2027',
    date: '2027-03-22',
    bn: 'শুভ দোলযাত্রা',
    en: 'Happy Dol Jatra & Holi',
    line: 'May the colours of Holi fill your life with joy and togetherness.',
    lineBn: 'রঙের উৎসবে সকলের জীবন আনন্দে ও ঐক্যে রঙিন হয়ে উঠুক। শুভ দোল!',
    colors: ['#be185d', '#7c3aed', '#f97316'],
    icon: '🎨',
    particles: ['🎨', '🌸', '✨']
  },
  {
    id: 'eid-ul-adha-2027',
    date: '2027-05-16', // moon-sighting festival, so the greeting stays for 2 days
    days: 2,
    bn: 'ঈদ-উল-আজহার শুভেচ্ছা',
    en: 'Eid al-Adha Mubarak',
    line: 'Wishing you a blessed Eid filled with peace, generosity and togetherness.',
    lineBn: 'ত্যাগ ও উদারতার এই উৎসবে সবার জীবন শান্তিতে ভরে উঠুক। ঈদ মোবারক!',
    colors: GREEN_GOLD,
    icon: '🌙',
    particles: ['🌙', '⭐', '✨']
  }
];

// ---------------------------------------------------------------------------
//  YEARLY: same date every year      (md = 'MM-DD')
// ---------------------------------------------------------------------------
export const YEARLY = [
  {
    id: 'new-year',
    md: '01-01',
    bn: 'নতুন বছরের শুভেচ্ছা',
    en: 'Happy New Year',
    line: 'New goals, fresh energy, and a safe and successful year ahead for our entire Ambica-Hind family.',
    lineBn: 'নতুন বছরে নতুন লক্ষ্য, নতুন উদ্যম। আমাদের সকলের জন্য সুস্থ, নিরাপদ ও সাফল্যের বছর হোক।',
    colors: ['#1e1b4b', '#4338ca', '#0ea5e9'],
    icon: '🎉',
    particles: ['🎉', '✨', '🎊']
  },
  {
    id: 'netaji-jayanti',
    md: '01-23',
    bn: 'নেতাজি জয়ন্তী',
    en: 'Netaji Subhas Chandra Bose Jayanti',
    line: "We remember Netaji's courage, discipline and unwavering commitment to the nation.",
    lineBn: 'নেতাজি সুভাষচন্দ্র বসুর জন্মদিনে আমাদের বিনম্র শ্রদ্ধাঞ্জলি।',
    colors: ['#7c2d12', '#c2410c', '#1e3a8a'],
    icon: '🇮🇳',
    particles: ['🇮🇳', '✨']
  },
  {
    id: 'republic-day',
    md: '01-26',
    bn: 'প্রজাতন্ত্র দিবসের শুভেচ্ছা',
    en: 'Happy Republic Day',
    line: 'Proud of our nation and committed to building it, one day of honest work at a time.',
    lineBn: 'দেশের প্রতি দায়বদ্ধতা ও নিষ্ঠার সঙ্গে এগিয়ে চলি। প্রজাতন্ত্র দিবসের আন্তরিক শুভেচ্ছা।',
    colors: TRICOLOUR,
    icon: '🇮🇳',
    particles: ['🇮🇳', '✨', '🎈']
  },
  {
    id: 'poila-boishakh',
    md: '04-15',
    bn: (year) => `শুভ নববর্ষ ${toBnDigits(year - 593)}`,
    en: 'Shubho Noboborsho! Happy Bengali New Year',
    line: 'May the new year bring happiness, peace and prosperity to you and your family.',
    lineBn: 'নতুন বছর আপনার ও আপনার পরিবারের জীবনে সুখ, শান্তি ও সমৃদ্ধি বয়ে আনুক।',
    colors: ['#7f1d1d', '#dc2626', '#f97316'],
    icon: '🪔',
    particles: ['🪔', '🌸', '✨'],
    priority: 8
  },
  {
    id: 'may-day',
    md: '05-01',
    bn: 'মে দিবসের শুভেচ্ছা',
    en: "Happy May Day (Workers' Day)",
    line: 'A salute to every worker whose effort keeps our plants running safe and strong.',
    lineBn: 'আমাদের প্রতিটি কর্মীকে স্যালুট। তাঁদের পরিশ্রমেই কারখানা নিরাপদে ও সক্ষমভাবে চলে।',
    colors: ['#7f1d1d', '#dc2626', '#f59e0b'],
    icon: '🛠️',
    particles: ['🛠️', '⚙️', '✨']
  },
  {
    id: 'rabindra-jayanti',
    md: '05-09',
    bn: 'রবীন্দ্র জয়ন্তীর শুভেচ্ছা',
    en: 'Rabindra Jayanti',
    line: 'Remembering Gurudev Rabindranath Tagore on his birth anniversary (25 Boishakh).',
    lineBn: 'পঁচিশে বৈশাখে কবিগুরু রবীন্দ্রনাথ ঠাকুরকে আমাদের শ্রদ্ধাঞ্জলি।',
    colors: ['#14532d', '#15803d', '#f59e0b'],
    icon: '🪶',
    particles: ['🌼', '✨']
  },
  {
    id: 'independence-day',
    md: '08-15',
    bn: 'স্বাধীনতা দিবসের শুভেচ্ছা',
    en: 'Happy Independence Day',
    line: 'Proud to be Indian. Wishing everyone a day of pride, unity and gratitude.',
    lineBn: 'স্বাধীনতা দিবসের আন্তরিক শুভেচ্ছা। গর্ব, ঐক্য ও কৃতজ্ঞতায় কাটুক আজকের দিন।',
    colors: TRICOLOUR,
    icon: '🇮🇳',
    particles: ['🇮🇳', '🎈', '✨']
  },
  {
    id: 'vishwakarma-puja',
    md: '09-17',
    bn: 'শুভ বিশ্বকর্মা পূজা',
    en: 'Happy Vishwakarma Puja',
    line: 'Wishing safe machines, smooth production and a prosperous year ahead for every team.',
    lineBn: 'নিরাপদ যন্ত্র, মসৃণ উৎপাদন ও সমৃদ্ধির এক বছর হোক আমাদের প্রত্যেক বিভাগের।',
    colors: ['#0c4a6e', '#0369a1', '#f59e0b'],
    icon: '⚙️',
    particles: ['⚙️', '🔧', '✨']
  },
  {
    id: 'gandhi-jayanti',
    md: '10-02',
    bn: 'গান্ধী জয়ন্তী',
    en: 'Gandhi Jayanti',
    line: 'Remembering Mahatma Gandhi on his birth anniversary: truth, non-violence and honest work.',
    lineBn: 'মহাত্মা গান্ধীর জন্মদিনে আমাদের শ্রদ্ধাঞ্জলি। সত্য, অহিংসা ও নিষ্ঠার পথই আমাদের আদর্শ।',
    colors: ['#374151', '#4b5563', '#d97706'],
    icon: '🕊️',
    particles: ['🕊️', '✨']
  },
  {
    id: 'christmas',
    md: '12-25',
    bn: 'শুভ বড়দিন',
    en: 'Merry Christmas',
    line: 'Wishing you joy, peace and warmth this Christmas.',
    lineBn: 'বড়দিনের আন্তরিক শুভেচ্ছা। আনন্দ, শান্তি ও উষ্ণতায় ভরে উঠুক সবার জীবন।',
    colors: ['#991b1b', '#166534', '#b91c1c'],
    icon: '🎄',
    particles: ['❄️', '⭐', '🎄']
  }
];

// ---------------------------------------------------------------------------
//  Helpers (no need to edit below this line)
// ---------------------------------------------------------------------------
const dayNumber = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

// today's date in India, as 'YYYY-MM-DD'
export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

function resolveYearly(f, year) {
  return { ...f, date: `${year}-${f.md}`, bn: typeof f.bn === 'function' ? f.bn(year) : f.bn };
}

function candidates(year) {
  return [...DATED, ...YEARLY.map((f) => resolveYearly(f, year))];
}

// The festival to greet today (or null). Higher "priority" wins when two fall together.
export function getFestivalFor(todayStr) {
  const today = dayNumber(todayStr);
  const year = Number(todayStr.slice(0, 4));
  const active = candidates(year).filter((f) => {
    const start = dayNumber(f.date);
    return today >= start && today < start + (f.days || 1);
  });
  if (!active.length) return null;
  active.sort((a, b) => (b.priority || 5) - (a.priority || 5) || dayNumber(b.date) - dayNumber(a.date));
  return { ...active[0], day: todayStr };
}

// Used by the preview link:  ...?festival=republic-day
export function findFestivalById(id) {
  const year = Number(todayIST().slice(0, 4));
  const f = candidates(year).find((x) => x.id === id);
  return f ? { ...f, day: f.date } : null;
}

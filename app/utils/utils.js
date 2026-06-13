// utils/utils.js

// 📦 فایل utils.js — افزودن توابع مرتبط با تاریخ
import moment from 'moment-jalaali';
import { useAppStore } from '~/store/app'
import { useScreen } from '~/composables/useScreen'


export function getOS() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown'
  }

  const userAgent = navigator.userAgent || navigator.vendor || window.opera

  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone'
  }
  if (/win/i.test(userAgent)) {
    return 'Windows'
  }
  if (/android/i.test(userAgent)) {
    return 'Android'
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS'
  }
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
    return 'macOS'
  }
  if (/Linux/.test(userAgent)) {
    return 'Linux'
  }

  return 'unknown'
}

export function fixNumber(number) {
  const n = number ?? 14;
  const f = Math.floor(n) % 2 === 1 ? Math.floor(n) + 0 : Math.floor(n);
  return f;
}

export function dimension(s) {
  const app = useAppStore();
  const size = !s ? app.settings.mainSize : s;
  return {
    text: {
      label: fixNumber(size * 0.8),
      normal: fixNumber(size),
      description: fixNumber(size * 0.7),
      h1: fixNumber(size * 2.3),
      h2: fixNumber(size * 2),
      h3: fixNumber(size * 1.7),
      h4: fixNumber(size * 1.5),
      h5: fixNumber(size * 1.2),
      h6: fixNumber(size * 1.1),
      body: fixNumber(size * 1),
      div: fixNumber(size * 1),
      p: fixNumber(size * 1),
      a: fixNumber(size * 1),
    },
    header: {
      height: fixNumber(size * 5),
      logo: fixNumber(size * 3),
      title: fixNumber(size * 1.75),
      time: fixNumber(size * 1),
      date: fixNumber(size * 0.7),
      button: fixNumber(size * 1),
    },
    footer: {
      logo: fixNumber(size * 6),
      date: fixNumber(size * 1),
      copyright: fixNumber(size * 0.7),
      powered: fixNumber(size * 0.6),
    },
    page: {
      padding: fixNumber(size * 2),
      gap: fixNumber(size * 2.5),
      icon: fixNumber(size * 5),
      title: fixNumber(size * 2),
      description: fixNumber(size * 1.1),
    },
    login: {
      logo: fixNumber(size * 12),
      title: fixNumber(size * 2),
      description: fixNumber(size * 0.8),
      Input: fixNumber(size * 2),
    },
    navigation: {
      label: fixNumber(size * 1),
      icon: fixNumber(size * 1.25),
    },
    link: {
      icon: fixNumber(size * 1.25),
      label: fixNumber(size * 0.9),
    },
    input: {
      height: fixNumber(size * 3),
      label: fixNumber(size * 0.85),
      icon: fixNumber(size * 1.25),
      radius: fixNumber(size * 1),
      border: fixNumber(size * 0.18),
      padding: {
        fab: 0,
        left: fixNumber(size * 1),
        right: fixNumber(size * 1),
      },
    },
    button: {
      height: fixNumber(size * 3),
      label: fixNumber(size * 1),
      icon: fixNumber(size * 1.25),
      radius: fixNumber(size * 1),
      border: fixNumber(size * 0.18),
      padding: {
        fab: 0,
        left: fixNumber(size * 1),
        right: fixNumber(size * 1),
      },
      tooltip: {
        height: fixNumber(size * 1),
        label: Math.max(fixNumber(size * 0.75), 12),
        padding: fixNumber(size * 0.5),
        radius: fixNumber(size * 0.4),
      }
    },
    badge: {
      height: fixNumber(size * 1.5),
      label: fixNumber(size * 0.75),
      padding: fixNumber(size * 0.5),
    },
    table: {
      th: fixNumber(size * 1.2),
      tdHint: fixNumber(size * 0.8),
      tdPadding: fixNumber(size * 1),
      sort: fixNumber(size * 1),
      checkbox: fixNumber(size * 1.5),
      status: fixNumber(size * 4),
      priority: fixNumber(size * 4),
      level: fixNumber(size * 4),
    },
    switch: {
      padding: fixNumber(size * 0.25),
      label: fixNumber(size * 0.75),
      border: fixNumber(size * 0.2),
      radius: fixNumber(size * 8),
      minWidth: fixNumber(size * 4),
    },
    avatar: fixNumber(size * 3.5),
    icon: fixNumber(size * 1.5),
    inputHeight: fixNumber(size * 3),
    gap: fixNumber(size * 0.5),
    radius: fixNumber(size * 0.5),
    border: fixNumber(size * 0.2),
    backdrop: fixNumber(size * 0.5),
    padding: {
      left: fixNumber(size / 1.5),
      right: fixNumber(size / 1.5),
      top: fixNumber(size / 2),
      bottom: fixNumber(size / 2),
    },
    modal: {
      padding: fixNumber(size * 1.5),
      radius: fixNumber(size * 1.2),
      title: fixNumber(size * 1.25),
      description: fixNumber(size * 0.8),
      icon: fixNumber(size * 4),
      gap: fixNumber(size * 1.5),
      gradientBorder: fixNumber(size * 0.2),
    }
  }
};

export function fitScale(number) {
  const app = useAppStore();
  const mainSize = app.settings.mainSize;
  const size = app.settings.globalSize;
  const rate = mainSize / size;
  const scaled = fixNumber(number * rate);
  return scaled;
}

export function commaSep(number) {
  let inp = '';
  if (number !== undefined) {
    const type = typeof number;
    inp = type === 'string' ? number : number.toString();
    inp = inp.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return inp;
}

export function shortner(text, length, file = false) {
  let extensions = null;
  if (file) {
    extensions = text.split('.').pop();
  }
  const margin = extensions.length > 0 ? extensions.length + 1 : 4;
  const cleanText = extensions ? text.replace(extensions, '') : text;
  if ((cleanText.length - margin) > length) {
    return cleanText.substring(0, length) + '...' + extensions;
  }
  return text;
}

moment.loadPersian({ dialect: 'persian-modern' });

// واحدهای زمانی به ترتیب از بزرگ به کوچک
const dateUnits = [
  { key: 'year', label: 'سال', seconds: 31536000 },
  { key: 'month', label: 'ماه', seconds: 2592000 },
  { key: 'week', label: 'هفته', seconds: 604800 },
  { key: 'day', label: 'روز', seconds: 86400 },
  { key: 'hour', label: 'ساعت', seconds: 3600 },
  { key: 'minute', label: 'دقیقه', seconds: 60 },
  { key: 'second', label: 'ثانیه', seconds: 1 },
];

// روابط منطقی بین واحدها برای نمایش ترکیبی
const allowedPairs = {
  year: ['month'],
  month: ['week', 'day'],
  week: ['day'],
  day: ['hour', 'minute'],
  hour: ['minute', 'second'],
  minute: ['second'],
  second: [],
}

// خروجی خوانا با رعایت قواعد ترکیب واحدهای زمانی
function diffInUnits(seconds) {
  const result = []
  let primaryUnit = null

  for (let i = 0; i < dateUnits.length; i++) {
    const unit = dateUnits[i]
    const value = Math.floor(seconds / unit.seconds)

    if (value > 0) {
      result.push({ value, unit })
      seconds -= value * unit.seconds

      // اولین واحد → تصمیم‌گیرنده برای دومین واحد مجاز
      if (!primaryUnit) primaryUnit = unit

      // بررسی اجازه برای افزودن دومین واحد
      const nextUnit = dateUnits[i + 1]
      if (
        result.length === 2 ||
        !nextUnit ||
        !allowedPairs[primaryUnit.key].includes(nextUnit.key)
      ) {
        break
      }
    }
  }

  return result.map(({ value, unit }) => `${value} ${unit.label}`).join(' و ')
}

// تابع اصلی
export function humanizeDiff(date, type = 'default') {
  const now = moment()

  if (type === 'default') {
    const target = moment(date)
    const diff = target.diff(now, 'seconds')
    const absDiff = Math.abs(diff)
    const label = diffInUnits(absDiff)
    return diff < 0 ? `${label} پیش` : `${label} بعد`
  }

  if (type === 'range' && Array.isArray(date) && date.length === 2) {
    const [start, end] = date.map(d => moment(d))
    const nowDiffStart = start.diff(now, 'seconds')
    const nowDiffEnd = end.diff(now, 'seconds')

    const startLabel = nowDiffStart < 0
      ? `${diffInUnits(Math.abs(nowDiffStart))} پیش`
      : `${diffInUnits(Math.abs(nowDiffStart))} بعد`

    const endLabel = nowDiffEnd < 0
      ? `${diffInUnits(Math.abs(nowDiffEnd))} پیش`
      : `${diffInUnits(Math.abs(nowDiffEnd))} بعد`

    const totalDiff = Math.abs(end.diff(start, 'seconds'))
    const rangeLabel = diffInUnits(totalDiff)

    return `طول بازه‌ی زمانی ${rangeLabel}`
  }

  return ''
}

/**
 * تحلیل ورودی‌های تاریخ برای حالت‌های مختلف
 */
export function analyzeDate(date, type = 'default`', format = 'YYYY-MM-DDTHH:mm:ss') {
  const getDiffFromNow = (target, rawDate) => {
    const now = moment();
    const m = moment(target);
    const d = {
      second: now.diff(m, 'seconds'),
      minute: now.diff(m, 'minutes'),
      hour: now.diff(m, 'hours'),
      day: now.diff(m, 'days'),
      week: now.diff(m, 'weeks'),
      month: now.diff(m, 'months'),
      year: now.diff(m, 'years'),
    };
    d.label = humanizeDiff(rawDate);
    return d;
  };
  const getDiffRange = (target, rawDate) => {
    const start = target[0];
    const end = target[1];
    const d = {
      second: start.diff(end, 'seconds'),
      minute: start.diff(end, 'minutes'),
      hour: start.diff(end, 'hours'),
      day: start.diff(end, 'days'),
      week: start.diff(end, 'weeks'),
      month: start.diff(end, 'months'),
      year: start.diff(end, 'years'),
    };
    d.label = humanizeDiff(rawDate, 'range');
    return d;
  };

  const getDefaultInfo = (d) => {
    const m = moment(d, format);
    const today = moment().startOf('day');
    const isToday = m.isSame(today, 'day');
    const isTomorrow = m.isSame(moment(today).add(1, 'day'), 'day');
    const isYesterday = m.isSame(moment(today).subtract(1, 'day'), 'day');
    const season = m.jMonth();
    const year = m.jYear();
    return {
      original: d,
      timestamp: m.valueOf(),
      jalali: m.format('jYYYY/jMM/jDD'),
      weekday: m.locale('fa').format('dddd'),
      nthWeekday: Number(m.locale('fa').format('d')), // شنبه = 0
      time: m.format('HH:mm'),
      today: isToday,
      tomorrow: isTomorrow,
      yesterday: isYesterday,
      season,
      year,
      isPast: m.isBefore(moment(), 'second'),
      isFuture: m.isAfter(moment(), 'second'),
      diff: getDiffFromNow(m, d),
    };
  };

  if (!type || type === 'default') {
    return getDefaultInfo(date);
  }

  if (type === 'range' && Array.isArray(date) && date.length === 2) {
    const start = moment(date[0]);
    const end = moment(date[1]);
    const duration = getDiffRange([start, end], date);

    return {
      start: getDefaultInfo(date[0]),
      end: getDefaultInfo(date[1]),
      duration,
      isValidRange: end.isAfter(start),
      includesToday: moment().isBetween(start, end, null, '[]'),
    };
  }

  if (type === 'multiple' && Array.isArray(date)) {
    const infos = date.map(d => getDefaultInfo(d));
    const sorted = [...infos].sort((a, b) => a.timestamp - b.timestamp);
    return {
      dates: infos,
      count: infos.length,
      earliest: sorted[0],
      latest: sorted[sorted.length - 1],
      allPast: infos.every(i => i.isPast),
      allFuture: infos.every(i => i.isFuture),
    };
  }

  return null;
}

/**
 * تبدیل سایز فایل به فرمت خوانا با واحد مناسب
 * @param {number} sizeInBytes - حجم فایل به بایت
 * @returns {string} - نمایش حجم با واحد مناسب مثل '2.3 MB'
 */
export function fileSize(sizeInBytes) {
  if (isNaN(sizeInBytes) || sizeInBytes < 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitsPersian = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت', 'ترابایت'];
  const exponent = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  const size = sizeInBytes / Math.pow(1024, exponent);

  return `${size.toFixed(1)} ${unitsPersian[exponent]}`;
}


export function cap(str) {
  try {
    return String(str).replace(/\b\w/g, (char) => char.toUpperCase())
  } catch (error) {
    console.log(error, str);
  }
}

// ------------------------------
// Shortening strings
// ------------------------------

export function stringShortner(preview, len, fileName) {
  if (!preview || len <= 0) return ''
  if (preview.length <= len) return preview

  let summarized = preview.slice(0, len) + '...'

  if (fileName) {
    const parts = preview.split('.')
    if (parts.length > 1) {
      const ext = parts[parts.length - 1]
      if (ext) summarized += `.${ext}`
    }
  }

  return summarized
}
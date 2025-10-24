import { Country, CountryCode } from './types';

export const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'Canada': '🇨🇦', 
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'China': '🇨🇳',
  'India': '🇮🇳',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Australia': '🇦🇺',
  'Russia': '🇷🇺',
  'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Belgium': '🇧🇪',
  'Portugal': '🇵🇹',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺',
  'Greece': '🇬🇷',
  'Turkey': '🇹🇷',
  'Israel': '🇮🇱',
  'South Africa': '🇿🇦',
  'Egypt': '🇪🇬',
  'Nigeria': '🇳🇬',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Philippines': '🇵🇭',
  'New Zealand': '🇳🇿',
  'Ireland': '🇮🇪',
  'Ukraine': '🇺🇦',
  'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬',
  'Croatia': '🇭🇷',
  'Serbia': '🇷🇸',
  'Slovenia': '🇸🇮',
  'Slovakia': '🇸🇰',
  'Lithuania': '🇱🇹',
  'Latvia': '🇱🇻',
  'Estonia': '🇪🇪'
};

export const COUNTRY_CODE_MAP: Record<CountryCode, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'JP': 'Japan',
  'KR': 'South Korea',
  'CN': 'China',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AU': 'Australia',
  'RU': 'Russia',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PT': 'Portugal',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'GR': 'Greece',
  'TR': 'Turkey',
  'IL': 'Israel'
};

export const MILESTONE_TARGETS = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];

export const GEOLOCATION_SERVICES = [
  'https://ipapi.co/json/',
  'https://ipinfo.io/json',
  'https://ip-api.com/json/',
  'https://freegeoip.app/json/'
];

export const getAllCountries = (): Country[] => {
  return Object.entries(COUNTRY_FLAGS).map(([name, flag]) => ({
    name,
    flag
  }));
};

export const getCountryFlag = (countryName: string): string => {
  return COUNTRY_FLAGS[countryName] || '🏳️';
};

export const getCountryNameFromCode = (code: string): string => {
  return COUNTRY_CODE_MAP[code as CountryCode] || code;
};

export const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const getMedal = (rank: number): string | null => {
  const medals: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  };
  return medals[rank] || null;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const createClickEffect = (container: HTMLElement, x: number, y: number, text = '+1'): void => {
  const effect = document.createElement('div');
  effect.className = 'click-effect animate-float-up';
  effect.textContent = text;
  
  effect.style.position = 'absolute';
  effect.style.left = x + 'px';
  effect.style.top = y + 'px';
  effect.style.pointerEvents = 'none';
  
  container.appendChild(effect);
  
  setTimeout(() => {
    if (effect.parentNode) {
      effect.parentNode.removeChild(effect);
    }
  }, 1000);
};

export const createConfetti = (): void => {
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti animate-confetti-fall';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
      confetti.style.animationDelay = Math.random() * 2 + 's';
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 3000);
    }, i * 20);
  }
};

export const showMilestoneMessage = (count: number): void => {
  const message = document.createElement('div');
  message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-8 py-4 rounded-2xl text-2xl font-bold text-center shadow-2xl z-50 animate-bounce';
  message.textContent = `🎉 ${formatNumber(count)} HOPS! 🎉`;
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 500);
  }, 2000);
};

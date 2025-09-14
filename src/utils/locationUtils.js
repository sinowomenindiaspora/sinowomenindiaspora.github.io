// Simple in-memory cache to avoid repeated reverse geocoding
const reverseGeocodeCache = new Map();
let lastNominatimCall = 0;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const roundCoord = (n) => Math.round(n * 1e5) / 1e5; // ~1m precision

// Safe fetch helper that never throws, with timeout and JSON parsing
const safeFetchJson = async (url, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    if (!res.ok) {
      return { error: new Error(`HTTP ${res.status}`) };
    }
    const data = await res.json();
    return { data };
  } catch (error) {
    return { error };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getRegionFromCoordinates = (lat, lng) => {
  // Basic region calculation based on coordinates
  let region = '';
  
  // North America
  if (lat >= 15 && lat <= 72 && lng >= -168 && lng <= -50) {
    region = 'North America';
  }
  // Europe
  else if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) {
    region = 'Europe';
  }
  // East Asia
  else if (lat >= 20 && lat <= 46 && lng >= 95 && lng <= 145) {
    region = 'East Asia';
  }
  // Southeast Asia
  else if (lat >= -10 && lat <= 29 && lng >= 95 && lng <= 141) {
    region = 'Southeast Asia';
  }
  // Australia
  else if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) {
    region = 'Australia';
  }
  // Other regions can be added as needed
  else {
    region = 'Other';
  }
  
  return region;
};

// Build a readable address string from BigDataCloud response
const buildBdcAddress = (d) => {
  if (!d) return '';
  const cityLike = d.city || d.locality || d.localityInfo?.administrative?.find((x) => x.order === 6)?.name;
  const regionLike = d.principalSubdivision || d.localityInfo?.administrative?.find((x) => x.order === 4)?.name;
  const parts = [cityLike, regionLike, d.countryName].filter(Boolean);
  return parts.join(', ');
};

/**
 * Get address from latitude and longitude
 * Strategy:
 * 1) Try BigDataCloud (CORS-friendly, no key)
 * 2) Fallback to OpenStreetMap Nominatim (with email + throttling)
 *
 * Notes:
 * - Client无法通过自定义请求头解决CORS，ACAO由服务端决定。尽量避免设置非必要请求头，以减少预检。
 */
export const getAddressFromCoordinates = async (lat, lng) => {
  const key = `${roundCoord(lat)},${roundCoord(lng)}`;
  if (reverseGeocodeCache.has(key)) return reverseGeocodeCache.get(key);

  // 1) BigDataCloud: CORS 友好，无需密钥
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const lang = 'en';
  const langParam = encodeURIComponent(lang.split('-')[0] || 'en');
  const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${langParam}`;

  const { data: bdcData, error: bdcError } = await safeFetchJson(bdcUrl, 7000);
  if (bdcError) {
    // 记录但不中断，转回退分支
    console.warn('BigDataCloud reverse geocoding failed, falling back to Nominatim:', bdcError);
  } else if (bdcData) {
    const addr = buildBdcAddress(bdcData) || bdcData?.plusCode || bdcData?.locality || bdcData?.city;
    if (addr) {
      reverseGeocodeCache.set(key, addr);
      return addr;
    }
  }

  // 2) Fallback: Nominatim（遵守速率与使用政策）。注意：若其端未返回ACAO，可能仍有CORS风控。
  const email = encodeURIComponent(process.env.REACT_APP_NOMINATIM_EMAIL || 'contact@example.com');
  const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&email=${email}&accept-language=${langParam}`;

  // Respect 1 request per second
  const now = Date.now();
  const elapsed = now - lastNominatimCall;
  if (elapsed < 1100) await sleep(1100 - elapsed);

  const { data, error } = await safeFetchJson(nomUrl, 8000);
  lastNominatimCall = Date.now();

  if (error) {
    console.error('Error getting address:', error);
    return '未知地址';
  }

  const address = data?.display_name || '未知地址';
  reverseGeocodeCache.set(key, address);
  return address;
};
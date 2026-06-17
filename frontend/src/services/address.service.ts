const PROVINCES_API = "https://provinces.open-api.vn/api/v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
}

export interface Ward {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage đầy hoặc bị chặn — bỏ qua cache, không chặn luồng chính
  }
}

export const addressService = {
  async getProvinces(): Promise<Province[]> {
    const cacheKey = "address_provinces_v1";
    const cached = readCache<Province[]>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${PROVINCES_API}/?depth=1`);
    if (!res.ok) throw new Error("Không tải được danh sách tỉnh/thành.");

    const data = (await res.json()) as Province[];
    writeCache(cacheKey, data);
    return data;
  },

  async getWards(provinceCode: number): Promise<Ward[]> {
    const cacheKey = `address_wards_${provinceCode}_v1`;
    const cached = readCache<Ward[]>(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${PROVINCES_API}/p/${provinceCode}?depth=2`);
    if (!res.ok) throw new Error("Không tải được danh sách xã/phường.");

    const data = (await res.json()) as { wards: Ward[] };
    writeCache(cacheKey, data.wards);
    return data.wards;
  },
};

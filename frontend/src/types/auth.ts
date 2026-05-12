export interface SellerProfile {
  id: number;
  shop_name: string;
  shop_logo: string | null;
  shop_description: string | null;
  pickup_address: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  shippings: string[];
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: ("CUSTOMER" | "SELLER" | "ADMIN")[];
  phone?: string | null;
  sellerProfile?: SellerProfile | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

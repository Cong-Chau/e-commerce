export interface SellerProfile {
  id: number;
  shop_name: string;
  shop_logo: string | null;
  shop_description: string | null;
  pickup_address: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  shippings: ("FAST" | "EXPRESS" | "SAME_DAY")[];
  categories: { id: number; name: string }[];
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: ("CUSTOMER" | "SELLER" | "ADMIN")[];
  phone?: string | null;
  status?: string;
  created_at?: string;
  sellerProfile?: SellerProfile | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

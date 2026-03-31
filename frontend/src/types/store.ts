export interface Subscription {
  id: string;
  product_name?: string;
  product_image_url?: string | null;
  total_amount_str?: string;
  status?: string;
  interval_value?: number;
  interval_scale?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface NavLink {
  node_id: string;
  name: string;
  tag_slug: string;
  children: NavLink[];
}

export interface Product {
  id: string;
  name?: string;
  allow_subscription?: boolean;
  allow_one_time_purchase?: boolean;
  enabled_until?: string | null;
  single_game_server_only?: boolean;
  gameservers?: GameServer[];
  tags?: { slug?: string }[];
  [key: string]: unknown;
}

export interface GameServer {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Cart {
  lines: Array<{
    product_id: string;
    quantity?: number;
    name?: string;
    price?: number;
    game_server_id?: string;
    selected_gameserver_id?: string;
    subscription?: boolean;
    [key: string]: unknown;
  }>;
  total?: number;
  currency?: string;
  store_id?: string | null;
  customer_id?: string | null;
  [key: string]: unknown;
}

export interface OrderLine {
  product_id?: string;
  product_name?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  lines?: OrderLine[];
  total_amount_str?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface InventoryItem {
  product: { name: string; [key: string]: unknown };
  state?: string;
  expirable?: boolean;
  expires_at?: string | null;
  added_at?: string;
  [key: string]: unknown;
}

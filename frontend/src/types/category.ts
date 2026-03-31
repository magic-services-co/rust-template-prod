/** Server within a category (admin server list). */
export interface Server {
  server_id: string;
  server_name: string;
  order?: number;
  image_path?: string | null;
  server_address?: string | null;
  enabled?: boolean;
  rcon_ip?: string | null;
  rcon_port?: number | null;
  rcon_password?: string | null;
  wipe_schedule?: string;
  /** RustMaps CDN thumbnail URL; overrides BattleMetrics for map preview / 3D viewer. */
  current_map_thumbnail_url?: string | null;
  [key: string]: unknown;
}

/** Category with servers (admin server categories). */
export interface Category {
  id: number;
  name: string;
  order?: number;
  servers: Server[];
  [key: string]: unknown;
}

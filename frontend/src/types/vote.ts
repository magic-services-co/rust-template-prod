
export interface MapVoteOption {
  id: string;
  mapVoteId?: string;
  map_vote_id?: string;
  order?: number;
  url?: string;
  imageUrl?: string;
  imageIconUrl?: string;
  thumbnailUrl?: string;
  rawImageUrl?: string;
  vote_count?: number | null;
  userVotes?: Array<{
    user_id?: string;
    vote_option_id?: string;
    vote_id?: string;
    multiplier?: number;
    user?: {
      id?: string;
      name?: string | null;
      image?: string | null;
      accounts?: Array<{ provider?: string; providerAccountId?: string }>;
    };
  }>;
}

export interface MapVote {
  id: string;
  server_id?: string;
  vote_start: string;
  vote_end: string;
  map_start: string;
  enabled?: boolean;
  server?: { server_id?: string; server_name?: string };
  map_options: MapVoteOption[];
  gridImageUrl?: string | null;
  gridImageUrls?: string[] | null;
}

export interface UserVote {
  user_id: string;
  vote_id: string;
  vote_option_id: string;
  multiplier?: number;
}

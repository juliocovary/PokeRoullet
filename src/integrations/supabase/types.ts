export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          base_reward_badge: boolean
          base_reward_coins: number
          base_reward_shards: number
          base_reward_spins: number
          base_reward_xp: number
          category: string
          created_at: string
          description: string
          goal_type: string
          goal_value: number
          id: string
          increment_step: number | null
          reward_increment: number | null
          title: string
          updated_at: string
        }
        Insert: {
          base_reward_badge?: boolean
          base_reward_coins?: number
          base_reward_shards?: number
          base_reward_spins?: number
          base_reward_xp?: number
          category: string
          created_at?: string
          description: string
          goal_type: string
          goal_value: number
          id?: string
          increment_step?: number | null
          reward_increment?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          base_reward_badge?: boolean
          base_reward_coins?: number
          base_reward_shards?: number
          base_reward_spins?: number
          base_reward_xp?: number
          category?: string
          created_at?: string
          description?: string
          goal_type?: string
          goal_value?: number
          id?: string
          increment_step?: number | null
          reward_increment?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      banner_config: {
        Row: {
          created_at: string
          current_rotation_start: string
          id: string
          rotation_interval_minutes: number
          slot_1_pokemon: Json
          slot_2_pokemon: Json
          slot_3_pokemon: Json
          slot_4_pokemon: Json
          slot_5_pokemon: Json
          slot_6_pokemon: Json
          slot_7_pokemon: Json
          slot_8_pokemon: Json
          slot_9_pokemon: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_rotation_start?: string
          id?: string
          rotation_interval_minutes?: number
          slot_1_pokemon: Json
          slot_2_pokemon: Json
          slot_3_pokemon: Json
          slot_4_pokemon: Json
          slot_5_pokemon: Json
          slot_6_pokemon: Json
          slot_7_pokemon: Json
          slot_8_pokemon: Json
          slot_9_pokemon: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_rotation_start?: string
          id?: string
          rotation_interval_minutes?: number
          slot_1_pokemon?: Json
          slot_2_pokemon?: Json
          slot_3_pokemon?: Json
          slot_4_pokemon?: Json
          slot_5_pokemon?: Json
          slot_6_pokemon?: Json
          slot_7_pokemon?: Json
          slot_8_pokemon?: Json
          slot_9_pokemon?: Json
          updated_at?: string
        }
        Relationships: []
      }
      banner_history: {
        Row: {
          cost_amount: number
          cost_type: string
          created_at: string
          id: string
          pokemon_id: number
          pokemon_obtained: string
          star_rating: number
          stat_damage: string
          stat_effect: string
          stat_speed: string
          user_id: string
        }
        Insert: {
          cost_amount: number
          cost_type?: string
          created_at?: string
          id?: string
          pokemon_id: number
          pokemon_obtained: string
          star_rating: number
          stat_damage: string
          stat_effect: string
          stat_speed: string
          user_id: string
        }
        Update: {
          cost_amount?: number
          cost_type?: string
          created_at?: string
          id?: string
          pokemon_id?: number
          pokemon_obtained?: string
          star_rating?: number
          stat_damage?: string
          stat_effect?: string
          stat_speed?: string
          user_id?: string
        }
        Relationships: []
      }
      clan_collective_missions: {
        Row: {
          created_at: string
          description: string | null
          frequency: string
          goal: number
          id: string
          mission_type: string
          reward_clan_points: number
          reward_member_coins: number
          reward_member_shards: number
          reward_member_spins: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency: string
          goal: number
          id?: string
          mission_type: string
          reward_clan_points?: number
          reward_member_coins?: number
          reward_member_shards?: number
          reward_member_spins?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: string
          goal?: number
          id?: string
          mission_type?: string
          reward_clan_points?: number
          reward_member_coins?: number
          reward_member_shards?: number
          reward_member_spins?: number
          title?: string
        }
        Relationships: []
      }
      clan_invites: {
        Row: {
          clan_id: string
          created_at: string
          expires_at: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_invites_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_join_requests: {
        Row: {
          clan_id: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_join_requests_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_member_contributions: {
        Row: {
          clan_id: string
          id: string
          last_contribution_at: string | null
          points_contributed: number
          season_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          last_contribution_at?: string | null
          points_contributed?: number
          season_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          last_contribution_at?: string | null
          points_contributed?: number
          season_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_member_contributions_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_member_contributions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "clan_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_messages: {
        Row: {
          clan_id: string
          created_at: string
          expires_at: string
          id: string
          is_deleted: boolean
          message: string
          user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_deleted?: boolean
          message: string
          user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_deleted?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_messages_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_mission_progress: {
        Row: {
          clan_id: string
          completed_at: string | null
          current_progress: number
          id: string
          is_completed: boolean
          last_reset: string
          mission_id: string
          rewards_distributed: boolean
          season_id: string
        }
        Insert: {
          clan_id: string
          completed_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean
          last_reset?: string
          mission_id: string
          rewards_distributed?: boolean
          season_id: string
        }
        Update: {
          clan_id?: string
          completed_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean
          last_reset?: string
          mission_id?: string
          rewards_distributed?: boolean
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_mission_progress_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "clan_collective_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_mission_progress_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "clan_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_season_rewards: {
        Row: {
          claimed_at: string | null
          clan_id: string
          clan_rank: number
          created_at: string
          id: string
          is_claimed: boolean
          reward_coins: number
          reward_shards: number
          reward_spins: number
          season_id: string
          season_number: number
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          clan_id: string
          clan_rank: number
          created_at?: string
          id?: string
          is_claimed?: boolean
          reward_coins?: number
          reward_shards?: number
          reward_spins?: number
          season_id: string
          season_number: number
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          clan_id?: string
          clan_rank?: number
          created_at?: string
          id?: string
          is_claimed?: boolean
          reward_coins?: number
          reward_shards?: number
          reward_spins?: number
          season_id?: string
          season_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_season_rewards_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_season_rewards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "clan_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_season_scores: {
        Row: {
          active_members: number
          clan_id: string
          id: string
          rank: number | null
          season_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          active_members?: number
          clan_id: string
          id?: string
          rank?: number | null
          season_id: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          active_members?: number
          clan_id?: string
          id?: string
          rank?: number | null
          season_id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_season_scores_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_season_scores_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "clan_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_season_winners: {
        Row: {
          clan_emblem: string
          clan_id: string
          clan_name: string
          created_at: string
          id: string
          season_id: string
          season_number: number
          total_points: number
        }
        Insert: {
          clan_emblem: string
          clan_id: string
          clan_name: string
          created_at?: string
          id?: string
          season_id: string
          season_number: number
          total_points?: number
        }
        Update: {
          clan_emblem?: string
          clan_id?: string
          clan_name?: string
          created_at?: string
          id?: string
          season_id?: string
          season_number?: number
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "clan_season_winners_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_season_winners_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "clan_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          season_number: number
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          season_number: number
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          season_number?: number
          start_date?: string
        }
        Relationships: []
      }
      clans: {
        Row: {
          created_at: string
          description: string | null
          emblem: string
          entry_type: string
          id: string
          leader_id: string
          max_members: number
          min_level: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emblem: string
          entry_type?: string
          id?: string
          leader_id: string
          max_members?: number
          min_level?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emblem?: string
          entry_type?: string
          id?: string
          leader_id?: string
          max_members?: number
          min_level?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      friend_gifts: {
        Row: {
          claimed_at: string | null
          created_at: string
          friendship_id: string
          id: string
          is_claimed: boolean
          receiver_id: string
          reward_amount: number
          reward_type: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          friendship_id: string
          id?: string
          is_claimed?: boolean
          receiver_id: string
          reward_amount: number
          reward_type: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          friendship_id?: string
          id?: string
          is_claimed?: boolean
          receiver_id?: string
          reward_amount?: number
          reward_type?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_gifts_friendship_id_fkey"
            columns: ["friendship_id"]
            isOneToOne: false
            referencedRelation: "friendships"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: number
          name: string
          price: number
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: number
          name: string
          price?: number
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: number
          name?: string
          price?: number
          type?: string
        }
        Relationships: []
      }
      launch_event_config: {
        Row: {
          created_at: string | null
          end_date: string
          event_name: string
          id: string
          is_active: boolean | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          event_name: string
          id?: string
          is_active?: boolean | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          event_name?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
        }
        Relationships: []
      }
      launch_event_missions: {
        Row: {
          category: string
          created_at: string | null
          goal: number
          id: string
          mission_order: number
          reward_coins: number | null
          reward_legendary_spin: number | null
          reward_luck_potion: number | null
          reward_mystery_boxes: number | null
          reward_shards: number | null
          reward_shiny_potion: number | null
          reward_spins: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          goal: number
          id?: string
          mission_order: number
          reward_coins?: number | null
          reward_legendary_spin?: number | null
          reward_luck_potion?: number | null
          reward_mystery_boxes?: number | null
          reward_shards?: number | null
          reward_shiny_potion?: number | null
          reward_spins?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          goal?: number
          id?: string
          mission_order?: number
          reward_coins?: number | null
          reward_legendary_spin?: number | null
          reward_luck_potion?: number | null
          reward_mystery_boxes?: number | null
          reward_shards?: number | null
          reward_shiny_potion?: number | null
          reward_spins?: number | null
        }
        Relationships: []
      }
      marketplace_item_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          item_icon_url: string | null
          item_id: number
          item_name: string
          item_type: string
          price: number
          quantity: number
          seller_id: string
          seller_nickname: string
          sold_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          item_icon_url?: string | null
          item_id: number
          item_name: string
          item_type: string
          price: number
          quantity?: number
          seller_id: string
          seller_nickname: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          item_icon_url?: string | null
          item_id?: number
          item_name?: string
          item_type?: string
          price?: number
          quantity?: number
          seller_id?: string
          seller_nickname?: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_item_listings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_shiny: boolean
          pokemon_id: number
          pokemon_name: string
          price: number
          rarity: string
          seller_id: string
          seller_nickname: string
          sold_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_shiny?: boolean
          pokemon_id: number
          pokemon_name: string
          price: number
          rarity: string
          seller_id: string
          seller_nickname: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_shiny?: boolean
          pokemon_id?: number
          pokemon_name?: string
          price?: number
          rarity?: string
          seller_id?: string
          seller_nickname?: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_pack_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          pack_icon_url: string | null
          pack_name: string
          pack_type_id: string
          price: number
          quantity: number
          seller_id: string
          seller_nickname: string
          sold_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          pack_icon_url?: string | null
          pack_name: string
          pack_type_id: string
          price: number
          quantity?: number
          seller_id: string
          seller_nickname: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          pack_icon_url?: string | null
          pack_name?: string
          pack_type_id?: string
          price?: number
          quantity?: number
          seller_id?: string
          seller_nickname?: string
          sold_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_pack_listings_pack_type_id_fkey"
            columns: ["pack_type_id"]
            isOneToOne: false
            referencedRelation: "pack_types"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          category: string
          created_at: string
          description: string
          goal: number
          id: string
          reward_coins: number
          reward_shards: number
          reward_xp: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          goal: number
          id?: string
          reward_coins?: number
          reward_shards?: number
          reward_xp?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          goal?: number
          id?: string
          reward_coins?: number
          reward_shards?: number
          reward_xp?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_article_likes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          category: string
          content: string
          content_en: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          is_pinned: boolean
          published_at: string
          title: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          content_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_pinned?: boolean
          published_at?: string
          title: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          content_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_pinned?: boolean
          published_at?: string
          title?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      news_read_status: {
        Row: {
          article_id: string
          created_at: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_read_status_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_rewards_claimed: {
        Row: {
          article_id: string
          claimed_at: string
          created_at: string
          id: string
          reward_amount: number
          reward_type: string
          user_id: string
        }
        Insert: {
          article_id: string
          claimed_at?: string
          created_at?: string
          id?: string
          reward_amount: number
          reward_type: string
          user_id: string
        }
        Update: {
          article_id?: string
          claimed_at?: string
          created_at?: string
          id?: string
          reward_amount?: number
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_rewards_claimed_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_types: {
        Row: {
          card_count: number
          created_at: string
          description: string
          drop_chance: number
          icon_url: string | null
          id: string
          name: string
          pack_category: string
          rarity_weights: Json
          region: string | null
          shiny_chance: number
        }
        Insert: {
          card_count?: number
          created_at?: string
          description?: string
          drop_chance?: number
          icon_url?: string | null
          id: string
          name: string
          pack_category?: string
          rarity_weights?: Json
          region?: string | null
          shiny_chance?: number
        }
        Update: {
          card_count?: number
          created_at?: string
          description?: string
          drop_chance?: number
          icon_url?: string | null
          id?: string
          name?: string
          pack_category?: string
          rarity_weights?: Json
          region?: string | null
          shiny_chance?: number
        }
        Relationships: []
      }
      pokedex_cards: {
        Row: {
          created_at: string
          id: string
          is_shiny: boolean
          placed_at: string
          pokemon_id: number
          pokemon_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shiny?: boolean
          placed_at?: string
          pokemon_id: number
          pokemon_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shiny?: boolean
          placed_at?: string
          pokemon_id?: number
          pokemon_name?: string
          user_id?: string
        }
        Relationships: []
      }
      pokedex_rewards_claimed: {
        Row: {
          claimed_at: string
          created_at: string
          id: string
          milestone: number
          section: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          created_at?: string
          id?: string
          milestone: number
          section: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          created_at?: string
          id?: string
          milestone?: number
          section?: string
          user_id?: string
        }
        Relationships: []
      }
      pokemon_inventory: {
        Row: {
          created_at: string
          id: string
          is_shiny: boolean
          pokemon_id: number
          pokemon_name: string
          quantity: number
          rarity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shiny?: boolean
          pokemon_id: number
          pokemon_name: string
          quantity?: number
          rarity: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shiny?: boolean
          pokemon_id?: number
          pokemon_name?: string
          quantity?: number
          rarity?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          birth_date: string | null
          created_at: string
          current_region: string
          experience_points: number
          id: string
          level: number
          luck_boost_expires_at: string | null
          luck_multiplier: number | null
          nickname: string
          pokecoins: number
          pokegems: number
          pokeshards: number
          shiny_boost_expires_at: string | null
          starter_pokemon: string | null
          unlocked_regions: string[]
          updated_at: string
          user_id: string
          xp_multiplier: number | null
        }
        Insert: {
          avatar?: string | null
          birth_date?: string | null
          created_at?: string
          current_region?: string
          experience_points?: number
          id?: string
          level?: number
          luck_boost_expires_at?: string | null
          luck_multiplier?: number | null
          nickname: string
          pokecoins?: number
          pokegems?: number
          pokeshards?: number
          shiny_boost_expires_at?: string | null
          starter_pokemon?: string | null
          unlocked_regions?: string[]
          updated_at?: string
          user_id: string
          xp_multiplier?: number | null
        }
        Update: {
          avatar?: string | null
          birth_date?: string | null
          created_at?: string
          current_region?: string
          experience_points?: number
          id?: string
          level?: number
          luck_boost_expires_at?: string | null
          luck_multiplier?: number | null
          nickname?: string
          pokecoins?: number
          pokegems?: number
          pokeshards?: number
          shiny_boost_expires_at?: string | null
          starter_pokemon?: string | null
          unlocked_regions?: string[]
          updated_at?: string
          user_id?: string
          xp_multiplier?: number | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          reward_coins: number | null
          reward_gems: number | null
          reward_luck_potions: number | null
          reward_shards: number | null
          reward_shiny_potions: number | null
          reward_spins: number | null
          reward_status_upgrades: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_coins?: number | null
          reward_gems?: number | null
          reward_luck_potions?: number | null
          reward_shards?: number | null
          reward_shiny_potions?: number | null
          reward_spins?: number | null
          reward_status_upgrades?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_coins?: number | null
          reward_gems?: number | null
          reward_luck_potions?: number | null
          reward_shards?: number | null
          reward_shiny_potions?: number | null
          reward_spins?: number | null
          reward_status_upgrades?: number | null
        }
        Relationships: []
      }
      rankings: {
        Row: {
          avatar: string | null
          created_at: string
          experience_points: number
          id: string
          level: number
          level_rank: number | null
          nickname: string
          pokedex_count: number
          pokedex_rank: number | null
          shiny_count: number
          shiny_rank: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          experience_points?: number
          id?: string
          level?: number
          level_rank?: number | null
          nickname: string
          pokedex_count?: number
          pokedex_rank?: number | null
          shiny_count?: number
          shiny_rank?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          experience_points?: number
          id?: string
          level?: number
          level_rank?: number | null
          nickname?: string
          pokedex_count?: number
          pokedex_rank?: number | null
          shiny_count?: number
          shiny_rank?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roulette_boosts: {
        Row: {
          boost_type: string
          boost_value: number
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          task_description: string
          task_goal: number
          task_type: string
          tier: number
        }
        Insert: {
          boost_type: string
          boost_value?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          task_description: string
          task_goal: number
          task_type: string
          tier?: number
        }
        Update: {
          boost_type?: string
          boost_value?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          task_description?: string
          task_goal?: number
          task_type?: string
          tier?: number
        }
        Relationships: []
      }
      stage_config: {
        Row: {
          base_damage: number
          base_hp: number
          created_at: string
          id: string
          is_boss: boolean
          is_challenger: boolean
          is_mini_boss: boolean
          pokemon_id: number
          pokemon_name: string
          pokemon_type: string
          stage_number: number
          wave_number: number
        }
        Insert: {
          base_damage: number
          base_hp: number
          created_at?: string
          id?: string
          is_boss?: boolean
          is_challenger?: boolean
          is_mini_boss?: boolean
          pokemon_id: number
          pokemon_name: string
          pokemon_type: string
          stage_number: number
          wave_number: number
        }
        Update: {
          base_damage?: number
          base_hp?: number
          created_at?: string
          id?: string
          is_boss?: boolean
          is_challenger?: boolean
          is_mini_boss?: boolean
          pokemon_id?: number
          pokemon_name?: string
          pokemon_type?: string
          stage_number?: number
          wave_number?: number
        }
        Relationships: []
      }
      trainer_pokemon: {
        Row: {
          created_at: string
          evolved_from: string | null
          experience: number
          id: string
          is_evolved: boolean
          is_shiny: boolean
          level: number
          pokemon_id: number
          pokemon_name: string
          pokemon_type: string
          power: number
          secondary_type: string | null
          star_rating: number
          stat_damage: string
          stat_effect: string
          stat_speed: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evolved_from?: string | null
          experience?: number
          id?: string
          is_evolved?: boolean
          is_shiny?: boolean
          level?: number
          pokemon_id: number
          pokemon_name: string
          pokemon_type: string
          power?: number
          secondary_type?: string | null
          star_rating: number
          stat_damage?: string
          stat_effect?: string
          stat_speed?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evolved_from?: string | null
          experience?: number
          id?: string
          is_evolved?: boolean
          is_shiny?: boolean
          level?: number
          pokemon_id?: number
          pokemon_name?: string
          pokemon_type?: string
          power?: number
          secondary_type?: string | null
          star_rating?: number
          stat_damage?: string
          stat_effect?: string
          stat_speed?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trainer_progress: {
        Row: {
          created_at: string
          current_stage: number
          current_wave: number
          has_auto_battle: boolean | null
          highest_stage_cleared: number
          id: string
          total_battles_won: number
          total_pokemon_defeated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_stage?: number
          current_wave?: number
          has_auto_battle?: boolean | null
          highest_stage_cleared?: number
          id?: string
          total_battles_won?: number
          total_pokemon_defeated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_stage?: number
          current_wave?: number
          has_auto_battle?: boolean | null
          highest_stage_cleared?: number
          id?: string
          total_battles_won?: number
          total_pokemon_defeated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trainer_rankings: {
        Row: {
          avatar: string | null
          created_at: string
          defeated_rank: number | null
          highest_stage: number
          highest_stage_rank: number | null
          id: string
          nickname: string
          total_pokemon_defeated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          defeated_rank?: number | null
          highest_stage?: number
          highest_stage_rank?: number | null
          id?: string
          nickname: string
          total_pokemon_defeated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          defeated_rank?: number | null
          highest_stage?: number
          highest_stage_rank?: number | null
          id?: string
          nickname?: string
          total_pokemon_defeated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trainer_teams: {
        Row: {
          created_at: string
          id: string
          pet_is_shiny: boolean | null
          pet_pokemon_id: number | null
          pet_pokemon_name: string | null
          pet_rarity: string | null
          slot_1_pokemon_id: string | null
          slot_2_pokemon_id: string | null
          slot_3_pokemon_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_is_shiny?: boolean | null
          pet_pokemon_id?: number | null
          pet_pokemon_name?: string | null
          pet_rarity?: string | null
          slot_1_pokemon_id?: string | null
          slot_2_pokemon_id?: string | null
          slot_3_pokemon_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_is_shiny?: boolean | null
          pet_pokemon_id?: number | null
          pet_pokemon_name?: string | null
          pet_rarity?: string | null
          slot_1_pokemon_id?: string | null
          slot_2_pokemon_id?: string | null
          slot_3_pokemon_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_teams_slot_1_pokemon_id_fkey"
            columns: ["slot_1_pokemon_id"]
            isOneToOne: false
            referencedRelation: "trainer_pokemon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_teams_slot_2_pokemon_id_fkey"
            columns: ["slot_2_pokemon_id"]
            isOneToOne: false
            referencedRelation: "trainer_pokemon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_teams_slot_3_pokemon_id_fkey"
            columns: ["slot_3_pokemon_id"]
            isOneToOne: false
            referencedRelation: "trainer_pokemon"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          completed_at: string | null
          completed_count: number
          created_at: string
          id: string
          is_completed: boolean
          next_goal_value: number
          progress: number
          rewards_claimed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          completed_at?: string | null
          completed_count?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          next_goal_value: number
          progress?: number
          rewards_claimed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          completed_at?: string | null
          completed_count?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          next_goal_value?: number
          progress?: number
          rewards_claimed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_logins: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_claim_date: string | null
          total_logins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_claim_date?: string | null
          total_logins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_claim_date?: string | null
          total_logins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_equipped_badges: {
        Row: {
          created_at: string
          id: string
          slot_1_item_id: number | null
          slot_2_item_id: number | null
          slot_3_item_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          slot_1_item_id?: number | null
          slot_2_item_id?: number | null
          slot_3_item_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          slot_1_item_id?: number | null
          slot_2_item_id?: number | null
          slot_3_item_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipped_badges_slot_1_item_id_fkey"
            columns: ["slot_1_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipped_badges_slot_2_item_id_fkey"
            columns: ["slot_2_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipped_badges_slot_3_item_id_fkey"
            columns: ["slot_3_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_items: {
        Row: {
          created_at: string
          id: string
          item_id: number
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: number
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: number
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_launch_event_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          mission_order: number
          progress: number | null
          rewards_claimed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_order: number
          progress?: number | null
          rewards_claimed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_order?: number
          progress?: number | null
          rewards_claimed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          daily_bonus_claimed_at: string | null
          id: string
          last_reset: string
          mission_id: string
          progress: number
          rewards_claimed: boolean
          updated_at: string
          user_id: string
          weekly_bonus_claimed_at: string | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          daily_bonus_claimed_at?: string | null
          id?: string
          last_reset?: string
          mission_id: string
          progress?: number
          rewards_claimed?: boolean
          updated_at?: string
          user_id: string
          weekly_bonus_claimed_at?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          daily_bonus_claimed_at?: string | null
          id?: string
          last_reset?: string
          mission_id?: string
          progress?: number
          rewards_claimed?: boolean
          updated_at?: string
          user_id?: string
          weekly_bonus_claimed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_packs: {
        Row: {
          created_at: string
          id: string
          pack_type_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pack_type_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pack_type_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_packs_pack_type_id_fkey"
            columns: ["pack_type_id"]
            isOneToOne: false
            referencedRelation: "pack_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_redeemed_codes: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_redeemed_codes_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roulette_boosts: {
        Row: {
          boost_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_active: boolean
          is_completed: boolean
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          boost_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_completed?: boolean
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          boost_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_completed?: boolean
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roulette_boosts_boost_id_fkey"
            columns: ["boost_id"]
            isOneToOne: false
            referencedRelation: "roulette_boosts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spins: {
        Row: {
          base_free_spins: number
          created_at: string
          free_spins: number
          id: string
          last_affiliate_claim_at: string | null
          last_spin_reset: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_free_spins?: number
          created_at?: string
          free_spins?: number
          id?: string
          last_affiliate_claim_at?: string | null
          last_spin_reset?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_free_spins?: number
          created_at?: string
          free_spins?: number
          id?: string
          last_affiliate_claim_at?: string | null
          last_spin_reset?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_starter_packs_opened: {
        Row: {
          id: string
          opened_at: string
          pokemon_id: number
          pokemon_name: string
          region: string
          user_id: string
        }
        Insert: {
          id?: string
          opened_at?: string
          pokemon_id: number
          pokemon_name: string
          region: string
          user_id: string
        }
        Update: {
          id?: string
          opened_at?: string
          pokemon_id?: number
          pokemon_name?: string
          region?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_booster: {
        Args: { p_booster_type: string; p_user_id: string }
        Returns: {
          expires_at: string
          message: string
          success: boolean
        }[]
      }
      add_clan_points: {
        Args: {
          p_activity_type: string
          p_count?: number
          p_points: number
          p_user_id: string
        }
        Returns: boolean
      }
      add_experience: {
        Args: { p_user_id: string; p_xp_amount: number }
        Returns: {
          level_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      add_pokemon_without_spin: {
        Args: { p_pokemon_data: Json; p_region: string; p_user_id: string }
        Returns: Json
      }
      add_user_item: {
        Args: { p_item_id: number; p_quantity?: number; p_user_id: string }
        Returns: undefined
      }
      buy_item: {
        Args: { p_item_id: number; p_quantity?: number; p_user_id: string }
        Returns: {
          message: string
          new_pokecoins: number
          success: boolean
        }[]
      }
      buy_item_marketplace_listing: {
        Args: { p_listing_id: string; p_user_id: string }
        Returns: {
          item_name: string
          message: string
          success: boolean
        }[]
      }
      buy_marketplace_listing: {
        Args: { p_listing_id: string; p_user_id: string }
        Returns: {
          message: string
          pokemon_name: string
          success: boolean
        }[]
      }
      buy_pack_marketplace_listing: {
        Args: { p_listing_id: string; p_user_id: string }
        Returns: {
          message: string
          pack_name: string
          success: boolean
        }[]
      }
      buy_upgrade: {
        Args: { p_upgrade_type: string; p_user_id: string }
        Returns: {
          message: string
          new_pokeshards: number
          new_purchase_count: number
          success: boolean
        }[]
      }
      calculate_level: { Args: { xp: number }; Returns: number }
      can_send_gift_today: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: boolean
      }
      cancel_item_marketplace_listing: {
        Args: { p_listing_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      cancel_marketplace_listing: {
        Args: { p_listing_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      cancel_pack_marketplace_listing: {
        Args: { p_listing_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      check_and_reset_free_spins: {
        Args: { p_user_id: string }
        Returns: {
          free_spins: number
          last_spin_reset: string
        }[]
      }
      check_friends_mission: {
        Args: { p_user_id: string }
        Returns: {
          friends_count: number
          mission_completed: boolean
        }[]
      }
      claim_achievement_rewards: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: {
          message: string
          rewards: Json
          success: boolean
        }[]
      }
      claim_affiliate_bonus_spins: { Args: never; Returns: Json }
      claim_daily_completion_bonus: {
        Args: { p_user_id: string }
        Returns: {
          message: string
          rewards: Json
          success: boolean
        }[]
      }
      claim_daily_login: { Args: { p_user_id: string }; Returns: Json }
      claim_friend_gift: {
        Args: { p_gift_id: string; p_user_id: string }
        Returns: {
          message: string
          reward_amount: number
          reward_type: string
          sender_nickname: string
          success: boolean
        }[]
      }
      claim_launch_event_rewards: {
        Args: { p_mission_order: number; p_user_id: string }
        Returns: {
          message: string
          rewards: Json
          success: boolean
        }[]
      }
      claim_mission_rewards: {
        Args: { p_mission_id: string; p_user_id: string }
        Returns: {
          message: string
          rewards: Json
          success: boolean
        }[]
      }
      claim_news_reward: {
        Args: { p_article_id: string; p_user_id: string }
        Returns: Json
      }
      claim_pokedex_reward: {
        Args: {
          p_coins: number
          p_milestone: number
          p_section: string
          p_shards: number
          p_user_id: string
          p_xp: number
        }
        Returns: Json
      }
      claim_season_rewards: { Args: { p_user_id: string }; Returns: Json }
      claim_weekly_completion_bonus: {
        Args: { p_user_id: string }
        Returns: {
          message: string
          rewards: Json
          success: boolean
        }[]
      }
      cleanup_expired_listings: { Args: never; Returns: undefined }
      create_clan: {
        Args: {
          p_description: string
          p_emblem: string
          p_entry_type?: string
          p_max_members?: number
          p_min_level?: number
          p_name: string
          p_user_id: string
        }
        Returns: Json
      }
      create_item_marketplace_listing: {
        Args: {
          p_item_id: number
          p_price: number
          p_quantity: number
          p_user_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      create_marketplace_listing: {
        Args: {
          p_is_shiny?: boolean
          p_pokemon_id: number
          p_price: number
          p_user_id: string
        }
        Returns: {
          listing_id: string
          message: string
          success: boolean
        }[]
      }
      create_pack_marketplace_listing: {
        Args: {
          p_pack_type_id: string
          p_price: number
          p_quantity: number
          p_user_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      deduct_multi_spins: {
        Args: { p_spins_to_deduct: number; p_user_id: string }
        Returns: {
          message: string
          remaining_spins: number
          spins_deducted: number
          success: boolean
        }[]
      }
      end_clan_season: { Args: never; Returns: Json }
      equip_badge: {
        Args: { p_item_id: number; p_slot: number }
        Returns: Json
      }
      evolve_pokemon: {
        Args: {
          p_base_pokemon_id: number
          p_cards_required?: number
          p_evolved_pokemon_id: number
          p_evolved_pokemon_name: string
          p_evolved_pokemon_rarity: string
          p_item_id?: number
          p_user_id: string
        }
        Returns: {
          message: string
          new_pokemon: Json
          success: boolean
        }[]
      }
      fuse_shiny_pokemon: {
        Args: {
          p_pokemon_id: string
          p_sacrifice_ids: string[]
          p_user_id: string
        }
        Returns: Json
      }
      get_active_item_marketplace_listings: {
        Args: {
          p_item_type?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
        }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          item_icon_url: string
          item_id: number
          item_name: string
          item_type: string
          price: number
          quantity: number
          seller_id: string
          seller_nickname: string
          status: string
          total_count: number
        }[]
      }
      get_active_marketplace_listings: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_rarity?: string
          p_search?: string
        }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          is_shiny: boolean
          pokemon_id: number
          pokemon_name: string
          price: number
          rarity: string
          seller_id: string
          seller_nickname: string
          status: string
          total_count: number
        }[]
      }
      get_active_pack_marketplace_listings: {
        Args: { p_page?: number; p_page_size?: number; p_search?: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          pack_icon_url: string
          pack_name: string
          pack_type_id: string
          price: number
          quantity: number
          seller_id: string
          seller_nickname: string
          status: string
          total_count: number
        }[]
      }
      get_active_roulette_boosts: { Args: { p_user_id: string }; Returns: Json }
      get_affiliate_bonus_status: { Args: never; Returns: Json }
      get_badge_buffs: { Args: never; Returns: Json }
      get_clan_members: { Args: { p_clan_id: string }; Returns: Json }
      get_clan_messages: {
        Args: { p_clan_id: string; p_limit?: number }
        Returns: Json
      }
      get_clan_missions: {
        Args: { p_clan_id: string }
        Returns: {
          current_progress: number
          description: string
          frequency: string
          goal: number
          is_completed: boolean
          mission_id: string
          mission_type: string
          reward_clan_points: number
          reward_member_coins: number
          reward_member_shards: number
          reward_member_spins: number
          title: string
        }[]
      }
      get_clan_rankings: { Args: { p_limit?: number }; Returns: Json }
      get_equipped_badges: { Args: never; Returns: Json }
      get_friend_pokedex: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: {
          is_shiny: boolean
          placed_at: string
          pokemon_id: number
          pokemon_name: string
        }[]
      }
      get_friends_stats_batch: {
        Args: { p_friend_ids: string[]; p_user_id: string }
        Returns: {
          can_send_gift: boolean
          friend_id: string
          pokemon_count: number
          unique_pokemon_count: number
        }[]
      }
      get_my_pack_marketplace_listings: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          pack_icon_url: string
          pack_name: string
          pack_type_id: string
          price: number
          quantity: number
          seller_id: string
          seller_nickname: string
          status: string
        }[]
      }
      get_pending_clan_invites: { Args: { p_user_id: string }; Returns: Json }
      get_pending_gifts: {
        Args: { p_user_id: string }
        Returns: {
          gift_id: string
          reward_amount: number
          reward_type: string
          sender_avatar: string
          sender_id: string
          sender_nickname: string
          sent_at: string
        }[]
      }
      get_pending_season_rewards: { Args: { p_user_id: string }; Returns: Json }
      get_pokedex_counts: {
        Args: never
        Returns: {
          pokedex_count: number
          user_id: string
        }[]
      }
      get_public_profile: { Args: { p_user_id: string }; Returns: Json }
      get_public_profiles_by_ids: {
        Args: { user_ids: string[] }
        Returns: {
          avatar: string
          experience_points: number
          level: number
          nickname: string
          user_id: string
        }[]
      }
      get_shiny_pokedex_counts: {
        Args: never
        Returns: {
          shiny_count: number
          user_id: string
        }[]
      }
      get_unread_news_count: { Args: { p_user_id: string }; Returns: number }
      get_user_active_listings_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_active_roulette_boosts: {
        Args: { p_user_id: string }
        Returns: {
          boost_type: string
          total_value: number
        }[]
      }
      get_user_clan: { Args: { p_user_id: string }; Returns: Json }
      get_user_statistics: { Args: { p_user_id: string }; Returns: Json }
      grant_pack_drop: { Args: { p_user_id: string }; Returns: Json }
      increase_base_spins: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      increase_luck_multiplier: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      increase_xp_multiplier: {
        Args: { p_percentage: number; p_user_id: string }
        Returns: boolean
      }
      increment_pokemon_quantity: {
        Args: { p_pokemon_id: number; p_user_id: string }
        Returns: undefined
      }
      join_clan: {
        Args: { p_clan_id: string; p_user_id: string }
        Returns: Json
      }
      leave_clan: { Args: { p_user_id: string }; Returns: Json }
      log_spin_reset: { Args: never; Returns: undefined }
      manage_clan_member: {
        Args: {
          p_action: string
          p_clan_id: string
          p_target_user_id: string
          p_user_id: string
        }
        Returns: Json
      }
      open_card_pack: {
        Args: { p_pack_type_id: string; p_user_id: string }
        Returns: Json
      }
      open_essence_box: { Args: { p_user_item_id: string }; Returns: Json }
      open_mystery_box: {
        Args: { p_count?: number; p_user_id: string }
        Returns: {
          message: string
          rewards: Json
          success: boolean
        }[]
      }
      open_starter_pack: {
        Args: { p_region: string; p_user_id: string }
        Returns: Json
      }
      place_pokemon_in_pokedex:
        | {
            Args: {
              p_pokemon_id: number
              p_pokemon_name: string
              p_user_id: string
            }
            Returns: {
              message: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_is_shiny?: boolean
              p_pokemon_id: number
              p_pokemon_name: string
              p_user_id: string
            }
            Returns: {
              message: string
              success: boolean
            }[]
          }
      purchase_region: {
        Args: { p_price: number; p_region: string; p_user_id: string }
        Returns: Json
      }
      redeem_promo_code: { Args: { p_code: string }; Returns: Json }
      remove_friend: {
        Args: { p_friendship_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      reset_all_spins: { Args: never; Returns: undefined }
      reset_daily_missions: { Args: never; Returns: undefined }
      reset_missions: { Args: never; Returns: undefined }
      reset_weekly_missions: { Args: never; Returns: undefined }
      respond_clan_invite: {
        Args: { p_accept: boolean; p_invite_id: string; p_user_id: string }
        Returns: Json
      }
      respond_to_friend_request: {
        Args: { p_accept: boolean; p_friendship_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      roll_pokemon_stat: {
        Args: {
          p_new_grade: string
          p_pokemon_id: string
          p_stat: string
          p_user_id: string
        }
        Returns: Json
      }
      search_clans: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: Json
      }
      search_public_profiles: {
        Args: { exclude_user_id?: string; search_term: string }
        Returns: {
          avatar: string
          current_region: string
          level: number
          nickname: string
          user_id: string
        }[]
      }
      select_starter_pokemon: {
        Args: {
          p_pokemon_id: number
          p_pokemon_name: string
          p_rarity: string
          p_user_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      sell_pokemon: {
        Args: {
          p_is_shiny?: boolean
          p_pokemon_id: number
          p_quantity?: number
          p_user_id: string
        }
        Returns: {
          message: string
          new_pokecoins: number
          pokecoins_earned: number
          success: boolean
        }[]
      }
      send_clan_message: {
        Args: { p_message: string; p_user_id: string }
        Returns: Json
      }
      send_daily_gift: {
        Args: {
          p_friend_id: string
          p_friendship_id: string
          p_user_id: string
        }
        Returns: {
          message: string
          reward_amount: number
          reward_type: string
          success: boolean
        }[]
      }
      send_friend_request: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      spin_pokemon_roulette: {
        Args: { p_pokemon_data: Json; p_region: string; p_user_id: string }
        Returns: Json
      }
      unlock_region: {
        Args: { p_region: string; p_user_id: string }
        Returns: boolean
      }
      update_achievement_progress: {
        Args: { p_goal_type: string; p_increment?: number; p_user_id: string }
        Returns: {
          achievements_completed: Json
          rewards_earned: Json
        }[]
      }
      update_clan_settings: {
        Args: {
          p_clan_id: string
          p_description?: string
          p_emblem?: string
          p_entry_type?: string
          p_min_level?: number
          p_user_id: string
        }
        Returns: Json
      }
      update_launch_event_progress: {
        Args: { p_category: string; p_increment?: number; p_user_id: string }
        Returns: {
          mission_completed: boolean
          mission_order: number
        }[]
      }
      update_mission_progress: {
        Args: { p_category: string; p_increment?: number; p_user_id: string }
        Returns: {
          completed_missions: Json
          rewards_earned: Json
        }[]
      }
      update_profile_safe: {
        Args: { p_avatar?: string; p_nickname?: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      update_rankings: { Args: never; Returns: undefined }
      update_roulette_boost_progress: {
        Args: { p_increment?: number; p_task_type: string; p_user_id: string }
        Returns: Json
      }
      use_legendary_spin: {
        Args: { p_user_id: string }
        Returns: {
          is_shiny: boolean
          message: string
          pokemon_id: number
          pokemon_name: string
          success: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

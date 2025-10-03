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
      pokedex_cards: {
        Row: {
          created_at: string
          id: string
          placed_at: string
          pokemon_id: number
          pokemon_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          placed_at?: string
          pokemon_id: number
          pokemon_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          placed_at?: string
          pokemon_id?: number
          pokemon_name?: string
          user_id?: string
        }
        Relationships: []
      }
      pokemon_inventory: {
        Row: {
          created_at: string
          id: string
          pokemon_id: number
          pokemon_name: string
          quantity: number
          rarity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pokemon_id: number
          pokemon_name: string
          quantity?: number
          rarity: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
          experience_points: number
          id: string
          level: number
          nickname: string
          pokecoins: number
          pokeshards: number
          starter_pokemon: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          birth_date?: string | null
          created_at?: string
          experience_points?: number
          id?: string
          level?: number
          nickname: string
          pokecoins?: number
          pokeshards?: number
          starter_pokemon?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          birth_date?: string | null
          created_at?: string
          experience_points?: number
          id?: string
          level?: number
          nickname?: string
          pokecoins?: number
          pokeshards?: number
          starter_pokemon?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_spins: {
        Row: {
          base_free_spins: number
          created_at: string
          free_spins: number
          id: string
          last_spin_reset: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_free_spins?: number
          created_at?: string
          free_spins?: number
          id?: string
          last_spin_reset?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_free_spins?: number
          created_at?: string
          free_spins?: number
          id?: string
          last_spin_reset?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_experience: {
        Args: { p_user_id: string; p_xp_amount: number }
        Returns: {
          level_up: boolean
          new_level: number
          new_xp: number
        }[]
      }
      buy_item: {
        Args: { p_item_id: number; p_quantity?: number; p_user_id: string }
        Returns: {
          message: string
          new_pokecoins: number
          success: boolean
        }[]
      }
      calculate_level: {
        Args: { xp: number }
        Returns: number
      }
      check_and_reset_free_spins: {
        Args: { p_user_id: string }
        Returns: {
          free_spins: number
          last_spin_reset: string
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
      claim_daily_completion_bonus: {
        Args: { p_user_id: string }
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
      claim_weekly_completion_bonus: {
        Args: { p_user_id: string }
        Returns: {
          message: string
          rewards: Json
          success: boolean
        }[]
      }
      increase_base_spins: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      increment_pokemon_quantity: {
        Args: { p_pokemon_id: number; p_user_id: string }
        Returns: undefined
      }
      place_pokemon_in_pokedex: {
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
      reset_all_spins: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_daily_missions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_missions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_weekly_missions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sell_pokemon: {
        Args: { p_pokemon_id: number; p_quantity: number; p_user_id: string }
        Returns: {
          message: string
          new_pokecoins: number
          pokecoins_earned: number
          success: boolean
        }[]
      }
      update_achievement_progress: {
        Args: { p_goal_type: string; p_increment?: number; p_user_id: string }
        Returns: {
          achievements_completed: Json
          rewards_earned: Json
        }[]
      }
      update_mission_progress: {
        Args: { p_category: string; p_increment?: number; p_user_id: string }
        Returns: {
          missions_completed: Json
          rewards_earned: Json
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

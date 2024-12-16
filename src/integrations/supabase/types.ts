export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Articles: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string
          id: number
          paragraph: string | null
          subtitle: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          id?: number
          paragraph?: string | null
          subtitle?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          id?: number
          paragraph?: string | null
          subtitle?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      Contact: {
        Row: {
          created_at: string
          email: string | null
          id: number
          message: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
        }
        Relationships: []
      }
      exchange_metadata: {
        Row: {
          avg_transfer_time_minutes: number
          created_at: string
          exchange_name: string
          id: string
          trading_fee_percentage: number
          withdrawal_fee_flat: number
        }
        Insert: {
          avg_transfer_time_minutes?: number
          created_at?: string
          exchange_name: string
          id?: string
          trading_fee_percentage?: number
          withdrawal_fee_flat?: number
        }
        Update: {
          avg_transfer_time_minutes?: number
          created_at?: string
          exchange_name?: string
          id?: string
          trading_fee_percentage?: number
          withdrawal_fee_flat?: number
        }
        Relationships: []
      }
      price_discrepancies: {
        Row: {
          created_at: string
          exchange_from: string
          exchange_to: string
          id: string
          potential_profit_usd: number
          price_difference_percentage: number
          profitable_after_fees: boolean
          token_symbol: string
        }
        Insert: {
          created_at?: string
          exchange_from: string
          exchange_to: string
          id?: string
          potential_profit_usd: number
          price_difference_percentage: number
          profitable_after_fees: boolean
          token_symbol: string
        }
        Update: {
          created_at?: string
          exchange_from?: string
          exchange_to?: string
          id?: string
          potential_profit_usd?: number
          price_difference_percentage?: number
          profitable_after_fees?: boolean
          token_symbol?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          role: string | null
          user_type: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          role?: string | null
          user_type?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          role?: string | null
          user_type?: string
          username?: string | null
        }
        Relationships: []
      }
      trading_settings: {
        Row: {
          created_at: string
          default_token_in: string | null
          default_token_out: string | null
          dex_name: string
          id: string
          slippage_tolerance: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          default_token_in?: string | null
          default_token_out?: string | null
          dex_name: string
          id?: string
          slippage_tolerance?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          default_token_in?: string | null
          default_token_out?: string | null
          dex_name?: string
          id?: string
          slippage_tolerance?: number | null
          user_id?: string
        }
        Relationships: []
      }
      Users: {
        Row: {
          created_at: string
          email: string | null
          id: number
          password: string | null
          type: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          password?: string | null
          type?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          password?: string | null
          type?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

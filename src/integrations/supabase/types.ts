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
      api_test_results: {
        Row: {
          error_message: string | null
          exchange_name: string
          id: string
          response_time: number | null
          status: boolean
          test_name: string
          tested_at: string | null
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          exchange_name: string
          id?: string
          response_time?: number | null
          status: boolean
          test_name: string
          tested_at?: string | null
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          exchange_name?: string
          id?: string
          response_time?: number | null
          status?: boolean
          test_name?: string
          tested_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      arbitrage_calculations: {
        Row: {
          base_amount: number
          buy_price: number
          created_at: string
          fees_buy: number
          fees_sell: number
          gross_profit: number
          id: string
          net_profit: number
          network_fees: number
          opportunity_id: string
          sell_price: number
        }
        Insert: {
          base_amount: number
          buy_price: number
          created_at?: string
          fees_buy: number
          fees_sell: number
          gross_profit: number
          id?: string
          net_profit: number
          network_fees: number
          opportunity_id: string
          sell_price: number
        }
        Update: {
          base_amount?: number
          buy_price?: number
          created_at?: string
          fees_buy?: number
          fees_sell?: number
          gross_profit?: number
          id?: string
          net_profit?: number
          network_fees?: number
          opportunity_id?: string
          sell_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "arbitrage_calculations_opportunity_fk"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "arbitrage_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arbitrage_calculations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "arbitrage_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      arbitrage_execution_metrics: {
        Row: {
          actual_slippage_percentage: number
          buy_exchange: string
          created_at: string | null
          execution_time_ms: number
          id: string
          liquidity_depth: number
          market_impact_percentage: number
          network_latency_ms: number
          opportunity_id: string | null
          sell_exchange: string
          symbol: string
        }
        Insert: {
          actual_slippage_percentage: number
          buy_exchange: string
          created_at?: string | null
          execution_time_ms: number
          id?: string
          liquidity_depth: number
          market_impact_percentage: number
          network_latency_ms: number
          opportunity_id?: string | null
          sell_exchange: string
          symbol: string
        }
        Update: {
          actual_slippage_percentage?: number
          buy_exchange?: string
          created_at?: string | null
          execution_time_ms?: number
          id?: string
          liquidity_depth?: number
          market_impact_percentage?: number
          network_latency_ms?: number
          opportunity_id?: string | null
          sell_exchange?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "arbitrage_execution_metrics_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "arbitrage_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      arbitrage_opportunities: {
        Row: {
          buy_exchange: string
          buy_price: number | null
          created_at: string
          executed_at: string | null
          execution_error: string | null
          id: string
          potential_profit: number
          sell_exchange: string
          sell_price: number | null
          spread: number
          status: string
          symbol: string
          user_id: string | null
        }
        Insert: {
          buy_exchange: string
          buy_price?: number | null
          created_at?: string
          executed_at?: string | null
          execution_error?: string | null
          id?: string
          potential_profit: number
          sell_exchange: string
          sell_price?: number | null
          spread: number
          status?: string
          symbol: string
          user_id?: string | null
        }
        Update: {
          buy_exchange?: string
          buy_price?: number | null
          created_at?: string
          executed_at?: string | null
          execution_error?: string | null
          id?: string
          potential_profit?: number
          sell_exchange?: string
          sell_price?: number | null
          spread?: number
          status?: string
          symbol?: string
          user_id?: string | null
        }
        Relationships: []
      }
      arbitrage_settings: {
        Row: {
          created_at: string
          exchanges: string[]
          id: string
          min_profit_amount: number
          min_spread_percentage: number
          notifications_enabled: boolean
          refresh_interval: number
          symbols: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exchanges?: string[]
          id?: string
          min_profit_amount?: number
          min_spread_percentage?: number
          notifications_enabled?: boolean
          refresh_interval?: number
          symbols?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exchanges?: string[]
          id?: string
          min_profit_amount?: number
          min_spread_percentage?: number
          notifications_enabled?: boolean
          refresh_interval?: number
          symbols?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          avg_network_latency_ms: number | null
          avg_transfer_time_minutes: number
          created_at: string
          exchange_name: string
          historical_slippage_percentage: number | null
          id: string
          maker_fee_percentage: number | null
          market_impact_factor: number | null
          max_trade_amount: number | null
          max_withdrawal_amount: number | null
          min_trade_amount: number | null
          min_withdrawal_amount: number | null
          supported_networks: string[] | null
          taker_fee_percentage: number | null
          trading_fee_percentage: number
          withdrawal_fee_flat: number
        }
        Insert: {
          avg_network_latency_ms?: number | null
          avg_transfer_time_minutes?: number
          created_at?: string
          exchange_name: string
          historical_slippage_percentage?: number | null
          id?: string
          maker_fee_percentage?: number | null
          market_impact_factor?: number | null
          max_trade_amount?: number | null
          max_withdrawal_amount?: number | null
          min_trade_amount?: number | null
          min_withdrawal_amount?: number | null
          supported_networks?: string[] | null
          taker_fee_percentage?: number | null
          trading_fee_percentage?: number
          withdrawal_fee_flat?: number
        }
        Update: {
          avg_network_latency_ms?: number | null
          avg_transfer_time_minutes?: number
          created_at?: string
          exchange_name?: string
          historical_slippage_percentage?: number | null
          id?: string
          maker_fee_percentage?: number | null
          market_impact_factor?: number | null
          max_trade_amount?: number | null
          max_withdrawal_amount?: number | null
          min_trade_amount?: number | null
          min_withdrawal_amount?: number | null
          supported_networks?: string[] | null
          taker_fee_percentage?: number | null
          trading_fee_percentage?: number
          withdrawal_fee_flat?: number
        }
        Relationships: []
      }
      matching_trading_pairs: {
        Row: {
          average_execution_time_ms: number | null
          average_price_difference: number | null
          binance_liquidity: number | null
          binance_symbol: string
          created_at: string
          id: string
          is_active: boolean | null
          kucoin_liquidity: number | null
          kucoin_symbol: string
          last_price_check: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          average_execution_time_ms?: number | null
          average_price_difference?: number | null
          binance_liquidity?: number | null
          binance_symbol: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          kucoin_liquidity?: number | null
          kucoin_symbol: string
          last_price_check?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          average_execution_time_ms?: number | null
          average_price_difference?: number | null
          binance_liquidity?: number | null
          binance_symbol?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          kucoin_liquidity?: number | null
          kucoin_symbol?: string
          last_price_check?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      package_dependencies: {
        Row: {
          conflicts_with: Json | null
          created_at: string
          current_version: string
          id: string
          is_dev_dependency: boolean | null
          is_peer_dependency: boolean | null
          notes: string | null
          package_name: string
          required_by: string[] | null
          resolution_strategy: string | null
          updated_at: string
        }
        Insert: {
          conflicts_with?: Json | null
          created_at?: string
          current_version: string
          id?: string
          is_dev_dependency?: boolean | null
          is_peer_dependency?: boolean | null
          notes?: string | null
          package_name: string
          required_by?: string[] | null
          resolution_strategy?: string | null
          updated_at?: string
        }
        Update: {
          conflicts_with?: Json | null
          created_at?: string
          current_version?: string
          id?: string
          is_dev_dependency?: boolean | null
          is_peer_dependency?: boolean | null
          notes?: string | null
          package_name?: string
          required_by?: string[] | null
          resolution_strategy?: string | null
          updated_at?: string
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
      rebalance_transactions: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          from_exchange: string
          id: string
          status: string
          to_exchange: string
          token_symbol: string
          transaction_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          from_exchange: string
          id?: string
          status?: string
          to_exchange: string
          token_symbol: string
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          from_exchange?: string
          id?: string
          status?: string
          to_exchange?: string
          token_symbol?: string
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solana_transfers: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          exchange_name: string | null
          exchange_transaction_id: string | null
          fee: number | null
          from_address: string
          from_type: string
          id: string
          network: string | null
          status: string
          to_address: string
          to_type: string
          token_mint: string
          transaction_signature: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          exchange_name?: string | null
          exchange_transaction_id?: string | null
          fee?: number | null
          from_address: string
          from_type: string
          id?: string
          network?: string | null
          status?: string
          to_address: string
          to_type: string
          token_mint: string
          transaction_signature?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          exchange_name?: string | null
          exchange_transaction_id?: string | null
          fee?: number | null
          from_address?: string
          from_type?: string
          id?: string
          network?: string | null
          status?: string
          to_address?: string
          to_type?: string
          token_mint?: string
          transaction_signature?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solana_wallet_balances: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          last_updated: string | null
          token_mint: string
          usd_value: number | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          balance: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          token_mint: string
          usd_value?: number | null
          user_id: string
          wallet_address: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          token_mint?: string
          usd_value?: number | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      supabase_ip_ranges: {
        Row: {
          created_at: string
          id: string
          ip_range: string
          region: string | null
          service: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_range: string
          region?: string | null
          service?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_range?: string
          region?: string | null
          service?: string | null
          updated_at?: string
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
      user_trades: {
        Row: {
          amount: number
          exchange: string
          id: string
          price: number
          side: string
          symbol: string
          timestamp: string
          trade_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          exchange: string
          id?: string
          price: number
          side: string
          symbol: string
          timestamp?: string
          trade_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          exchange?: string
          id?: string
          price?: number
          side?: string
          symbol?: string
          timestamp?: string
          trade_id?: string | null
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          from_address: string
          id: string
          status: string
          to_address: string
          token_symbol: string
          transaction_hash: string | null
          transaction_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          from_address: string
          id?: string
          status?: string
          to_address: string
          token_symbol: string
          transaction_hash?: string | null
          transaction_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          from_address?: string
          id?: string
          status?: string
          to_address?: string
          token_symbol?: string
          transaction_hash?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
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

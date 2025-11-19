/**
 * Database types for Supabase
 * These types match the database schema defined in migrations
 */

export type Database = {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          livepeer_asset_id: string;
          price_usd: number;
          is_free: boolean;
          thumbnail_url: string | null;
          status: 'processing' | 'ready' | 'error';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          livepeer_asset_id: string;
          price_usd?: number;
          is_free?: boolean;
          thumbnail_url?: string | null;
          status?: 'processing' | 'ready' | 'error';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          livepeer_asset_id?: string;
          price_usd?: number;
          is_free?: boolean;
          thumbnail_url?: string | null;
          status?: 'processing' | 'ready' | 'error';
          created_at?: string;
          updated_at?: string;
        };
      };
      streams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          livepeer_stream_id: string;
          rtmp_ingest_url: string;
          stream_key: string;
          price_usd: number;
          is_free: boolean;
          is_live: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          livepeer_stream_id: string;
          rtmp_ingest_url: string;
          stream_key: string;
          price_usd?: number;
          is_free?: boolean;
          is_live?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          livepeer_stream_id?: string;
          rtmp_ingest_url?: string;
          stream_key?: string;
          price_usd?: number;
          is_free?: boolean;
          is_live?: boolean;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_usd: number;
          images: string[];
          variants: Record<string, any>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_usd: number;
          images?: string[];
          variants?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_usd?: number;
          images?: string[];
          variants?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          product_id: string | null;
          quantity: number;
          shipping_address: Record<string, any>;
          status: 'pending' | 'processing' | 'fulfilled' | 'shipped' | 'cancelled';
          payment_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id?: string | null;
          quantity?: number;
          shipping_address: Record<string, any>;
          status?: 'pending' | 'processing' | 'fulfilled' | 'shipped' | 'cancelled';
          payment_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string | null;
          quantity?: number;
          shipping_address?: Record<string, any>;
          status?: 'pending' | 'processing' | 'fulfilled' | 'shipped' | 'cancelled';
          payment_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_content_access: {
        Row: {
          id: string;
          user_id: string;
          content_type: 'video' | 'stream';
          content_id: string;
          payment_tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: 'video' | 'stream';
          content_id: string;
          payment_tx_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?: 'video' | 'stream';
          content_id?: string;
          payment_tx_hash?: string | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          privy_user_id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          privy_user_id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          privy_user_id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};


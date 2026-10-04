export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          role?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          type: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          type: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_cards: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string;
          deliverable_type: string;
          rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id: string;
          deliverable_type: string;
          rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          deliverable_type?: string;
          rate?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      deliverables: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string;
          title: string;
          type: string;
          amount: number;
          date: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id: string;
          title: string;
          type: string;
          amount: number;
          date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          title?: string;
          type?: string;
          amount?: number;
          date?: string;
          status?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string;
          amount: number;
          method: string;
          date: string;
          reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id: string;
          amount: number;
          method?: string;
          date?: string;
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          amount?: number;
          method?: string;
          date?: string;
          reference?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      statements: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string;
          month: number;
          year: number;
          generated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id: string;
          month: number;
          year: number;
          generated_at?: string;
        };
        Update: {
          month?: number;
          year?: number;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          workspace_id: string;
          type: string;
          entity_id: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: string;
          entity_id: string;
          description: string;
          created_at?: string;
        };
        Update: {
          type?: string;
          entity_id?: string;
          description?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: {
          ws_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

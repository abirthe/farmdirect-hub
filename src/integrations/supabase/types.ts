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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_cycles: {
        Row: {
          actual_yield_kg: number | null
          ai_confidence_score: number | null
          ai_est_harvest_date: string | null
          ai_predicted_yield_kg: number | null
          created_at: string | null
          crop_type: string
          farm_id: string
          id: string
          sown_date: string | null
          status: Database["public"]["Enums"]["crop_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_yield_kg?: number | null
          ai_confidence_score?: number | null
          ai_est_harvest_date?: string | null
          ai_predicted_yield_kg?: number | null
          created_at?: string | null
          crop_type: string
          farm_id: string
          id?: string
          sown_date?: string | null
          status?: Database["public"]["Enums"]["crop_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_yield_kg?: number | null
          ai_confidence_score?: number | null
          ai_est_harvest_date?: string | null
          ai_predicted_yield_kg?: number | null
          created_at?: string | null
          crop_type?: string
          farm_id?: string
          id?: string
          sown_date?: string | null
          status?: Database["public"]["Enums"]["crop_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycles_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      CropCycle: {
        Row: {
          baseYieldTons: number | null
          cropType: string
          estHarvestDate: string | null
          farmId: string
          id: string
          sownDate: string | null
          status: Database["public"]["Enums"]["CropCycleStatus"]
        }
        Insert: {
          baseYieldTons?: number | null
          cropType: string
          estHarvestDate?: string | null
          farmId: string
          id?: string
          sownDate?: string | null
          status?: Database["public"]["Enums"]["CropCycleStatus"]
        }
        Update: {
          baseYieldTons?: number | null
          cropType?: string
          estHarvestDate?: string | null
          farmId?: string
          id?: string
          sownDate?: string | null
          status?: Database["public"]["Enums"]["CropCycleStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "CropCycle_farmId_fkey"
            columns: ["farmId"]
            isOneToOne: false
            referencedRelation: "Farm"
            referencedColumns: ["id"]
          },
        ]
      }
      Dispute: {
        Row: {
          createdAt: string
          description: string
          id: string
          issueType: string
          orderId: string
          raisedBy: string
          status: Database["public"]["Enums"]["DisputeStatus"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description: string
          id?: string
          issueType: string
          orderId: string
          raisedBy: string
          status?: Database["public"]["Enums"]["DisputeStatus"]
          updatedAt: string
        }
        Update: {
          createdAt?: string
          description?: string
          id?: string
          issueType?: string
          orderId?: string
          raisedBy?: string
          status?: Database["public"]["Enums"]["DisputeStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Dispute_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Dispute_raisedBy_fkey"
            columns: ["raisedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Farm: {
        Row: {
          createdAt: string
          farmName: string
          id: string
          locationName: string | null
          totalHectares: number | null
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          farmName: string
          id?: string
          locationName?: string | null
          totalHectares?: number | null
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          farmName?: string
          id?: string
          locationName?: string | null
          totalHectares?: number | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Farm_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          boundary_coordinates: Json | null
          created_at: string | null
          farm_name: string
          id: string
          location_name: string | null
          total_hectares: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          boundary_coordinates?: Json | null
          created_at?: string | null
          farm_name: string
          id?: string
          location_name?: string | null
          total_hectares?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          boundary_coordinates?: Json | null
          created_at?: string | null
          farm_name?: string
          id?: string
          location_name?: string | null
          total_hectares?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Listing: {
        Row: {
          createdAt: string
          cropCycleId: string
          floorPriceUsd: number
          id: string
          qualityGrade: string | null
          quantityTons: number
          status: Database["public"]["Enums"]["ListingStatus"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          cropCycleId: string
          floorPriceUsd: number
          id?: string
          qualityGrade?: string | null
          quantityTons: number
          status?: Database["public"]["Enums"]["ListingStatus"]
          updatedAt: string
        }
        Update: {
          createdAt?: string
          cropCycleId?: string
          floorPriceUsd?: number
          id?: string
          qualityGrade?: string | null
          quantityTons?: number
          status?: Database["public"]["Enums"]["ListingStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Listing_cropCycleId_fkey"
            columns: ["cropCycleId"]
            isOneToOne: false
            referencedRelation: "CropCycle"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          created_at: string | null
          crop_cycle_id: string
          floor_price_per_ton: number
          id: string
          quality_grade: string | null
          quantity_tons: number
          status: Database["public"]["Enums"]["listing_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crop_cycle_id: string
          floor_price_per_ton: number
          id?: string
          quality_grade?: string | null
          quantity_tons: number
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crop_cycle_id?: string
          floor_price_per_ton?: number
          id?: string
          quality_grade?: string | null
          quantity_tons?: number
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          actionLink: string | null
          body: string
          createdAt: string
          id: string
          isRead: boolean
          title: string
          type: Database["public"]["Enums"]["NotifType"]
          userId: string
        }
        Insert: {
          actionLink?: string | null
          body: string
          createdAt?: string
          id?: string
          isRead?: boolean
          title: string
          type?: Database["public"]["Enums"]["NotifType"]
          userId: string
        }
        Update: {
          actionLink?: string | null
          body?: string
          createdAt?: string
          id?: string
          isRead?: boolean
          title?: string
          type?: Database["public"]["Enums"]["NotifType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          icon_type: string | null
          id: string
          is_read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          icon_type?: string | null
          id?: string
          is_read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          icon_type?: string | null
          id?: string
          is_read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Order: {
        Row: {
          buyerId: string
          createdAt: string
          deliveredAt: string | null
          escrowFee: number
          farmerId: string
          id: string
          listingId: string
          qrDeliveryHash: string | null
          qtyPurchased: number
          status: Database["public"]["Enums"]["OrderStatus"]
          totalPrice: number
        }
        Insert: {
          buyerId: string
          createdAt?: string
          deliveredAt?: string | null
          escrowFee: number
          farmerId: string
          id?: string
          listingId: string
          qrDeliveryHash?: string | null
          qtyPurchased: number
          status?: Database["public"]["Enums"]["OrderStatus"]
          totalPrice: number
        }
        Update: {
          buyerId?: string
          createdAt?: string
          deliveredAt?: string | null
          escrowFee?: number
          farmerId?: string
          id?: string
          listingId?: string
          qrDeliveryHash?: string | null
          qtyPurchased?: number
          status?: Database["public"]["Enums"]["OrderStatus"]
          totalPrice?: number
        }
        Relationships: [
          {
            foreignKeyName: "Order_buyerId_fkey"
            columns: ["buyerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_farmerId_fkey"
            columns: ["farmerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Order_listingId_fkey"
            columns: ["listingId"]
            isOneToOne: false
            referencedRelation: "Listing"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          qr_delivery_hash: string | null
          qty_purchased: number
          status: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          farmer_id: string
          id?: string
          listing_id: string
          origin_lat?: number | null
          origin_lng?: number | null
          qr_delivery_hash?: string | null
          qty_purchased: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          farmer_id?: string
          id?: string
          listing_id?: string
          origin_lat?: number | null
          origin_lng?: number | null
          qr_delivery_hash?: string | null
          qty_purchased?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_logs: {
        Row: {
          avg_temp_celsius: number | null
          crop_cycle_id: string
          date_logged: string
          fungal_risk_factor: number | null
          id: string
          ndvi_score: number | null
          rainfall_mm: number | null
          soil_moisture_percent: number | null
        }
        Insert: {
          avg_temp_celsius?: number | null
          crop_cycle_id: string
          date_logged?: string
          fungal_risk_factor?: number | null
          id?: string
          ndvi_score?: number | null
          rainfall_mm?: number | null
          soil_moisture_percent?: number | null
        }
        Update: {
          avg_temp_celsius?: number | null
          crop_cycle_id?: string
          date_logged?: string
          fungal_risk_factor?: number | null
          id?: string
          ndvi_score?: number | null
          rainfall_mm?: number | null
          soil_moisture_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_logs_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      TelemetryLog: {
        Row: {
          cropCycleId: string
          dateLogged: string
          id: string
          insights: string | null
          ndviScore: number | null
          weatherRisk: number | null
        }
        Insert: {
          cropCycleId: string
          dateLogged: string
          id?: string
          insights?: string | null
          ndviScore?: number | null
          weatherRisk?: number | null
        }
        Update: {
          cropCycleId?: string
          dateLogged?: string
          id?: string
          insights?: string | null
          ndviScore?: number | null
          weatherRisk?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "TelemetryLog_cropCycleId_fkey"
            columns: ["cropCycleId"]
            isOneToOne: false
            referencedRelation: "CropCycle"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          fullName: string
          id: string
          passwordHash: string | null
          phoneNumber: string | null
          platformStatus: Database["public"]["Enums"]["PlatformStatus"]
          role: Database["public"]["Enums"]["Role"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          fullName: string
          id?: string
          passwordHash?: string | null
          phoneNumber?: string | null
          platformStatus?: Database["public"]["Enums"]["PlatformStatus"]
          role: Database["public"]["Enums"]["Role"]
          updatedAt: string
        }
        Update: {
          createdAt?: string
          email?: string
          fullName?: string
          id?: string
          passwordHash?: string | null
          phoneNumber?: string | null
          platformStatus?: Database["public"]["Enums"]["PlatformStatus"]
          role?: Database["public"]["Enums"]["Role"]
          updatedAt?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["platform_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["platform_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["platform_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      Verification: {
        Row: {
          createdAt: string
          documentType: Database["public"]["Enums"]["DocType"]
          documentUrl: string
          id: string
          reviewedBy: string | null
          status: Database["public"]["Enums"]["DocStatus"]
          userId: string
        }
        Insert: {
          createdAt?: string
          documentType: Database["public"]["Enums"]["DocType"]
          documentUrl: string
          id?: string
          reviewedBy?: string | null
          status?: Database["public"]["Enums"]["DocStatus"]
          userId: string
        }
        Update: {
          createdAt?: string
          documentType?: Database["public"]["Enums"]["DocType"]
          documentUrl?: string
          id?: string
          reviewedBy?: string | null
          status?: Database["public"]["Enums"]["DocStatus"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Verification_reviewedBy_fkey"
            columns: ["reviewedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Verification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_status: {
        Args: {
          p_status: Database["public"]["Enums"]["platform_status"]
          p_user_id: string
        }
        Returns: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["platform_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      place_order: {
        Args: { p_listing_id: string; p_qty: number }
        Returns: {
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          qr_delivery_hash: string | null
          qty_purchased: number
          status: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_order: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
        }
        Returns: {
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          qr_delivery_hash: string | null
          qty_purchased: number
          status: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      crop_status: "GROWING" | "MATURE" | "HARVESTED"
      CropCycleStatus: "GROWING" | "MATURE" | "HARVESTED"
      DisputeStatus:
        | "OPEN"
        | "INVESTIGATING"
        | "RESOLVED_REFUND"
        | "RESOLVED_RELEASE"
      DocStatus: "PENDING" | "APPROVED" | "REJECTED"
      DocType: "ID" | "LAND_TITLE" | "QUALITY_CERT"
      listing_status: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "CANCELLED"
      ListingStatus: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "CANCELLED"
      NotifType: "INFO" | "SUCCESS" | "ALERT" | "SYSTEM"
      order_status:
        | "INITIATED"
        | "ESCROW_LOCKED"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "RELEASED"
        | "DISPUTED"
      OrderStatus:
        | "INITIATED"
        | "ESCROW_LOCKED"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "RELEASED"
        | "DISPUTED"
      platform_status: "PENDING" | "VERIFIED" | "SUSPENDED"
      PlatformStatus: "PENDING" | "VERIFIED" | "SUSPENDED"
      Role: "FARMER" | "BUYER" | "ADMIN"
      user_role: "FARMER" | "BUYER" | "ADMIN"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      crop_status: ["GROWING", "MATURE", "HARVESTED"],
      CropCycleStatus: ["GROWING", "MATURE", "HARVESTED"],
      DisputeStatus: [
        "OPEN",
        "INVESTIGATING",
        "RESOLVED_REFUND",
        "RESOLVED_RELEASE",
      ],
      DocStatus: ["PENDING", "APPROVED", "REJECTED"],
      DocType: ["ID", "LAND_TITLE", "QUALITY_CERT"],
      listing_status: ["DRAFT", "ACTIVE", "SOLD_OUT", "CANCELLED"],
      ListingStatus: ["DRAFT", "ACTIVE", "SOLD_OUT", "CANCELLED"],
      NotifType: ["INFO", "SUCCESS", "ALERT", "SYSTEM"],
      order_status: [
        "INITIATED",
        "ESCROW_LOCKED",
        "IN_TRANSIT",
        "DELIVERED",
        "RELEASED",
        "DISPUTED",
      ],
      OrderStatus: [
        "INITIATED",
        "ESCROW_LOCKED",
        "IN_TRANSIT",
        "DELIVERED",
        "RELEASED",
        "DISPUTED",
      ],
      platform_status: ["PENDING", "VERIFIED", "SUSPENDED"],
      PlatformStatus: ["PENDING", "VERIFIED", "SUSPENDED"],
      Role: ["FARMER", "BUYER", "ADMIN"],
      user_role: ["FARMER", "BUYER", "ADMIN"],
    },
  },
} as const

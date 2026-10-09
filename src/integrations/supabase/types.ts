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
          prev_hash: string | null
          row_hash: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id: string
          id?: string
          prev_hash?: string | null
          row_hash?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string
          id?: string
          prev_hash?: string | null
          row_hash?: string | null
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
      commodity_reports: {
        Row: {
          created_at: string
          download_count: number
          id: string
          metrics: Json
          period: string
          price_usd: number
          regions: Json
          report_type: string
          summary: string
          tier: string
          title: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          id?: string
          metrics: Json
          period: string
          price_usd?: number
          regions: Json
          report_type: string
          summary: string
          tier: string
          title: string
        }
        Update: {
          created_at?: string
          download_count?: number
          id?: string
          metrics?: Json
          period?: string
          price_usd?: number
          regions?: Json
          report_type?: string
          summary?: string
          tier?: string
          title?: string
        }
        Relationships: []
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
      dispute_evidence: {
        Row: {
          author_id: string
          body: string
          created_at: string
          dispute_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          dispute_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          ai_triage: Json | null
          created_at: string
          description: string
          id: string
          opened_by: string
          order_id: string
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          ai_triage?: Json | null
          created_at?: string
          description: string
          id?: string
          opened_by: string
          order_id: string
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          ai_triage?: Json | null
          created_at?: string
          description?: string
          id?: string
          opened_by?: string
          order_id?: string
          reason?: Database["public"]["Enums"]["dispute_reason"]
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_public_traces"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      fee_tiers: {
        Row: {
          created_at: string
          id: string
          min_order_total: number
          rate_bps: number
        }
        Insert: {
          created_at?: string
          id?: string
          min_order_total: number
          rate_bps: number
        }
        Update: {
          created_at?: string
          id?: string
          min_order_total?: number
          rate_bps?: number
        }
        Relationships: []
      }
      forward_contracts: {
        Row: {
          accepted_at: string | null
          buyer_id: string | null
          created_at: string
          crop_cycle_id: string
          delivery_date: string
          farmer_id: string
          id: string
          price_per_ton: number
          qty_tons: number
          status: Database["public"]["Enums"]["forward_status"]
        }
        Insert: {
          accepted_at?: string | null
          buyer_id?: string | null
          created_at?: string
          crop_cycle_id: string
          delivery_date: string
          farmer_id: string
          id?: string
          price_per_ton: number
          qty_tons: number
          status?: Database["public"]["Enums"]["forward_status"]
        }
        Update: {
          accepted_at?: string | null
          buyer_id?: string | null
          created_at?: string
          crop_cycle_id?: string
          delivery_date?: string
          farmer_id?: string
          id?: string
          price_per_ton?: number
          qty_tons?: number
          status?: Database["public"]["Enums"]["forward_status"]
        }
        Relationships: [
          {
            foreignKeyName: "forward_contracts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forward_contracts_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forward_contracts_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "order_public_traces"
            referencedColumns: ["crop_cycle_id"]
          },
          {
            foreignKeyName: "forward_contracts_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          automated_checks: Json
          automated_score: number
          created_at: string
          document_number: string
          document_type: string
          document_url: string | null
          full_name: string
          id: string
          issuing_authority: string
          rejection_reason: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          automated_checks?: Json
          automated_score?: number
          created_at?: string
          document_number: string
          document_type: string
          document_url?: string | null
          full_name: string
          id?: string
          issuing_authority: string
          rejection_reason?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          automated_checks?: Json
          automated_score?: number
          created_at?: string
          document_number?: string
          document_type?: string
          document_url?: string | null
          full_name?: string
          id?: string
          issuing_authority?: string
          rejection_reason?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_verifications_user_id_fkey"
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
          {
            foreignKeyName: "listings_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "order_public_traces"
            referencedColumns: ["crop_cycle_id"]
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
          bkash_sender_number: string | null
          bkash_trx_id: string | null
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          expires_at: string | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          payment_method: string | null
          payment_submitted_at: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          platform_fee: number
          platform_fee_bps: number
          qr_delivery_hash: string | null
          qty_purchased: number
          status: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          bkash_sender_number?: string | null
          bkash_trx_id?: string | null
          buyer_id: string
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          expires_at?: string | null
          farmer_id: string
          id?: string
          listing_id: string
          origin_lat?: number | null
          origin_lng?: number | null
          payment_method?: string | null
          payment_submitted_at?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          platform_fee?: number
          platform_fee_bps?: number
          qr_delivery_hash?: string | null
          qty_purchased: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          bkash_sender_number?: string | null
          bkash_trx_id?: string | null
          buyer_id?: string
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          expires_at?: string | null
          farmer_id?: string
          id?: string
          listing_id?: string
          origin_lat?: number | null
          origin_lng?: number | null
          payment_method?: string | null
          payment_submitted_at?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          platform_fee?: number
          platform_fee_bps?: number
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
          {
            foreignKeyName: "orders_payment_verified_by_fkey"
            columns: ["payment_verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          action_title: string
          applied_at: string | null
          category: string
          created_at: string
          crop_cycle_id: string
          dosage_instruction: string
          farmer_id: string
          id: string
          rationale: string
          status: string
          target_date: string
          urgency: string
        }
        Insert: {
          action_title: string
          applied_at?: string | null
          category: string
          created_at?: string
          crop_cycle_id: string
          dosage_instruction: string
          farmer_id: string
          id?: string
          rationale: string
          status?: string
          target_date: string
          urgency: string
        }
        Update: {
          action_title?: string
          applied_at?: string | null
          category?: string
          created_at?: string
          crop_cycle_id?: string
          dosage_instruction?: string
          farmer_id?: string
          id?: string
          rationale?: string
          status?: string
          target_date?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "order_public_traces"
            referencedColumns: ["crop_cycle_id"]
          },
          {
            foreignKeyName: "prescriptions_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_shortage_forecasts: {
        Row: {
          confidence_score: number
          crop_type: string
          deficit_surplus_tons: number | null
          forecast_month: string
          historical_price_benchmark_usd: number
          id: string
          price_trend_pct: number
          projected_demand_tons: number
          projected_price_benchmark_usd: number
          projected_supply_tons: number
          recommended_action: string
          region: string
          shortage_risk: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number
          crop_type: string
          deficit_surplus_tons?: number | null
          forecast_month: string
          historical_price_benchmark_usd: number
          id?: string
          price_trend_pct: number
          projected_demand_tons: number
          projected_price_benchmark_usd: number
          projected_supply_tons: number
          recommended_action: string
          region: string
          shortage_risk: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number
          crop_type?: string
          deficit_surplus_tons?: number | null
          forecast_month?: string
          historical_price_benchmark_usd?: number
          id?: string
          price_trend_pct?: number
          projected_demand_tons?: number
          projected_price_benchmark_usd?: number
          projected_supply_tons?: number
          recommended_action?: string
          region?: string
          shortage_risk?: string
          updated_at?: string
        }
        Relationships: []
      }
      rfq_bids: {
        Row: {
          created_at: string
          farmer_id: string
          id: string
          note: string | null
          price_per_ton: number
          qty_tons: number
          rfq_id: string
          status: Database["public"]["Enums"]["bid_status"]
        }
        Insert: {
          created_at?: string
          farmer_id: string
          id?: string
          note?: string | null
          price_per_ton: number
          qty_tons: number
          rfq_id: string
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Update: {
          created_at?: string
          farmer_id?: string
          id?: string
          note?: string | null
          price_per_ton?: number
          qty_tons?: number
          rfq_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rfq_bids_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_bids_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          awarded_bid_id: string | null
          buyer_id: string
          created_at: string
          crop_type: string
          deadline: string
          id: string
          max_price_per_ton: number
          notes: string | null
          qty_tons: number
          status: Database["public"]["Enums"]["rfq_status"]
        }
        Insert: {
          awarded_bid_id?: string | null
          buyer_id: string
          created_at?: string
          crop_type: string
          deadline: string
          id?: string
          max_price_per_ton: number
          notes?: string | null
          qty_tons: number
          status?: Database["public"]["Enums"]["rfq_status"]
        }
        Update: {
          awarded_bid_id?: string | null
          buyer_id?: string
          created_at?: string
          crop_type?: string
          deadline?: string
          id?: string
          max_price_per_ton?: number
          notes?: string | null
          qty_tons?: number
          status?: Database["public"]["Enums"]["rfq_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_awarded_bid_fk"
            columns: ["awarded_bid_id"]
            isOneToOne: false
            referencedRelation: "rfq_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_devices: {
        Row: {
          battery_level: number
          created_at: string
          crop_cycle_id: string
          device_serial: string
          device_type: string
          id: string
          last_ping: string | null
          status: string
        }
        Insert: {
          battery_level?: number
          created_at?: string
          crop_cycle_id: string
          device_serial: string
          device_type: string
          id?: string
          last_ping?: string | null
          status?: string
        }
        Update: {
          battery_level?: number
          created_at?: string
          crop_cycle_id?: string
          device_serial?: string
          device_type?: string
          id?: string
          last_ping?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensor_devices_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_devices_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "order_public_traces"
            referencedColumns: ["crop_cycle_id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier_name: string
          created_at: string
          current_lat: number | null
          current_lng: number | null
          driver_name: string | null
          id: string
          order_id: string
          status: string
          tracking_number: string
          updated_at: string
          vehicle_plate: string | null
          waypoints: Json
        }
        Insert: {
          carrier_name: string
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          driver_name?: string | null
          id?: string
          order_id: string
          status?: string
          tracking_number: string
          updated_at?: string
          vehicle_plate?: string | null
          waypoints?: Json
        }
        Update: {
          carrier_name?: string
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          driver_name?: string | null
          id?: string
          order_id?: string
          status?: string
          tracking_number?: string
          updated_at?: string
          vehicle_plate?: string | null
          waypoints?: Json
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "order_public_traces"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
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
          npk_nitrogen: number | null
          npk_phosphorus: number | null
          npk_potassium: number | null
          rainfall_mm: number | null
          soil_moisture_percent: number | null
          soil_ph: number | null
          source: string
        }
        Insert: {
          avg_temp_celsius?: number | null
          crop_cycle_id: string
          date_logged?: string
          fungal_risk_factor?: number | null
          id?: string
          ndvi_score?: number | null
          npk_nitrogen?: number | null
          npk_phosphorus?: number | null
          npk_potassium?: number | null
          rainfall_mm?: number | null
          soil_moisture_percent?: number | null
          soil_ph?: number | null
          source?: string
        }
        Update: {
          avg_temp_celsius?: number | null
          crop_cycle_id?: string
          date_logged?: string
          fungal_risk_factor?: number | null
          id?: string
          ndvi_score?: number | null
          npk_nitrogen?: number | null
          npk_phosphorus?: number | null
          npk_potassium?: number | null
          rainfall_mm?: number | null
          soil_moisture_percent?: number | null
          soil_ph?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_logs_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_logs_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "order_public_traces"
            referencedColumns: ["crop_cycle_id"]
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
      underwriting_passports: {
        Row: {
          created_at: string
          credit_score: number
          crop_cycle_id: string
          farmer_id: string
          id: string
          max_eligible_credit: number
          metrics_snapshot: Json
          ndvi_stability_index: number
          parametric_coverage: number
          passport_hash: string
          risk_tier: string
          weather_hazard_index: number
        }
        Insert: {
          created_at?: string
          credit_score: number
          crop_cycle_id: string
          farmer_id: string
          id?: string
          max_eligible_credit: number
          metrics_snapshot?: Json
          ndvi_stability_index: number
          parametric_coverage: number
          passport_hash: string
          risk_tier: string
          weather_hazard_index: number
        }
        Update: {
          created_at?: string
          credit_score?: number
          crop_cycle_id?: string
          farmer_id?: string
          id?: string
          max_eligible_credit?: number
          metrics_snapshot?: Json
          ndvi_stability_index?: number
          parametric_coverage?: number
          passport_hash?: string
          risk_tier?: string
          weather_hazard_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_passports_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_passports_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "order_public_traces"
            referencedColumns: ["crop_cycle_id"]
          },
          {
            foreignKeyName: "underwriting_passports_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      order_public_traces: {
        Row: {
          batch_status: Database["public"]["Enums"]["order_status"] | null
          crop_cycle_id: string | null
          crop_type: string | null
          delivered_at: string | null
          farm_name: string | null
          farmer_name: string | null
          harvest_date: string | null
          location_name: string | null
          order_id: string | null
          qr_delivery_hash: string | null
          quality_grade: string | null
          quantity_tons: number | null
          sown_date: string | null
          total_hectares: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_forward_contract: {
        Args: { p_id: string }
        Returns: {
          accepted_at: string | null
          buyer_id: string | null
          created_at: string
          crop_cycle_id: string
          delivery_date: string
          farmer_id: string
          id: string
          price_per_ton: number
          qty_tons: number
          status: Database["public"]["Enums"]["forward_status"]
        }
        SetofOptions: {
          from: "*"
          to: "forward_contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_dispute_evidence: {
        Args: { p_body: string; p_dispute_id: string }
        Returns: {
          author_id: string
          body: string
          created_at: string
          dispute_id: string
          id: string
        }
        SetofOptions: {
          from: "*"
          to: "dispute_evidence"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      audit_row_hash: {
        Args: {
          p_prev: string
          r: Database["public"]["Tables"]["audit_log"]["Row"]
        }
        Returns: string
      }
      award_bid: {
        Args: { p_bid_id: string }
        Returns: {
          awarded_bid_id: string | null
          buyer_id: string
          created_at: string
          crop_type: string
          deadline: string
          id: string
          max_price_per_ton: number
          notes: string | null
          qty_tons: number
          status: Database["public"]["Enums"]["rfq_status"]
        }
        SetofOptions: {
          from: "*"
          to: "rfqs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_forward_contract: { Args: { p_id: string }; Returns: undefined }
      cancel_rfq: { Args: { p_rfq_id: string }; Returns: undefined }
      cancel_unpaid_order: {
        Args: { p_order_id: string }
        Returns: {
          bkash_sender_number: string | null
          bkash_trx_id: string | null
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          expires_at: string | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          payment_method: string | null
          payment_submitted_at: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          platform_fee: number
          platform_fee_bps: number
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
      committed_tons: { Args: { p_cycle: string }; Returns: number }
      compute_platform_fee_bps: { Args: { p_total: number }; Returns: number }
      create_forward_contract: {
        Args: {
          p_cycle: string
          p_delivery: string
          p_price: number
          p_qty: number
        }
        Returns: {
          accepted_at: string | null
          buyer_id: string | null
          created_at: string
          crop_cycle_id: string
          delivery_date: string
          farmer_id: string
          id: string
          price_per_ton: number
          qty_tons: number
          status: Database["public"]["Enums"]["forward_status"]
        }
        SetofOptions: {
          from: "*"
          to: "forward_contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_rfq: {
        Args: {
          p_crop: string
          p_deadline: string
          p_max_price: number
          p_notes?: string
          p_qty: number
        }
        Returns: {
          awarded_bid_id: string | null
          buyer_id: string
          created_at: string
          crop_type: string
          deadline: string
          id: string
          max_price_per_ton: number
          notes: string | null
          qty_tons: number
          status: Database["public"]["Enums"]["rfq_status"]
        }
        SetofOptions: {
          from: "*"
          to: "rfqs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dispatch_shipment: {
        Args: {
          p_carrier: string
          p_driver_name?: string
          p_order_id: string
          p_vehicle?: string
        }
        Returns: {
          carrier_name: string
          created_at: string
          current_lat: number | null
          current_lng: number | null
          driver_name: string | null
          id: string
          order_id: string
          status: string
          tracking_number: string
          updated_at: string
          vehicle_plate: string | null
          waypoints: Json
        }
        SetofOptions: {
          from: "*"
          to: "shipments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      download_commodity_report: {
        Args: { p_report_id: string }
        Returns: {
          created_at: string
          download_count: number
          id: string
          metrics: Json
          period: string
          price_usd: number
          regions: Json
          report_type: string
          summary: string
          tier: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "commodity_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_cycle_prescriptions: {
        Args: { p_cycle_id: string }
        Returns: {
          action_title: string
          applied_at: string | null
          category: string
          created_at: string
          crop_cycle_id: string
          dosage_instruction: string
          farmer_id: string
          id: string
          rationale: string
          status: string
          target_date: string
          urgency: string
        }[]
        SetofOptions: {
          from: "*"
          to: "prescriptions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_underwriting_passport: {
        Args: { p_cycle_id: string }
        Returns: {
          created_at: string
          credit_score: number
          crop_cycle_id: string
          farmer_id: string
          id: string
          max_eligible_credit: number
          metrics_snapshot: Json
          ndvi_stability_index: number
          parametric_coverage: number
          passport_hash: string
          risk_tier: string
          weather_hazard_index: number
        }
        SetofOptions: {
          from: "*"
          to: "underwriting_passports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_kyc_queue: {
        Args: { p_status?: string }
        Returns: {
          automated_checks: Json
          automated_score: number
          created_at: string
          document_number: string
          document_type: string
          document_url: string | null
          full_name: string
          id: string
          issuing_authority: string
          rejection_reason: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "kyc_verifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_public_trace: { Args: { p_order_id: string }; Returns: Json }
      get_regional_commodity_index: {
        Args: { p_crop_type?: string }
        Returns: {
          active_cycles_count: number
          crop_type: string
          mean_ndvi_score: number
          projected_volume_tons: number
          region: string
          total_hectares: number
        }[]
      }
      get_regional_forecasts: {
        Args: { p_crop_type?: string; p_region?: string }
        Returns: {
          confidence_score: number
          crop_type: string
          deficit_surplus_tons: number | null
          forecast_month: string
          historical_price_benchmark_usd: number
          id: string
          price_trend_pct: number
          projected_demand_tons: number
          projected_price_benchmark_usd: number
          projected_supply_tons: number
          recommended_action: string
          region: string
          shortage_risk: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "regional_shortage_forecasts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ingest_sensor_telemetry: {
        Args: {
          p_cycle_id: string
          p_device_serial: string
          p_k: number
          p_moisture: number
          p_n: number
          p_p: number
          p_ph: number
          p_rain: number
          p_temp: number
        }
        Returns: {
          avg_temp_celsius: number | null
          crop_cycle_id: string
          date_logged: string
          fungal_risk_factor: number | null
          id: string
          ndvi_score: number | null
          npk_nitrogen: number | null
          npk_phosphorus: number | null
          npk_potassium: number | null
          rainfall_mm: number | null
          soil_moisture_percent: number | null
          soil_ph: number | null
          source: string
        }
        SetofOptions: {
          from: "*"
          to: "telemetry_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      mark_prescription_applied: {
        Args: { p_prescription_id: string; p_status: string }
        Returns: {
          action_title: string
          applied_at: string | null
          category: string
          created_at: string
          crop_cycle_id: string
          dosage_instruction: string
          farmer_id: string
          id: string
          rationale: string
          status: string
          target_date: string
          urgency: string
        }
        SetofOptions: {
          from: "*"
          to: "prescriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      open_dispute: {
        Args: {
          p_description: string
          p_order_id: string
          p_reason: Database["public"]["Enums"]["dispute_reason"]
        }
        Returns: {
          ai_triage: Json | null
          created_at: string
          description: string
          id: string
          opened_by: string
          order_id: string
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        SetofOptions: {
          from: "*"
          to: "disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      place_order: {
        Args: { p_listing_id: string; p_qty: number }
        Returns: {
          bkash_sender_number: string | null
          bkash_trx_id: string | null
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          expires_at: string | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          payment_method: string | null
          payment_submitted_at: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          platform_fee: number
          platform_fee_bps: number
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
      record_audit_entry: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity: string
          p_entity_id: string
        }
        Returns: string
      }
      register_sensor_device: {
        Args: {
          p_cycle_id: string
          p_device_serial: string
          p_device_type: string
        }
        Returns: {
          battery_level: number
          created_at: string
          crop_cycle_id: string
          device_serial: string
          device_type: string
          id: string
          last_ping: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "sensor_devices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_dispute: {
        Args: {
          p_dispute_id: string
          p_note: string
          p_outcome: Database["public"]["Enums"]["dispute_status"]
        }
        Returns: {
          ai_triage: Json | null
          created_at: string
          description: string
          id: string
          opened_by: string
          order_id: string
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        SetofOptions: {
          from: "*"
          to: "disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_kyc_application: {
        Args: {
          p_decision: string
          p_notes?: string
          p_verification_id: string
        }
        Returns: {
          automated_checks: Json
          automated_score: number
          created_at: string
          document_number: string
          document_type: string
          document_url: string | null
          full_name: string
          id: string
          issuing_authority: string
          rejection_reason: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "kyc_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_fee_tiers: { Args: { p_tiers: Json }; Returns: undefined }
      submit_bid: {
        Args: {
          p_note?: string
          p_price: number
          p_qty: number
          p_rfq_id: string
        }
        Returns: {
          created_at: string
          farmer_id: string
          id: string
          note: string | null
          price_per_ton: number
          qty_tons: number
          rfq_id: string
          status: Database["public"]["Enums"]["bid_status"]
        }
        SetofOptions: {
          from: "*"
          to: "rfq_bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_bkash_payment: {
        Args: { p_order_id: string; p_sender_number: string; p_trx_id: string }
        Returns: {
          bkash_sender_number: string | null
          bkash_trx_id: string | null
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          expires_at: string | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          payment_method: string | null
          payment_submitted_at: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          platform_fee: number
          platform_fee_bps: number
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
      submit_kyc_application: {
        Args: {
          p_document_number: string
          p_document_type: string
          p_document_url?: string
          p_full_name: string
          p_issuing_authority: string
          p_metadata?: Json
        }
        Returns: {
          automated_checks: Json
          automated_score: number
          created_at: string
          document_number: string
          document_type: string
          document_url: string | null
          full_name: string
          id: string
          issuing_authority: string
          rejection_reason: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "kyc_verifications"
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
          bkash_sender_number: string | null
          bkash_trx_id: string | null
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          expires_at: string | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          payment_method: string | null
          payment_submitted_at: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          platform_fee: number
          platform_fee_bps: number
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
      triage_dispute: { Args: { p_dispute_id: string }; Returns: Json }
      update_shipment_telemetry: {
        Args: {
          p_lat: number
          p_lng: number
          p_note?: string
          p_shipment_id: string
          p_status?: string
        }
        Returns: {
          carrier_name: string
          created_at: string
          current_lat: number | null
          current_lng: number | null
          driver_name: string | null
          id: string
          order_id: string
          status: string
          tracking_number: string
          updated_at: string
          vehicle_plate: string | null
          waypoints: Json
        }
        SetofOptions: {
          from: "*"
          to: "shipments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_audit_chain: {
        Args: never
        Returns: {
          broken_id: string
          checked: number
          ok: boolean
        }[]
      }
      verify_bkash_payment: {
        Args: { p_approved: boolean; p_note?: string; p_order_id: string }
        Returns: {
          bkash_sender_number: string | null
          bkash_trx_id: string | null
          buyer_id: string
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          expires_at: string | null
          farmer_id: string
          id: string
          listing_id: string
          origin_lat: number | null
          origin_lng: number | null
          payment_method: string | null
          payment_submitted_at: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          platform_fee: number
          platform_fee_bps: number
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
      withdraw_bid: { Args: { p_bid_id: string }; Returns: undefined }
    }
    Enums: {
      bid_status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"
      crop_status: "GROWING" | "MATURE" | "HARVESTED"
      CropCycleStatus: "GROWING" | "MATURE" | "HARVESTED"
      dispute_reason:
        | "WEIGHT_MISMATCH"
        | "QUALITY_MISMATCH"
        | "NON_DELIVERY"
        | "OTHER"
      dispute_status: "OPEN" | "RESOLVED_RELEASE" | "RESOLVED_REFUND"
      DisputeStatus:
        | "OPEN"
        | "INVESTIGATING"
        | "RESOLVED_REFUND"
        | "RESOLVED_RELEASE"
      DocStatus: "PENDING" | "APPROVED" | "REJECTED"
      DocType: "ID" | "LAND_TITLE" | "QUALITY_CERT"
      forward_status: "OFFERED" | "ACCEPTED" | "CANCELLED"
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
        | "REFUNDED"
        | "PAYMENT_SUBMITTED"
        | "CANCELLED"
      OrderStatus:
        | "INITIATED"
        | "ESCROW_LOCKED"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "RELEASED"
        | "DISPUTED"
      platform_status: "PENDING" | "VERIFIED" | "SUSPENDED"
      PlatformStatus: "PENDING" | "VERIFIED" | "SUSPENDED"
      rfq_status: "OPEN" | "AWARDED" | "CANCELLED"
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
      bid_status: ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"],
      crop_status: ["GROWING", "MATURE", "HARVESTED"],
      CropCycleStatus: ["GROWING", "MATURE", "HARVESTED"],
      dispute_reason: [
        "WEIGHT_MISMATCH",
        "QUALITY_MISMATCH",
        "NON_DELIVERY",
        "OTHER",
      ],
      dispute_status: ["OPEN", "RESOLVED_RELEASE", "RESOLVED_REFUND"],
      DisputeStatus: [
        "OPEN",
        "INVESTIGATING",
        "RESOLVED_REFUND",
        "RESOLVED_RELEASE",
      ],
      DocStatus: ["PENDING", "APPROVED", "REJECTED"],
      DocType: ["ID", "LAND_TITLE", "QUALITY_CERT"],
      forward_status: ["OFFERED", "ACCEPTED", "CANCELLED"],
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
        "REFUNDED",
        "PAYMENT_SUBMITTED",
        "CANCELLED",
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
      rfq_status: ["OPEN", "AWARDED", "CANCELLED"],
      Role: ["FARMER", "BUYER", "ADMIN"],
      user_role: ["FARMER", "BUYER", "ADMIN"],
    },
  },
} as const

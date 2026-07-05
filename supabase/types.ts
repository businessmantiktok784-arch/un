export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json
          path: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      browse_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "browse_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "browse_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          id: string
          document_id: string
          reporter_id: string
          reason: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          reporter_id: string
          reason: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          reporter_id?: string
          reason?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          id: string
          course_code: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_code: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_code?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          body: string
          created_at: string
          email: string
          id: string
          name: string
          replied_at: string | null
          replied_by: string | null
          reply_body: string | null
          status: Database["public"]["Enums"]["contact_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          email: string
          id?: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          reply_body?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          reply_body?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_comments: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          document_id: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          document_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          document_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_downloads: {
        Row: {
          created_at: string
          credits_spent: number
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_spent?: number
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_spent?: number
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_downloads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_ratings: {
        Row: {
          document_id: string
          rating: number
          user_id: string
        }
        Insert: {
          document_id: string
          rating: number
          user_id: string
        }
        Update: {
          document_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_ratings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          answers_count: number
          course_code: string | null
          created_at: string
          details: string | null
          id: string
          requester_id: string
          status: string
          title: string
          university: string | null
          updated_at: string
          votes_count: number
        }
        Insert: {
          answers_count?: number
          course_code?: string | null
          created_at?: string
          details?: string | null
          id?: string
          requester_id: string
          status?: string
          title: string
          university?: string | null
          updated_at?: string
          votes_count?: number
        }
        Update: {
          answers_count?: number
          course_code?: string | null
          created_at?: string
          details?: string | null
          id?: string
          requester_id?: string
          status?: string
          title?: string
          university?: string | null
          updated_at?: string
          votes_count?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          academic_year: string | null
          campus: string | null
          course_code: string
          course_name: string | null
          created_at: string
          department: string | null
          description: string | null
          doc_type: Database["public"]["Enums"]["document_type"]
          downloads_count: number
          exam_year: number | null
          faculty: string | null
          file_hash: string | null
          file_size_bytes: number
          id: string
          is_sponsored: boolean
          mime_type: string
          page_count: number | null
          rating_avg: number
          rating_count: number
          rejection_reason: string | null
          semester: string | null
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string
          tags: string[] | null
          title: string
          university: string
          updated_at: string
          uploader_id: string
        }
        Insert: {
          academic_year?: string | null
          campus?: string | null
          course_code: string
          course_name?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          downloads_count?: number
          exam_year?: number | null
          faculty?: string | null
          file_hash?: string | null
          file_size_bytes: number
          id?: string
          is_sponsored?: boolean
          mime_type?: string
          page_count?: number | null
          rating_avg?: number
          rating_count?: number
          rejection_reason?: string | null
          semester?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path: string
          tags?: string[] | null
          title: string
          university: string
          updated_at?: string
          uploader_id: string
        }
        Update: {
          academic_year?: string | null
          campus?: string | null
          course_code?: string
          course_name?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          downloads_count?: number
          exam_year?: number | null
          faculty?: string | null
          file_hash?: string | null
          file_size_bytes?: number
          id?: string
          is_sponsored?: boolean
          mime_type?: string
          page_count?: number | null
          rating_avg?: number
          rating_count?: number
          rejection_reason?: string | null
          semester?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string
          tags?: string[] | null
          title?: string
          university?: string
          updated_at?: string
          uploader_id?: string
        }
        Relationships: []
      }
      donation_settings: {
        Row: {
          id: string
          momo_number: string | null
          momo_name: string | null
          enabled: boolean
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          momo_number?: string | null
          momo_name?: string | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          momo_number?: string | null
          momo_name?: string | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json
          path: string | null
          severity: string
          stack: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          path?: string | null
          severity?: string
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          path?: string | null
          severity?: string
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          admin_notes: string | null
          completed_at: string | null
          created_at: string
          id: string
          reason: string | null
          request_type: Database["public"]["Enums"]["gdpr_request_type"]
          status: Database["public"]["Enums"]["gdpr_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          request_type: Database["public"]["Enums"]["gdpr_request_type"]
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          request_type?: Database["public"]["Enums"]["gdpr_request_type"]
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_subscriptions: {
        Row: {
          document_replies: boolean
          opportunities: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          document_replies?: boolean
          opportunities?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          document_replies?: boolean
          opportunities?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          category: string | null
          country: string | null
          created_at: string
          deadline: string | null
          description: string | null
          featured: boolean
          id: string
          link: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          submitted_by: string | null
          title: string
          type: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          link?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submitted_by?: string | null
          title: string
          type?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          link?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submitted_by?: string | null
          title?: string
          type?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          campus: string | null
          created_at: string
          email: string | null
          faculty: string | null
          full_name: string | null
          id: string
          program: string | null
          suspended: boolean
          university: string | null
          updated_at: string
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          campus?: string | null
          created_at?: string
          email?: string | null
          faculty?: string | null
          full_name?: string | null
          id: string
          program?: string | null
          suspended?: boolean
          university?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          campus?: string | null
          created_at?: string
          email?: string | null
          faculty?: string | null
          full_name?: string | null
          id?: string
          program?: string | null
          suspended?: boolean
          university?: string | null
          updated_at?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          rewarded: boolean
          rewarded_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          rewarded?: boolean
          rewarded_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          rewarded?: boolean
          rewarded_at?: string | null
        }
        Relationships: []
      }
      request_answers: {
        Row: {
          body: string | null
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          request_id: string
          responder_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          request_id: string
          responder_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          request_id?: string
          responder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_answers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_votes: {
        Row: {
          created_at: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          platform_name: string | null
          support_email: string | null
          auto_approve: boolean
          email_notifications: boolean
          maintenance_mode: boolean
          play_store_url: string | null
          app_store_url: string | null
          play_store_enabled: boolean
          app_store_enabled: boolean
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          platform_name?: string | null
          support_email?: string | null
          auto_approve?: boolean
          email_notifications?: boolean
          maintenance_mode?: boolean
          play_store_url?: string | null
          app_store_url?: string | null
          play_store_enabled?: boolean
          app_store_enabled?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          platform_name?: string | null
          support_email?: string | null
          auto_approve?: boolean
          email_notifications?: boolean
          maintenance_mode?: boolean
          play_store_url?: string | null
          app_store_url?: string | null
          play_store_enabled?: boolean
          app_store_enabled?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      support_content: {
        Row: {
          body: string | null
          created_at: string
          id: string
          key: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          key: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          key?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          featured: boolean
          id: string
          photo_url: string | null
          quote: string
          status: Database["public"]["Enums"]["testimonial_status"]
          student_name: string
          submitted_by: string | null
          university: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          featured?: boolean
          id?: string
          photo_url?: string | null
          quote: string
          status?: Database["public"]["Enums"]["testimonial_status"]
          student_name: string
          submitted_by?: string | null
          university?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          featured?: boolean
          id?: string
          photo_url?: string | null
          quote?: string
          status?: Database["public"]["Enums"]["testimonial_status"]
          student_name?: string
          submitted_by?: string | null
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          abbr: string | null
          campuses: string[]
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          abbr?: string | null
          campuses?: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          abbr?: string | null
          campuses?: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      view_history: {
        Row: {
          document_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          document_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          document_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "view_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      campuses: {
        Row: {
          id: string
          location: string | null
          name: string
          university: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
    }
    Functions: {
      admin_suspend_user: {
        Args: { _suspend: boolean; _target: string }
        Returns: boolean
      }
      export_my_data: { Args: never; Returns: Json }
      find_duplicate_documents: {
        Args: never
        Returns: {
          doc_count: number
          document_ids: string[]
          file_hash: string
          titles: string[]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type?: string
          _metadata?: Json
        }
        Returns: string
      }
      notify_admins: {
        Args: { _body: string; _link: string; _title: string; _type: string }
        Returns: undefined
      }
      request_account_deletion: {
        Args: { _reason?: string }
        Returns: {
          admin_notes: string | null
          completed_at: string | null
          created_at: string
          id: string
          reason: string | null
          request_type: Database["public"]["Enums"]["gdpr_request_type"]
          status: Database["public"]["Enums"]["gdpr_request_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "gdpr_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sync_admin_role: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "org_admin" | "manager" | "staff" | "moderator" | "user"
      contact_status: "new" | "replied" | "resolved"
      document_status: "pending" | "approved" | "rejected"
      document_type:
        | "Exam"
        | "CAT"
        | "Assignment"
        | "Notes"
        | "Lab Report"
        | "Project"
        | "Past Paper"
        | "Other"
      gdpr_request_status: "pending" | "processing" | "completed" | "rejected"
      gdpr_request_type: "export" | "delete"
      opportunity_status: "pending" | "approved" | "rejected"
      testimonial_status: "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: ["super_admin", "org_admin", "manager", "staff", "moderator", "user"],
      contact_status: ["new", "replied", "resolved"],
      document_status: ["pending", "approved", "rejected"],
      document_type: [
        "Exam",
        "CAT",
        "Assignment",
        "Notes",
        "Lab Report",
        "Project",
        "Past Paper",
        "Other",
      ],
      gdpr_request_status: ["pending", "processing", "completed", "rejected"],
      gdpr_request_type: ["export", "delete"],
      opportunity_status: ["pending", "approved", "rejected"],
      testimonial_status: ["pending", "approved", "rejected"],
    },
  },
} as const

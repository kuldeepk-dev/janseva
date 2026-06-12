export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "citizen" | "operator" | "leader" | "admin";
          full_name: string | null;
          mobile: string | null;
          email: string | null;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "citizen" | "operator" | "leader" | "admin";
          full_name?: string | null;
          mobile?: string | null;
          email?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: "citizen" | "operator" | "leader" | "admin";
          full_name?: string | null;
          mobile?: string | null;
          email?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      voters: {
        Row: {
          id: string;
          profile_id: string | null;
          full_name: string | null;
          father_name: string | null;
          dob: string | null;
          voter_id: string | null;
          occupation: string | null;
          gender: string | null;
          village: string | null;
          panchayat: string | null;
          booth_number: string | null;
          photo_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          full_name?: string | null;
          father_name?: string | null;
          dob?: string | null;
          voter_id?: string | null;
          occupation?: string | null;
          gender?: string | null;
          village?: string | null;
          panchayat?: string | null;
          booth_number?: string | null;
          photo_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          father_name?: string | null;
          dob?: string | null;
          voter_id?: string | null;
          occupation?: string | null;
          gender?: string | null;
          village?: string | null;
          panchayat?: string | null;
          booth_number?: string | null;
          photo_url?: string | null;
          updated_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          voter_id: string | null;
          name: string | null;
          relation: string | null;
          age: number | null;
          voter_card_id: string | null;
        };
        Insert: {
          id?: string;
          voter_id?: string | null;
          name?: string | null;
          relation?: string | null;
          age?: number | null;
          voter_card_id?: string | null;
        };
        Update: {
          name?: string | null;
          relation?: string | null;
          age?: number | null;
          voter_card_id?: string | null;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: string | null;
        };
      };
      complaints: {
        Row: {
          id: string;
          complaint_number: string | null;
          citizen_profile_id: string | null;
          voter_id: string | null;
          submitted_by: string | null;
          created_by_role: "citizen" | "operator" | "leader" | "admin" | null;
          created_by_user_id: string | null;
          created_on_behalf_of_citizen_id: string | null;
          source: "citizen" | "operator" | null;
          reported_citizen_name: string | null;
          reported_citizen_mobile: string | null;
          category: string | null;
          sub_category: string | null;
          description: string | null;
          location_text: string | null;
          attachment_url: string | null;
          assigned_department_id: string | null;
          priority: "normal" | "urgent" | "critical" | null;
          status:
            | "unassigned"
            | "assigned"
            | "acknowledged"
            | "in_progress"
            | "resolved"
            | "escalated"
            | "closed"
            | "reopened"
            | null;
          internal_notes: string | null;
          resolution_note: string | null;
          resolution_details: string | null;
          expected_resolution_at: string | null;
          resolved_at: string | null;
          reopened_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          complaint_number?: string | null;
          citizen_profile_id?: string | null;
          voter_id?: string | null;
          submitted_by?: string | null;
          created_by_role?: "citizen" | "operator" | "leader" | "admin" | null;
          created_by_user_id?: string | null;
          created_on_behalf_of_citizen_id?: string | null;
          source?: "citizen" | "operator" | null;
          reported_citizen_name?: string | null;
          reported_citizen_mobile?: string | null;
          category?: string | null;
          sub_category?: string | null;
          description?: string | null;
          location_text?: string | null;
          attachment_url?: string | null;
          assigned_department_id?: string | null;
          priority?: "normal" | "urgent" | "critical" | null;
          status?:
            | "unassigned"
            | "assigned"
            | "acknowledged"
            | "in_progress"
            | "resolved"
            | "escalated"
            | "closed"
            | "reopened"
            | null;
          internal_notes?: string | null;
          resolution_note?: string | null;
          resolution_details?: string | null;
          expected_resolution_at?: string | null;
          resolved_at?: string | null;
          reopened_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          citizen_profile_id?: string | null;
          category?: string | null;
          sub_category?: string | null;
          description?: string | null;
          location_text?: string | null;
          attachment_url?: string | null;
          assigned_department_id?: string | null;
          priority?: "normal" | "urgent" | "critical" | null;
          status?:
            | "unassigned"
            | "assigned"
            | "acknowledged"
            | "in_progress"
            | "resolved"
            | "escalated"
            | "closed"
            | "reopened"
            | null;
          internal_notes?: string | null;
          resolution_note?: string | null;
          resolution_details?: string | null;
          expected_resolution_at?: string | null;
          resolved_at?: string | null;
          reopened_at?: string | null;
          closed_at?: string | null;
          updated_at?: string;
        };
      };
      complaint_timeline: {
        Row: {
          id: string;
          complaint_id: string | null;
          actor_profile_id: string | null;
          old_status: string | null;
          new_status: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id?: string | null;
          actor_profile_id?: string | null;
          old_status?: string | null;
          new_status?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          old_status?: string | null;
          new_status?: string | null;
          note?: string | null;
        };
      };
      social_posts: {
        Row: {
          id: string;
          author_profile_id: string | null;
          title: string | null;
          content: string | null;
          category: string | null;
          location_text: string | null;
          image_url: string | null;
          audience: "public" | "registered_citizens" | null;
          status:
            | "draft"
            | "pending_approval"
            | "published"
            | "archived"
            | null;
          whatsapp_broadcast: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_profile_id?: string | null;
          title?: string | null;
          content?: string | null;
          category?: string | null;
          location_text?: string | null;
          image_url?: string | null;
          audience?: "public" | "registered_citizens" | null;
          status?:
            | "draft"
            | "pending_approval"
            | "published"
            | "archived"
            | null;
          whatsapp_broadcast?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          content?: string | null;
          category?: string | null;
          location_text?: string | null;
          image_url?: string | null;
          audience?: "public" | "registered_citizens" | null;
          status?:
            | "draft"
            | "pending_approval"
            | "published"
            | "archived"
            | null;
          whatsapp_broadcast?: boolean;
          published_at?: string | null;
          updated_at?: string;
        };
      };
      whatsapp_templates: {
        Row: {
          id: string;
          template_key: string;
          title: string | null;
          body: string | null;
          language: string;
          active: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_key: string;
          title?: string | null;
          body?: string | null;
          language?: string;
          active?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          body?: string | null;
          language?: string;
          active?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_profile_id: string | null;
          action: string | null;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_profile_id?: string | null;
          action?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          action?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
        };
      };
    };
  };
};

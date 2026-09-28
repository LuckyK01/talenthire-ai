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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_agents: {
        Row: {
          agent_key: string
          executions: number
          id: string
          last_execution: string | null
          name: string
          purpose: string
          requires_human_approval: boolean
          sort_order: number
          status: string
        }
        Insert: {
          agent_key: string
          executions?: number
          id?: string
          last_execution?: string | null
          name: string
          purpose: string
          requires_human_approval?: boolean
          sort_order?: number
          status?: string
        }
        Update: {
          agent_key?: string
          executions?: number
          id?: string
          last_execution?: string | null
          name?: string
          purpose?: string
          requires_human_approval?: boolean
          sort_order?: number
          status?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      applications: {
        Row: {
          application_id: string
          candidate_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          match_score: number | null
          recruiter_decision: string | null
          recruiter_decision_reason: string | null
          requirement_id: string
          stage: string
          status: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          application_id: string
          candidate_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          match_score?: number | null
          recruiter_decision?: string | null
          recruiter_decision_reason?: string | null
          requirement_id: string
          stage?: string
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          application_id?: string
          candidate_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          match_score?: number | null
          recruiter_decision?: string | null
          recruiter_decision_reason?: string | null
          requirement_id?: string
          stage?: string
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          ai_explanation: string | null
          ai_factors: Json
          ai_recommendation: string | null
          ai_score: number | null
          assigned_role: Database["public"]["Enums"]["app_role"]
          category: string
          confidence: number | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          entity_id: string | null
          entity_type: string
          id: string
          requirement_id: string | null
          responsible_name: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_explanation?: string | null
          ai_factors?: Json
          ai_recommendation?: string | null
          ai_score?: number | null
          assigned_role?: Database["public"]["Enums"]["app_role"]
          category: string
          confidence?: number | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          requirement_id?: string | null
          responsible_name?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_explanation?: string | null
          ai_factors?: Json
          ai_recommendation?: string | null
          ai_score?: number | null
          assigned_role?: Database["public"]["Enums"]["app_role"]
          category?: string
          confidence?: number | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          requirement_id?: string | null
          responsible_name?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_name: string | null
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          role: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          role?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          role?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      candidate_scores: {
        Row: {
          ai_recommendation: string
          candidate_id: string
          confidence: number
          created_at: string
          education_score: number
          experience_score: number
          explanation: string | null
          gaps: string[]
          id: string
          location_score: number
          overall_score: number
          requirement_id: string
          skill_scores: Json
          strengths: string[]
          updated_at: string
        }
        Insert: {
          ai_recommendation?: string
          candidate_id: string
          confidence?: number
          created_at?: string
          education_score?: number
          experience_score?: number
          explanation?: string | null
          gaps?: string[]
          id?: string
          location_score?: number
          overall_score?: number
          requirement_id: string
          skill_scores?: Json
          strengths?: string[]
          updated_at?: string
        }
        Update: {
          ai_recommendation?: string
          candidate_id?: string
          confidence?: number
          created_at?: string
          education_score?: number
          experience_score?: number
          explanation?: string | null
          gaps?: string[]
          id?: string
          location_score?: number
          overall_score?: number
          requirement_id?: string
          skill_scores?: Json
          strengths?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          current_company: string | null
          education: string | null
          email: string
          id: string
          is_seed: boolean
          location: string | null
          name: string
          phone: string | null
          previous_companies: string[]
          resume_url: string | null
          skills: string[]
          source: string
          status: string
          total_experience: number
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          current_company?: string | null
          education?: string | null
          email: string
          id?: string
          is_seed?: boolean
          location?: string | null
          name: string
          phone?: string | null
          previous_companies?: string[]
          resume_url?: string | null
          skills?: string[]
          source?: string
          status?: string
          total_experience?: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          current_company?: string | null
          education?: string | null
          email?: string
          id?: string
          is_seed?: boolean
          location?: string | null
          name?: string
          phone?: string | null
          previous_companies?: string[]
          resume_url?: string | null
          skills?: string[]
          source?: string
          status?: string
          total_experience?: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_feedback: {
        Row: {
          ai_recommendation: string | null
          ai_summary: string | null
          communication: string
          concerns: string | null
          created_at: string
          id: string
          interview_id: string
          overall_recommendation: string
          problem_solving: string
          strengths: string | null
          submitted_by: string | null
          submitted_by_name: string | null
          technical_capability: string
          updated_at: string
        }
        Insert: {
          ai_recommendation?: string | null
          ai_summary?: string | null
          communication: string
          concerns?: string | null
          created_at?: string
          id?: string
          interview_id: string
          overall_recommendation: string
          problem_solving: string
          strengths?: string | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          technical_capability: string
          updated_at?: string
        }
        Update: {
          ai_recommendation?: string | null
          ai_summary?: string | null
          communication?: string
          concerns?: string | null
          created_at?: string
          id?: string
          interview_id?: string
          overall_recommendation?: string
          problem_solving?: string
          strengths?: string | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          technical_capability?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          candidate_id: string
          created_at: string
          duration_minutes: number
          id: string
          interviewer_email: string | null
          interviewer_name: string
          meeting_link: string | null
          mode: string
          requirement_id: string
          reschedule_reason: string | null
          reschedule_requested: boolean
          round: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          interviewer_email?: string | null
          interviewer_name: string
          meeting_link?: string | null
          mode?: string
          requirement_id: string
          reschedule_reason?: string | null
          reschedule_requested?: boolean
          round?: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          interviewer_email?: string | null
          interviewer_name?: string
          meeting_link?: string | null
          mode?: string
          requirement_id?: string
          reschedule_reason?: string | null
          reschedule_requested?: boolean
          round?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience_role: Database["public"]["Enums"]["app_role"] | null
          body: string | null
          category: string
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          audience_role?: Database["public"]["Enums"]["app_role"] | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          audience_role?: Database["public"]["Enums"]["app_role"] | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          accepted_at: string | null
          application_id: string
          approved_at: string | null
          approved_by: string | null
          candidate_id: string
          clarification_note: string | null
          compensation_band: string | null
          created_at: string
          department: string | null
          documents: string[]
          employment_type: string
          id: string
          location: string | null
          position_title: string
          requirement_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          approved_at?: string | null
          approved_by?: string | null
          candidate_id: string
          clarification_note?: string | null
          compensation_band?: string | null
          created_at?: string
          department?: string | null
          documents?: string[]
          employment_type?: string
          id?: string
          location?: string | null
          position_title: string
          requirement_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          approved_at?: string | null
          approved_by?: string | null
          candidate_id?: string
          clarification_note?: string | null
          compensation_band?: string | null
          created_at?: string
          department?: string | null
          documents?: string[]
          employment_type?: string
          id?: string
          location?: string | null
          position_title?: string
          requirement_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          candidate_id: string
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          offer_id: string | null
          owner: string
          requirement_id: string | null
          sort_order: number
          status: string
          task: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          offer_id?: string | null
          owner?: string
          requirement_id?: string | null
          sort_order?: number
          status?: string
          task: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          offer_id?: string | null
          owner?: string
          requirement_id?: string | null
          sort_order?: number
          status?: string
          task?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id: string
          name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          contract_document: string | null
          contract_findings: Json
          contract_status: string
          created_at: string
          created_by: string | null
          department: string | null
          employment_type: string
          experience_level: string | null
          hiring_manager_id: string | null
          hiring_manager_name: string | null
          id: string
          is_seed: boolean
          job_description: string | null
          location: string | null
          number_of_openings: number
          position_title: string
          preferred_skills: string[]
          priority: string
          required_skills: string[]
          requirement_id: string
          status: string
          target_hiring_timeline: string | null
          updated_at: string
          work_mode: string | null
        }
        Insert: {
          contract_document?: string | null
          contract_findings?: Json
          contract_status?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          employment_type?: string
          experience_level?: string | null
          hiring_manager_id?: string | null
          hiring_manager_name?: string | null
          id?: string
          is_seed?: boolean
          job_description?: string | null
          location?: string | null
          number_of_openings?: number
          position_title: string
          preferred_skills?: string[]
          priority?: string
          required_skills?: string[]
          requirement_id: string
          status?: string
          target_hiring_timeline?: string | null
          updated_at?: string
          work_mode?: string | null
        }
        Update: {
          contract_document?: string | null
          contract_findings?: Json
          contract_status?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          employment_type?: string
          experience_level?: string | null
          hiring_manager_id?: string | null
          hiring_manager_name?: string | null
          id?: string
          is_seed?: boolean
          job_description?: string | null
          location?: string | null
          number_of_openings?: number
          position_title?: string
          preferred_skills?: string[]
          priority?: string
          required_skills?: string[]
          requirement_id?: string
          status?: string
          target_hiring_timeline?: string | null
          updated_at?: string
          work_mode?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sourcing_requests: {
        Row: {
          candidates_requested: number
          created_at: string
          deadline: string | null
          id: string
          notes: string | null
          requested_by: string | null
          requirement_id: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          candidates_requested?: number
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          requested_by?: string | null
          requirement_id: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          candidates_requested?: number
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          requested_by?: string | null
          requirement_id?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_requests_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      vendor_performance: {
        Row: {
          average_candidate_match_score: number
          candidates_matched: number
          candidates_screened: number
          candidates_shortlisted: number
          candidates_submitted: number
          hires: number
          id: string
          interviews: number
          offers: number
          recorded_at: string
          requirement_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          average_candidate_match_score?: number
          candidates_matched?: number
          candidates_screened?: number
          candidates_shortlisted?: number
          candidates_submitted?: number
          hires?: number
          id?: string
          interviews?: number
          offers?: number
          recorded_at?: string
          requirement_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          average_candidate_match_score?: number
          candidates_matched?: number
          candidates_screened?: number
          candidates_shortlisted?: number
          candidates_submitted?: number
          hires?: number
          id?: string
          interviews?: number
          offers?: number
          recorded_at?: string
          requirement_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_performance_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_performance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_score_history: {
        Row: {
          created_at: string
          id: string
          new_score: number | null
          previous_score: number | null
          reason: string
          requirement_id: string | null
          skill: string | null
          source: string
          source_candidate_id: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_score?: number | null
          previous_score?: number | null
          reason: string
          requirement_id?: string | null
          skill?: string | null
          source?: string
          source_candidate_id?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_score?: number | null
          previous_score?: number | null
          reason?: string
          requirement_id?: string | null
          skill?: string | null
          source?: string
          source_candidate_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_score_history_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_score_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_skill_scores: {
        Row: {
          historical_score: number | null
          id: string
          last_updated: string
          recent_score: number | null
          sample_size: number
          score: number
          skill: string
          trend: string
          vendor_id: string
        }
        Insert: {
          historical_score?: number | null
          id?: string
          last_updated?: string
          recent_score?: number | null
          sample_size?: number
          score?: number
          skill: string
          trend?: string
          vendor_id: string
        }
        Update: {
          historical_score?: number | null
          id?: string
          last_updated?: string
          recent_score?: number | null
          sample_size?: number
          score?: number
          skill?: string
          trend?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_skill_scores_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_seed: boolean
          locations: string[]
          overall_score: number
          specialisations: string[]
          status: string
          updated_at: string
          vendor_name: string
          vendor_type: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_seed?: boolean
          locations?: string[]
          overall_score?: number
          specialisations?: string[]
          status?: string
          updated_at?: string
          vendor_name: string
          vendor_type?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_seed?: boolean
          locations?: string[]
          overall_score?: number
          specialisations?: string[]
          status?: string
          updated_at?: string
          vendor_name?: string
          vendor_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hr: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      my_candidate_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role: "HR_ADMIN" | "MANAGER" | "CANDIDATE"
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
  public: {
    Enums: {
      app_role: ["HR_ADMIN", "MANAGER", "CANDIDATE"],
    },
  },
} as const

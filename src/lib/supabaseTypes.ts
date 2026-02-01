export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          thumbnail_url: string | null
          detector_type: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          description?: string | null
          thumbnail_url?: string | null
          detector_type: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          thumbnail_url?: string | null
          detector_type?: string
          created_at?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          rep_count: number
          duration_ms: number
          form_score: number | null
          avg_time_per_rep: number | null
          video_url: string | null
          manual_entry: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          rep_count: number
          duration_ms: number
          form_score?: number | null
          avg_time_per_rep?: number | null
          video_url?: string | null
          manual_entry?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          rep_count?: number
          duration_ms?: number
          form_score?: number | null
          avg_time_per_rep?: number | null
          video_url?: string | null
          manual_entry?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      workout_reps: {
        Row: {
          id: string
          workout_id: string
          rep_number: number
          duration_ms: number
          quality: string
          form_score: number | null
          feedback: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          rep_number: number
          duration_ms: number
          quality: string
          form_score?: number | null
          feedback?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          rep_number?: number
          duration_ms?: number
          quality?: string
          form_score?: number | null
          feedback?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          target_value: number
          current_value: number
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          target_value: number
          current_value?: number
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          target_value?: number
          current_value?: number
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          form_strictness: string
          rep_detection_sensitivity: number
          default_rest_seconds: number
          camera_position: string
          notifications_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          form_strictness?: string
          rep_detection_sensitivity?: number
          default_rest_seconds?: number
          camera_position?: string
          notifications_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          form_strictness?: string
          rep_detection_sensitivity?: number
          default_rest_seconds?: number
          camera_position?: string
          notifications_enabled?: boolean
          created_at?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          id: string
          routine_id: string
          exercise_id: string
          order_index: number
          target_sets: number
          target_reps: number | null
          target_weight: string | null
          sets_data: any | null
          rest_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          exercise_id: string
          order_index: number
          target_sets?: number
          target_reps?: number | null
          target_weight?: string | null
          sets_data?: any | null
          rest_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          exercise_id?: string
          order_index?: number
          target_sets?: number
          target_reps?: number | null
          target_weight?: string | null
          sets_data?: any | null
          rest_seconds?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

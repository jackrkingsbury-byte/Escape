/**
 * Database types for the NeverMiss schema (see supabase/migrations/0001_init.sql).
 * Hand-maintained for now; can be regenerated later with:
 *   supabase gen types typescript --project-id <id> > lib/supabase/types.generated.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AiMode = "auto" | "approve";
export type LeadStatus = "new" | "qualifying" | "quoted" | "booked" | "won" | "lost";
export type MsgDirection = "in" | "out";
export type MsgSender = "customer" | "ai" | "human";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface BusinessRow {
  id: string;
  owner_user_id: string;
  name: string;
  vertical: string | null;
  city: string | null;
  timezone: string;
  whatsapp_number: string | null;
  tone: string | null;
  hours: Json;
  service_area: string | null;
  faq: Json;
  price_ranges: Json;
  ai_mode: AiMode;
  created_at: string;
  updated_at: string;
}

export interface LeadRow {
  id: string;
  business_id: string;
  customer_name: string | null;
  customer_wa: string | null;
  status: LeadStatus;
  estimated_value: number;
  captured_value: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  business_id: string;
  lead_id: string | null;
  wa_conversation_id: string | null;
  ai_paused: boolean;
  last_message_at: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  direction: MsgDirection;
  sender: MsgSender;
  body: string | null;
  media_url: string | null;
  wa_message_id: string | null;
  ai_meta: Json | null;
  created_at: string;
}

export interface BookingRow {
  id: string;
  lead_id: string | null;
  business_id: string;
  service: string | null;
  slot_start: string | null;
  slot_end: string | null;
  status: BookingStatus;
  deposit_required: boolean;
  deposit_paid: boolean;
  yoco_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  business_id: string | null;
  type: string;
  payload: Json;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      businesses: Table<BusinessRow>;
      leads: Table<LeadRow>;
      conversations: Table<ConversationRow>;
      messages: Table<MessageRow>;
      bookings: Table<BookingRow>;
      events: Table<EventRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      ai_mode: AiMode;
      lead_status: LeadStatus;
      msg_direction: MsgDirection;
      msg_sender: MsgSender;
      booking_status: BookingStatus;
    };
  };
}

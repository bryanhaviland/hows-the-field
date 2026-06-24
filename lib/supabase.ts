import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SportType = 'softball' | 'baseball' | 'both'
export type FieldSurface = 'grass' | 'grass_clay' | 'clay' | 'turf'
export type DugoutSize = 'small' | 'medium' | 'large'
export type DugoutMaterial = 'cement' | 'chain_link' | 'wood' | 'mixed'
export type ShadeAmount = 'none' | 'minimal' | 'moderate' | 'ample'
export type WalkwaysCongestion = 'open' | 'moderate' | 'tight'
export type WaterAccess = 'purchase_only' | 'fountains_marginal' | 'fountains_good' | 'bottle_filler'
export type OutfieldDepth = 'short' | 'standard' | 'deep'
export type BackstopDepth = 'short' | 'normal' | 'deep'

export interface FieldComplex {
  id: string
  name: string
  address: string | null
  city: string
  state: string
  zip: string | null
  sport_type: SportType
  num_fields: number | null
  field_notes: string | null
  website: string | null
  // Amenities
  concessions_onsite: boolean | null
  tents_allowed: boolean | null
  pets_allowed: boolean | null
  free_admission: boolean | null
  ample_parking: boolean | null
  covered_from_fly_balls: boolean | null
  // Bathrooms
  bathroom_cleanliness: number | null
  diaper_changing_tables: boolean | null
  soap_stocked: boolean | null
  paper_towels_stocked: boolean | null
  // Concessions
  concessions_quality: number | null
  concessions_value: number | null
  // Water
  water_access: WaterAccess | null
  // Seating & Walkways
  bleachers_cleanliness: number | null
  cement_pad_for_chairs: boolean | null
  shade_amount: ShadeAmount | null
  walkways_congestion: WalkwaysCongestion | null
  created_at: string
}

export interface Review {
  id: string
  complex_id: string
  submitted_at: string
  visit_date: string | null
  bathroom_cleanliness: number | null
  diaper_changing_tables: boolean | null
  soap_stocked: boolean | null
  paper_towels_stocked: boolean | null
  concessions_quality: number | null
  concessions_value: number | null
  bleachers_cleanliness: number | null
  cement_pad_for_chairs: boolean | null
  shade_amount: ShadeAmount | null
  walkways_congestion: WalkwaysCongestion | null
  covered_from_fly_balls: boolean | null
  tents_allowed: boolean | null
  pets_allowed: boolean | null
  water_access: WaterAccess | null
  reviewer_note: string | null
}

export interface RatingsSummary {
  complex_id: string
  review_count: number
  last_reviewed_at: string | null
  avg_bathroom_cleanliness: number | null
  avg_concessions_quality: number | null
  avg_concessions_value: number | null
  avg_bleachers_cleanliness: number | null
  pct_diaper_tables: number | null
  pct_soap_stocked: number | null
  pct_paper_towels: number | null
  pct_cement_pad: number | null
  pct_fly_ball_cover: number | null
  pct_tents_allowed: number | null
  pct_pets_allowed: number | null
  mode_shade_amount: ShadeAmount | null
  mode_walkways_congestion: WalkwaysCongestion | null
  mode_water_access: WaterAccess | null
}

export interface Field {
  id: string
  complex_id: string
  field_name: string
  field_surface: FieldSurface | null
  field_condition: number | null
  dugout_size: DugoutSize | null
  dugout_material: DugoutMaterial | null
  covered_dugouts: boolean | null
  dugouts_block_view: boolean | null
  covered_stands: boolean | null
  outfield_depth: OutfieldDepth | null
  backstop: BackstopDepth | null
  created_at: string
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SportType = 'softball' | 'baseball' | 'both' | 'soccer' | 'flag_football'
export type FieldSurface = 'grass' | 'grass_clay' | 'clay' | 'turf'
export type DugoutSize = 'small' | 'medium' | 'large'
export type DugoutMaterial = 'cement' | 'chain_link' | 'wood' | 'mixed'
export type ShadeAmount = 'none' | 'minimal' | 'moderate' | 'ample'
export type WalkwaysCongestion = 'open' | 'moderate' | 'tight'
export type WaterAccess = 'purchase_only' | 'fountains_marginal' | 'fountains_good' | 'bottle_filler' | 'none'
export type OutfieldDepth = 'short' | 'standard' | 'deep'
export type BackstopDepth = 'short' | 'normal' | 'deep'
export type ConcessionsTime = 'breakfast' | 'lunch' | 'dinner' | 'select_times_only'

export interface FieldComplex {
  id: string
  name: string
  address: string | null
  city: string
  state: string
  zip: string | null
  latitude: number | null
  longitude: number | null
  sport_type: SportType
  num_fields: number | null
  field_notes: string | null
  website: string | null
  created_at: string
  // Amenity/rating columns (concessions, tents, pets, admission, parking, fly-ball
  // cover, bathrooms, water, seating/shade/walkways) were removed — everything
  // about a complex's amenities is crowdsourced via `reviews` /
  // `complex_ratings_summary` now, never admin-set. See migrations 0011/0012/0013.
}

export interface Review {
  id: string
  complex_id: string
  field_id: string | null
  user_id: string | null
  is_anonymous: boolean
  submitted_at: string
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
  /** Crowdsourced report: was there concessions on-site during this visit? */
  concessions_onsite: boolean | null
  /** Crowdsourced report: was admission free during this visit? */
  free_admission: boolean | null
  /** Crowdsourced report: was there ample parking during this visit? */
  ample_parking: boolean | null
  /** Crowdsourced report: when were concessions available during this visit? */
  concessions_available_for: ConcessionsTime[] | null
  water_access: WaterAccess | null
  reviewer_note: string | null
}

export type ReviewerBadgeType = 'trusted_contributor' | 'rising_star'

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export interface ReviewReport {
  id: string
  review_id: string
  reporter_user_id: string
  reason: string | null
  status: ReportStatus
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
  created_at: string
  is_premium: boolean
  premium_platform: string | null
  premium_product_id: string | null
  premium_expires_at: string | null
  premium_updated_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  /** Sport types selected in the profile menu — used as the search page's default field-type filter. Empty = no preference. */
  preferred_sports: SportType[]
}

export type SavedComplexKind = 'home' | 'favorite'

export interface SavedComplex {
  id: string
  user_id: string
  complex_id: string
  kind: SavedComplexKind
  /** Get a lightning push notification when a hold starts/clears near this complex. */
  watch_lightning: boolean
  /** When the lightning watch stops firing — set to now() + 2 days whenever
   *  watch_lightning is turned on (see setWatch in lib/saved-complexes.ts),
   *  cleared to null when turned off. NULL or a past timestamp means "not
   *  actively watching" even if watch_lightning is still true. */
  watch_lightning_expires_at: string | null
  created_at: string
}

/** Whether a saved_complexes row's lightning watch is actually still in its
 *  window — watch_lightning alone isn't enough once the 2-day watch has
 *  expired. Shared by the dashboard and per-complex save controls so both
 *  agree on what counts as "watching". */
export function isWatchActive(row: Pick<SavedComplex, 'watch_lightning' | 'watch_lightning_expires_at'>): boolean {
  return (
    row.watch_lightning &&
    !!row.watch_lightning_expires_at &&
    new Date(row.watch_lightning_expires_at).getTime() > Date.now()
  )
}

/** A saved_complexes row with its field_complexes join embedded — what the
 * dashboard and per-complex save controls actually query for. */
export interface SavedComplexWithField extends SavedComplex {
  field_complexes: Pick<FieldComplex, 'id' | 'name' | 'city' | 'state' | 'sport_type' | 'num_fields'>
}

export type CorrectionIssueType = 'name' | 'address' | 'sports' | 'other'

export interface ComplexCorrection {
  id: string
  complex_id: string
  user_id: string
  issue_type: CorrectionIssueType
  note: string
  status: 'open' | 'resolved' | 'dismissed'
  created_at: string
}

export interface ReviewerStats {
  user_id: string
  display_name: string
  member_since: string
  review_count: number
  reviews_last_30_days: number
  complexes_reviewed: number
  last_review_at: string | null
  badge: ReviewerBadgeType | null
}

export interface ReviewWithReviewer extends Review {
  reviewer_display_name: string | null
  reviewer_badge: ReviewerBadgeType | null
  field_name: string | null
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
  pct_concessions_onsite: number | null
  pct_free_admission: number | null
  pct_ample_parking: number | null
  pct_concessions_breakfast: number | null
  pct_concessions_lunch: number | null
  pct_concessions_dinner: number | null
  pct_concessions_select_times_only: number | null
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
  outfield_depth_left_ft: number | null
  outfield_depth_center_ft: number | null
  outfield_depth_right_ft: number | null
  backstop: BackstopDepth | null
  created_at: string
}

// ── Premium: Field Conditions ──────────────────────────────────────────

export type FieldConditionValue = 'dry' | 'windy' | 'muddy' | 'perfect'
export type ParkingStatus = 'crowded' | 'lots_of_space'
export type GamesStatus = 'on_time' | 'ahead_of_schedule' | 'running_behind'

export interface FieldConditionCheckin {
  id: string
  complex_id: string
  field_id: string | null
  user_id: string
  submitted_at: string
  field_condition: FieldConditionValue | null
  parking: ParkingStatus | null
  games_status: GamesStatus | null
  note: string | null
}

export interface FieldConditionCheckinWithReporter extends FieldConditionCheckin {
  reporter_display_name: string | null
  field_name: string | null
}

/** Row shape of the complex_conditions_current view — most recent check-in per category, last 4 hours only. */
export interface ComplexConditionsCurrent {
  complex_id: string
  field_condition: FieldConditionValue | null
  field_condition_at: string | null
  parking: ParkingStatus | null
  parking_at: string | null
  games_status: GamesStatus | null
  games_status_at: string | null
  recent_checkin_count: number
}

/** Response shape of GET /api/conditions/lightning */
export interface LightningStatus {
  /** There's a strike on record recent/close enough to mention at all. */
  hasRecentStrike: boolean
  /** Distance/bearing/time of the single closest known strike (informational). */
  distanceMiles: number | null
  bearing: string | null
  strikeAt: string | null
  ageMinutes: number | null
  /**
   * True while inside the rolling 30-minute all-clear hold that starts on
   * any strike within the 10-mile danger radius, and resets on every new
   * qualifying strike — this is the actual "should play be stopped" signal,
   * separate from `hasRecentStrike` which is purely informational.
   */
  holdActive: boolean
  /** ISO timestamp of when the current hold clears, if `holdActive`. */
  clearAt: string | null
  /**
   * Coarse read on whether the closest known strike is getting nearer or
   * farther away than it was last poll — 'unknown' until there's a prior
   * reading recent enough to compare against.
   */
  trend: 'approaching' | 'receding' | 'steady' | 'unknown'
  pollIntervalSeconds: number
  source: 'cache' | 'live'
}

/** Response shape of GET /api/conditions/rain */
export interface RainForecast {
  headline: string
  hourly: { hour: string; precipProbability: number; precipitation: number }[]
  pollIntervalSeconds: number
  source: 'cache' | 'live'
}

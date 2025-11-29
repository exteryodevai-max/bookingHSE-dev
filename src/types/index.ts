// Core Types for BookingHSE Platform

// Re-export error types
export * from './errors';
export * from './stripe';

export interface User {
  id: string;
  email: string;
  user_type: 'client' | 'provider' | 'admin';
  profile: ClientProfile | ProviderProfile | AdminProfile;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  company_name: string;
  vat_number: string;
  fiscal_code: string;
  legal_address: Address;
  billing_address?: Address;
  contact_person: ContactPerson;
  company_size: 'micro' | 'small' | 'medium' | 'large';
  industry_sector: string;
  employees_count: number;
  phone: string;
  website?: string;
  certifications?: string[];
}

export interface ProviderProfile {
  business_name: string;
  vat_number: string;
  fiscal_code: string;
  professional_order?: string;
  registration_number?: string;
  address: Address;
  contact_person: ContactPerson;
  phone: string;
  description: string;
  specializations: string[];
  certifications: Certification[];
  service_areas: string[];
  languages: string[];
  experience_years: number;
  team_size: number;
  insurance_coverage?: InsuranceCoverage;
  availability_calendar: AvailabilitySlot[];
  pricing_model: PricingModel;
  cancellation_policy: CancellationPolicy;
  rating_average: number;
  reviews_count: number;
  verified: boolean;
  verification_documents: Document[];
  profile_image_url?: string;
}

export interface AdminProfile {
  name: string;
  role: 'super_admin' | 'moderator' | 'support';
  permissions: string[];
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  region: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactPerson {
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  name?: string; // Deprecato, usare first_name + last_name
}

export interface Certification {
  name: string;
  issuer: string;
  number: string;
  issue_date: string;
  expiry_date?: string;
  document_url?: string;
}

export interface InsuranceCoverage {
  provider: string;
  policy_number: string;
  coverage_amount: number;
  expiry_date: string;
  document_url?: string;
}

export interface Service {
  id: string;
  provider_id: string;
  category: ServiceCategory;
  subcategory: string;
  title: string;
  description: string;
  detailed_description: string;
  service_type: 'instant' | 'on_request';
  duration_hours?: number;
  max_participants?: number;
  location_type: 'on_site' | 'remote' | 'provider_location' | 'flexible';
  service_areas: string[];
  pricing: ServicePricing;
  requirements: ServiceRequirement[];
  deliverables: string[];
  certifications_provided: string[];
  prerequisites: string[];
  equipment_provided: string[];
  equipment_required: string[];
  languages: string[];
  availability: AvailabilitySlot[];
  booking_settings: BookingSettings;
  images: string[];
  documents: Document[];
  tags: string[];
  compliance_standards: string[];
  target_industries: string[];
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

// Extended interfaces for populated data
export interface ServiceWithProvider extends Service {
  provider: {
    id: string;
    user_type: 'provider';
    profile: ProviderProfile;
  };
}

export interface UserWithProfile extends User {
  profile: ClientProfile | ProviderProfile | AdminProfile;
}

export interface BookingWithDetails extends Booking {
  service?: Service;
  client?: UserWithProfile;
  provider?: UserWithProfile;
}

export type ServiceCategory = 
  | 'consultation_management'
  | 'workplace_safety'
  | 'training_education'
  | 'environment'
  | 'occupational_health'
  | 'emergency_crisis'
  | 'innovation_digital'
  | 'specialized_services';

export interface ServicePricing {
  base_price: number;
  currency: 'EUR';
  pricing_unit: 'fixed' | 'per_hour' | 'per_day' | 'per_participant' | 'per_employee';
  min_price?: number;
  max_price?: number;
  additional_costs: AdditionalCost[];
  discounts: Discount[];
  payment_terms: 'advance' | 'completion' | 'split';
  advance_percentage?: number;
}

export interface AdditionalCost {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  optional: boolean;
  description: string;
}

export interface Discount {
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditions: string;
  valid_from?: string;
  valid_until?: string;
}

export interface ServiceRequirement {
  type: 'document' | 'information' | 'access' | 'equipment';
  name: string;
  description: string;
  mandatory: boolean;
  deadline_days?: number;
}

export interface AvailabilitySlot {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  slot_duration: number; // minutes
  max_concurrent: number;
  exceptions: AvailabilityException[];
}

export interface AvailabilityException {
  date: string; // YYYY-MM-DD
  type: 'unavailable' | 'custom_hours';
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface BookingSettings {
  advance_booking_days: number;
  max_advance_booking_days: number;
  min_notice_hours: number;
  auto_confirm: boolean;
  require_approval: boolean;
  allow_cancellation: boolean;
  cancellation_policy: CancellationPolicy;
  confirmation_required: boolean;
  deposit_required: boolean;
  deposit_percentage?: number;
}

export interface CancellationPolicy {
  name: string;
  rules: CancellationRule[];
}

export interface CancellationRule {
  hours_before: number;
  penalty_percentage: number;
  description: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploaded_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  client_id: string;
  provider_id: string;
  service_id: string;
  status: BookingStatus;
  booking_type: 'instant' | 'request';
  
  // Service Details
  service_title: string;
  service_category: ServiceCategory;
  
  // Scheduling
  requested_date: string;
  requested_time: string;
  confirmed_date?: string;
  confirmed_time?: string;
  duration_hours: number;
  location: BookingLocation;
  
  // Participants
  participants_count: number;
  participants: Participant[];
  
  // Pricing
  base_amount: number;
  additional_costs: BookingAdditionalCost[];
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: 'EUR';
  
  // Payment
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_due_date?: string;
  advance_payment_amount?: number;
  advance_payment_status?: PaymentStatus;
  
  // Communication
  client_notes?: string;
  provider_notes?: string;
  internal_notes?: string;
  special_requirements?: string[];
  
  // Documents
  documents: Document[];
  certificates_issued: Certificate[];
  
  // Tracking
  check_in_time?: string;
  check_out_time?: string;
  completion_notes?: string;
  
  // Review
  client_review?: Review;
  provider_review?: Review;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

export type BookingStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface BookingLocation {
  type: 'client_site' | 'provider_site' | 'remote' | 'third_party';
  address?: Address;
  meeting_details?: string;
  access_instructions?: string;
  contact_person?: ContactPerson;
}

export interface Participant {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  employee_id?: string;
  special_needs?: string;
}

export interface BookingAdditionalCost {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  description: string;
}

export interface Certificate {
  id: string;
  participant_name: string;
  certificate_type: string;
  issue_date: string;
  expiry_date?: string;
  certificate_number: string;
  document_url: string;
  digital_signature?: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewed_id: string;
  service_id: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  communication_rating?: number;
  quality_rating?: number;
  timeliness_rating?: number;
  professionalism_rating?: number;
  helpful_count?: number;
  verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ReviewAspect {
  aspect: string;
  rating: number;
}

export interface ReviewResponse {
  text: string;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  location: {
    city?: string;
    province?: string;
    region?: string;
    radius_km?: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category?: ServiceCategory;
  subcategory?: string;
  service_type?: 'instant' | 'on_request';
  date_range?: {
    start_date: string;
    end_date: string;
  };
  price_range?: {
    min: number;
    max: number;
  };
  rating_min?: number;
  languages?: string[];
  certifications?: string[];
  availability?: 'immediate' | 'this_week' | 'this_month';
  sort_by?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'distance';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  services: ServiceSearchItem[];
  total_count: number;
  page: number;
  limit: number;
  filters_applied: SearchFilters;
  suggestions?: string[];
}

export interface ServiceSearchItem {
  id: string;
  title: string;
  category: ServiceCategory;
  subcategory: string;
  provider: {
    id: string;
    business_name: string;
    rating_average: number;
    reviews_count: number;
    verified: boolean;
    location: {
      city: string;
      province: string;
    };
  };
  pricing: {
    base_price: number;
    pricing_unit: string;
    currency: string;
  };
  availability: 'immediate' | 'within_week' | 'within_month' | 'on_request';
  distance_km?: number;
  featured: boolean;
  images: string[];
  tags: string[];
}

export interface PricingModel {
  default_pricing: ServicePricing;
  custom_packages: ServicePackage[];
  volume_discounts: VolumeDiscount[];
}

export interface ServicePackage {
  name: string;
  description: string;
  services_included: string[];
  total_price: number;
  savings_percentage: number;
  validity_days: number;
}

export interface VolumeDiscount {
  min_quantity: number;
  discount_percentage: number;
  description: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string | number | boolean>;
  read: boolean;
  created_at: string;
}

export type NotificationType = 
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'payment_received'
  | 'review_received'
  | 'document_uploaded'
  | 'system_update';

export interface Analytics {
  bookings: BookingAnalytics;
  revenue: RevenueAnalytics;
  users: UserAnalytics;
  services: ServiceAnalytics;
}

export interface BookingAnalytics {
  total_bookings: number;
  confirmed_bookings: number;
  completion_rate: number;
  cancellation_rate: number;
  average_booking_value: number;
  bookings_by_category: Record<ServiceCategory, number>;
  bookings_by_month: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
}

export interface RevenueAnalytics {
  total_revenue: number;
  commission_earned: number;
  average_order_value: number;
  revenue_by_category: Record<ServiceCategory, number>;
  monthly_recurring_revenue: number;
  growth_rate: number;
}

export interface UserAnalytics {
  total_clients: number;
  total_providers: number;
  active_users: number;
  user_retention_rate: number;
  new_registrations: number;
}

export interface ServiceAnalytics {
  total_services: number;
  active_services: number;
  most_popular_categories: Array<{
    category: ServiceCategory;
    booking_count: number;
  }>;
  average_service_rating: number;
}

// Type guard functions

// Profile type guards
export function isClientProfile(profile: ClientProfile | ProviderProfile | AdminProfile): profile is ClientProfile {
  return 'company_name' in profile;
}

export function isProviderProfile(profile: ClientProfile | ProviderProfile | AdminProfile): profile is ProviderProfile {
  return 'business_name' in profile;
}

export function isAdminProfile(profile: ClientProfile | ProviderProfile | AdminProfile): profile is AdminProfile {
  return 'role' in profile;
}

// User type guards
export function isClientUser(user: User): boolean {
  return user.user_type === 'client';
}

export function isProviderUser(user: User): boolean {
  return user.user_type === 'provider';
}

export function isAdminUser(user: User): boolean {
  return user.user_type === 'admin';
}

// Booking status type guards
export function isBookingDraft(booking: Booking): boolean {
  return booking.status === 'draft';
}

export function isBookingPending(booking: Booking): boolean {
  return booking.status === 'pending';
}

export function isBookingConfirmed(booking: Booking): boolean {
  return booking.status === 'confirmed';
}

export function isBookingInProgress(booking: Booking): boolean {
  return booking.status === 'in_progress';
}

export function isBookingCompleted(booking: Booking): boolean {
  return booking.status === 'completed';
}

export function isBookingCancelled(booking: Booking): boolean {
  return booking.status === 'cancelled';
}

export function isBookingNoShow(booking: Booking): boolean {
  return booking.status === 'no_show';
}

// Booking status group checks
export function isBookingActive(booking: Booking): boolean {
  return ['confirmed', 'in_progress'].includes(booking.status);
}

export function isBookingFinalized(booking: Booking): boolean {
  return ['completed', 'cancelled', 'no_show'].includes(booking.status);
}

export function isBookingCancellable(booking: Booking): boolean {
  return ['draft', 'pending', 'confirmed'].includes(booking.status);
}

// Payment status type guards
export function isPaymentPending(payment: PaymentStatus): boolean {
  return payment === 'pending';
}

export function isPaymentAuthorized(payment: PaymentStatus): boolean {
  return payment === 'authorized';
}

export function isPaymentSuccessful(payment: PaymentStatus): boolean {
  return payment === 'captured';
}

export function isPaymentFailed(payment: PaymentStatus): boolean {
  return payment === 'failed';
}

export function isPaymentRefunded(payment: PaymentStatus): boolean {
  return payment === 'refunded' || payment === 'partially_refunded';
}

export function isPaymentCompleted(payment: PaymentStatus): boolean {
  return ['captured', 'refunded', 'partially_refunded'].includes(payment);
}

// Service type guards
export function isInstantService(service: Service): boolean {
  return service.service_type === 'instant';
}

export function isRequestService(service: Service): boolean {
  return service.service_type === 'on_request';
}

export function isActiveService(service: Service): boolean {
  return service.active === true;
}

export function isFeaturedService(service: Service): boolean {
  return service.featured === true;
}

export function isOnSiteService(service: Service): boolean {
  return service.location_type === 'on_site';
}

export function isRemoteService(service: Service): boolean {
  return service.location_type === 'remote';
}

export function isProviderLocationService(service: Service): boolean {
  return service.location_type === 'provider_location';
}

export function isFlexibleLocationService(service: Service): boolean {
  return service.location_type === 'flexible';
}

// Service category type guards
export function isConsultationService(service: Service): boolean {
  return service.category === 'consultation_management';
}

export function isSafetyService(service: Service): boolean {
  return service.category === 'workplace_safety';
}

export function isTrainingService(service: Service): boolean {
  return service.category === 'training_education';
}

export function isEnvironmentService(service: Service): boolean {
  return service.category === 'environment';
}

export function isHealthService(service: Service): boolean {
  return service.category === 'occupational_health';
}

export function isEmergencyService(service: Service): boolean {
  return service.category === 'emergency_crisis';
}

export function isInnovationService(service: Service): boolean {
  return service.category === 'innovation_digital';
}

export function isSpecializedService(service: Service): boolean {
  return service.category === 'specialized_services';
}

// Notification type guards
export function isBookingNotification(type: NotificationType): boolean {
  return ['booking_confirmed', 'booking_cancelled', 'booking_reminder'].includes(type);
}

export function isPaymentNotification(type: NotificationType): boolean {
  return type === 'payment_received';
}

export function isReviewNotification(type: NotificationType): boolean {
  return type === 'review_received';
}

export function isDocumentNotification(type: NotificationType): boolean {
  return type === 'document_uploaded';
}

export function isSystemNotification(type: NotificationType): boolean {
  return type === 'system_update';
}

// Booking location type guards
export function isClientSiteBooking(booking: Booking): boolean {
  return booking.location.type === 'client_site';
}

export function isProviderSiteBooking(booking: Booking): boolean {
  return booking.location.type === 'provider_site';
}

export function isRemoteBooking(booking: Booking): boolean {
  return booking.location.type === 'remote';
}

export function isThirdPartyBooking(booking: Booking): boolean {
  return booking.location.type === 'third_party';
}

// Pricing model type guards
export function isFixedPricing(pricing: ServicePricing): boolean {
  return pricing.pricing_unit === 'fixed';
}

export function isHourlyPricing(pricing: ServicePricing): boolean {
  return pricing.pricing_unit === 'per_hour';
}

export function isDailyPricing(pricing: ServicePricing): boolean {
  return pricing.pricing_unit === 'per_day';
}

export function isParticipantPricing(pricing: ServicePricing): boolean {
  return pricing.pricing_unit === 'per_participant';
}

export function isEmployeePricing(pricing: ServicePricing): boolean {
  return pricing.pricing_unit === 'per_employee';
}

// Document type guards
export function isPDFDocument(document: Document): boolean {
  return document.type.toLowerCase() === 'pdf' || document.name.toLowerCase().endsWith('.pdf');
}

export function isImageDocument(document: Document): boolean {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = document.name.split('.').pop()?.toLowerCase();
  return imageTypes.includes(extension || '') || document.type.startsWith('image/');
}

// Review type guards
export function isVerifiedReview(review: Review): boolean {
  return review.verified === true;
}

export function isHighRatingReview(review: Review): boolean {
  return review.rating >= 4;
}

export function isLowRatingReview(review: Review): boolean {
  return review.rating <= 2;
}
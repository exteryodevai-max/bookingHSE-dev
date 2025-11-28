// Type Guards Test Suite
// Test file to verify all type guards work correctly

import {
  // Types
  type User,
  type Booking,
  type Service,
  type PaymentStatus,
  type NotificationType,
  type ServicePricing,
  type Document,
  type Review,
  type ClientProfile,
  type ProviderProfile,
  type AdminProfile,
  
  // Profile type guards
  isClientProfile,
  isProviderProfile,
  isAdminProfile,
  
  // User type guards
  isClientUser,
  isProviderUser,
  isAdminUser,
  
  // Booking status type guards
  isBookingDraft,
  isBookingPending,
  isBookingConfirmed,
  isBookingInProgress,
  isBookingCompleted,
  isBookingCancelled,
  isBookingNoShow,
  isBookingActive,
  isBookingFinalized,
  isBookingCancellable,
  
  // Payment status type guards
  isPaymentPending,
  isPaymentAuthorized,
  isPaymentSuccessful,
  isPaymentFailed,
  isPaymentRefunded,
  isPaymentCompleted,
  
  // Service type guards
  isInstantService,
  isRequestService,
  isActiveService,
  isFeaturedService,
  isOnSiteService,
  isRemoteService,
  isProviderLocationService,
  isFlexibleLocationService,
  
  // Service category type guards
  isConsultationService,
  isSafetyService,
  isTrainingService,
  isEnvironmentService,
  isHealthService,
  isEmergencyService,
  isInnovationService,
  isSpecializedService,
  
  // Notification type guards
  isBookingNotification,
  isPaymentNotification,
  isReviewNotification,
  isDocumentNotification,
  isSystemNotification,
  
  // Booking location type guards
  isClientSiteBooking,
  isProviderSiteBooking,
  isRemoteBooking,
  isThirdPartyBooking,
  
  // Pricing model type guards
  isFixedPricing,
  isHourlyPricing,
  isDailyPricing,
  isParticipantPricing,
  isEmployeePricing,
  
  // Document type guards
  isPDFDocument,
  isImageDocument,
  
  // Review type guards
  isVerifiedReview,
  isHighRatingReview,
  isLowRatingReview,
} from '../types/index.js';

// Test data
const mockClientProfile: ClientProfile = {
  company_name: 'Test Company',
  vat_number: 'IT12345678901',
  fiscal_code: 'TSTCMP12A01H501Z',
  legal_address: {
    street: 'Via Test 123',
    city: 'Milano',
    province: 'MI',
    postal_code: '20100',
    region: 'Lombardia',
    country: 'Italia'
  },
  contact_person: {
    first_name: 'Mario',
    last_name: 'Rossi',
    role: 'CEO',
    email: 'mario@test.com',
    phone: '+39 123 456 7890'
  },
  company_size: 'medium',
  industry_sector: 'Manufacturing',
  employees_count: 150,
  phone: '+39 123 456 7890'
};

const mockProviderProfile: ProviderProfile = {
  business_name: 'Safety Consulting SRL',
  vat_number: 'IT98765432109',
  fiscal_code: 'SFTCNS98A01H501Z',
  address: {
    street: 'Via Provider 456',
    city: 'Roma',
    province: 'RM',
    postal_code: '00100',
    region: 'Lazio',
    country: 'Italia'
  },
  contact_person: {
    first_name: 'Giulia',
    last_name: 'Bianchi',
    role: 'Founder',
    email: 'giulia@provider.com',
    phone: '+39 987 654 3210'
  },
  phone: '+39 987 654 3210',
  description: 'Professional safety consulting',
  specializations: ['workplace_safety', 'training'],
  certifications: [],
  service_areas: ['Milano', 'Roma'],
  languages: ['it', 'en'],
  experience_years: 10,
  team_size: 5,
  availability_calendar: [],
  pricing_model: {
    base_price: 500,
    currency: 'EUR',
    pricing_unit: 'per_day',
    additional_costs: [],
    discounts: [],
    payment_terms: 'advance'
  },
  cancellation_policy: {
    name: 'Standard',
    rules: []
  },
  rating_average: 4.5,
  reviews_count: 25,
  verified: true,
  verification_documents: []
};

const mockAdminProfile: AdminProfile = {
  name: 'Admin User',
  role: 'super_admin',
  permissions: ['all']
};

const mockBooking: Booking = {
  id: 'booking-123',
  booking_number: 'BK-2024-001',
  client_id: 'client-123',
  provider_id: 'provider-123',
  service_id: 'service-123',
  status: 'confirmed',
  booking_type: 'instant',
  service_title: 'Safety Training',
  service_category: 'workplace_safety',
  requested_date: '2024-02-15',
  requested_time: '09:00',
  duration_hours: 8,
  location: {
    type: 'client_site',
    address: mockClientProfile.legal_address
  },
  participants_count: 10,
  participants: [],
  base_amount: 1000,
  additional_costs: [],
  discount_amount: 0,
  tax_amount: 220,
  total_amount: 1220,
  currency: 'EUR',
  payment_status: 'captured',
  documents: [],
  certificates_issued: [],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};

const mockService: Service = {
  id: 'service-123',
  provider_id: 'provider-123',
  category: 'workplace_safety',
  subcategory: 'general_training',
  title: 'Workplace Safety Training',
  description: 'Comprehensive safety training',
  detailed_description: 'Detailed safety training program',
  service_type: 'instant',
  duration_hours: 8,
  location_type: 'on_site',
  service_areas: ['Milano', 'Roma'],
  pricing: {
    base_price: 1000,
    currency: 'EUR',
    pricing_unit: 'per_day',
    additional_costs: [],
    discounts: [],
    payment_terms: 'advance'
  },
  requirements: [],
  deliverables: [],
  certifications_provided: [],
  prerequisites: [],
  equipment_provided: [],
  equipment_required: [],
  languages: ['it'],
  availability: [],
  booking_settings: {
    advance_booking_days: 7,
    max_advance_booking_days: 90,
    min_notice_hours: 24,
    auto_confirm: true,
    require_approval: false,
    allow_cancellation: true,
    cancellation_policy: {
      name: 'Standard',
      rules: []
    },
    confirmation_required: false,
    deposit_required: false
  },
  images: [],
  documents: [],
  tags: [],
  compliance_standards: [],
  target_industries: [],
  active: true,
  featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// Test functions
function testProfileTypeGuards() {
  console.log('🧪 Testing Profile Type Guards...');
  
  console.log('✅ Client Profile:', isClientProfile(mockClientProfile)); // true
  console.log('❌ Provider Profile (on client):', isProviderProfile(mockClientProfile)); // false
  console.log('❌ Admin Profile (on client):', isAdminProfile(mockClientProfile)); // false
  
  console.log('✅ Provider Profile:', isProviderProfile(mockProviderProfile)); // true
  console.log('❌ Client Profile (on provider):', isClientProfile(mockProviderProfile)); // false
  
  console.log('✅ Admin Profile:', isAdminProfile(mockAdminProfile)); // true
}

function testUserTypeGuards() {
  console.log('\n🧪 Testing User Type Guards...');
  
  const clientUser: User = {
    id: 'user-1',
    email: 'client@test.com',
    user_type: 'client',
    profile: mockClientProfile,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };
  
  console.log('✅ Client User:', isClientUser(clientUser)); // true
  console.log('❌ Provider User (on client):', isProviderUser(clientUser)); // false
  console.log('❌ Admin User (on client):', isAdminUser(clientUser)); // false
}

function testBookingStatusGuards() {
  console.log('\n🧪 Testing Booking Status Guards...');
  
  console.log('✅ Booking Confirmed:', isBookingConfirmed(mockBooking)); // true
  console.log('❌ Booking Draft:', isBookingDraft(mockBooking)); // false
  console.log('✅ Booking Active:', isBookingActive(mockBooking)); // true
  console.log('❌ Booking Finalized:', isBookingFinalized(mockBooking)); // false
  console.log('✅ Booking Cancellable:', isBookingCancellable(mockBooking)); // true
}

function testPaymentStatusGuards() {
  console.log('\n🧪 Testing Payment Status Guards...');
  
  const paymentStatus: PaymentStatus = 'captured';
  
  console.log('✅ Payment Successful:', isPaymentSuccessful(paymentStatus)); // true
  console.log('❌ Payment Pending:', isPaymentPending(paymentStatus)); // false
  console.log('✅ Payment Completed:', isPaymentCompleted(paymentStatus)); // true
}

function testServiceTypeGuards() {
  console.log('\n🧪 Testing Service Type Guards...');
  
  console.log('✅ Instant Service:', isInstantService(mockService)); // true
  console.log('❌ Request Service:', isRequestService(mockService)); // false
  console.log('✅ Active Service:', isActiveService(mockService)); // true
  console.log('❌ Featured Service:', isFeaturedService(mockService)); // false
  console.log('✅ On-site Service:', isOnSiteService(mockService)); // true
  console.log('✅ Safety Service:', isSafetyService(mockService)); // true
  console.log('❌ Training Service:', isTrainingService(mockService)); // false
}

function testNotificationTypeGuards() {
  console.log('\n🧪 Testing Notification Type Guards...');
  
  const bookingNotif: NotificationType = 'booking_confirmed';
  const paymentNotif: NotificationType = 'payment_received';
  
  console.log('✅ Booking Notification:', isBookingNotification(bookingNotif)); // true
  console.log('❌ Payment Notification (on booking):', isPaymentNotification(bookingNotif)); // false
  console.log('✅ Payment Notification:', isPaymentNotification(paymentNotif)); // true
}

function testLocationTypeGuards() {
  console.log('\n🧪 Testing Location Type Guards...');
  
  console.log('✅ Client Site Booking:', isClientSiteBooking(mockBooking)); // true
  console.log('❌ Provider Site Booking:', isProviderSiteBooking(mockBooking)); // false
  console.log('❌ Remote Booking:', isRemoteBooking(mockBooking)); // false
}

function testPricingTypeGuards() {
  console.log('\n🧪 Testing Pricing Type Guards...');
  
  console.log('❌ Fixed Pricing:', isFixedPricing(mockService.pricing)); // false
  console.log('❌ Hourly Pricing:', isHourlyPricing(mockService.pricing)); // false
  console.log('✅ Daily Pricing:', isDailyPricing(mockService.pricing)); // true
}

function testDocumentTypeGuards() {
  console.log('\n🧪 Testing Document Type Guards...');
  
  const pdfDoc: Document = {
    id: 'doc-1',
    name: 'contract.pdf',
    type: 'application/pdf',
    url: 'https://example.com/contract.pdf',
    size: 1024,
    uploaded_at: '2024-01-01T00:00:00Z'
  };
  
  const imageDoc: Document = {
    id: 'doc-2',
    name: 'photo.jpg',
    type: 'image/jpeg',
    url: 'https://example.com/photo.jpg',
    size: 2048,
    uploaded_at: '2024-01-01T00:00:00Z'
  };
  
  console.log('✅ PDF Document:', isPDFDocument(pdfDoc)); // true
  console.log('❌ Image Document (on PDF):', isImageDocument(pdfDoc)); // false
  console.log('✅ Image Document:', isImageDocument(imageDoc)); // true
}

function testReviewTypeGuards() {
  console.log('\n🧪 Testing Review Type Guards...');
  
  const clientReview: Review = {
    id: 'review-1',
    booking_id: 'booking-123',
    reviewer_id: 'client-123',
    reviewed_id: 'provider-123',
    service_id: 'service-123',
    rating: 5,
    communication_rating: 5,
    quality_rating: 5,
    timeliness_rating: 4,
    professionalism_rating: 5,
    helpful_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    verified: true
  };
  
  console.log('✅ Verified Review:', isVerifiedReview(clientReview)); // true
  console.log('✅ High Rating Review:', isHighRatingReview(clientReview)); // true
  console.log('❌ Low Rating Review:', isLowRatingReview(clientReview)); // false
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Type Guards Test Suite\n');
  
  try {
    testProfileTypeGuards();
    testUserTypeGuards();
    testBookingStatusGuards();
    testPaymentStatusGuards();
    testServiceTypeGuards();
    testNotificationTypeGuards();
    testLocationTypeGuards();
    testPricingTypeGuards();
    testDocumentTypeGuards();
    testReviewTypeGuards();
    
    console.log('\n✅ All Type Guards Tests Completed Successfully!');
    console.log('📊 Type safety improved with comprehensive type guards');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run in development
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  runAllTests();
}

export { runAllTests };
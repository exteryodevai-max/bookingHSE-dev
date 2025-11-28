// Sistema di recensioni e rating con moderazione automatica per BookingHSE
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'hidden';
type ModerationAction = 'auto_approved' | 'auto_rejected' | 'manual_review' | 'flagged_content';
type SentimentScore = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

interface Review {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  service_id: string;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatus;
  moderation_action?: ModerationAction;
  moderation_reason?: string;
  sentiment_score?: SentimentScore;
  sentiment_confidence?: number;
  helpful_votes: number;
  total_votes: number;
  response?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, string | number | boolean>;
}

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeywords: Array<{ keyword: string; count: number; sentiment: SentimentScore }>;
  monthlyTrends: Array<{ month: string; averageRating: number; reviewCount: number }>;
  responseRate: number;
  averageResponseTime: number;
}

interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'sentiment' | 'length' | 'spam';
  condition: string;
  action: ModerationAction;
  severity: 'low' | 'medium' | 'high';
  active: boolean;
}

interface CreateReviewParams {
  bookingId: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  title?: string;
  comment?: string;
  metadata?: Record<string, string | number | boolean>;
}

class ReviewManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private moderationRules: ModerationRule[] = [];
  private profanityWords: string[] = [];
  private spamPatterns: RegExp[] = [];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.initializeModerationRules();
  }

  // Inizializza regole di moderazione
  private initializeModerationRules(): void {
    // Parole inappropriate (lista base - in produzione usare un servizio esterno)
    this.profanityWords = [
      'stupido', 'idiota', 'cretino', 'imbecille', 'scemo', 'deficiente',
      'merda', 'cazzo', 'stronzo', 'bastardo', 'fottuto', 'dannato',
      'truffa', 'truffatore', 'ladro', 'criminale', 'disonesto'
    ];

    // Pattern spam
    this.spamPatterns = [
      /\b(www\.|http[s]?:\/\/|\w+\.com|\w+\.it)\b/gi, // URL
      /\b\d{10,}\b/g, // Numeri di telefono lunghi
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
      /(..)\1{3,}/g, // Caratteri ripetuti
      /\b(GRATIS|FREE|OFFERTA|SCONTO|€\d+)\b/gi // Parole commerciali
    ];

    // Regole di moderazione
    this.moderationRules = [
      {
        id: 'profanity_check',
        name: 'Controllo linguaggio inappropriato',
        type: 'keyword',
        condition: 'contains_profanity',
        action: 'manual_review',
        severity: 'high',
        active: true
      },
      {
        id: 'spam_check',
        name: 'Controllo spam',
        type: 'spam',
        condition: 'contains_spam_patterns',
        action: 'auto_rejected',
        severity: 'high',
        active: true
      },
      {
        id: 'length_check',
        name: 'Controllo lunghezza minima',
        type: 'length',
        condition: 'min_length_10',
        action: 'auto_approved',
        severity: 'low',
        active: true
      },
      {
        id: 'sentiment_check',
        name: 'Controllo sentiment estremo',
        type: 'sentiment',
        condition: 'very_negative_sentiment',
        action: 'manual_review',
        severity: 'medium',
        active: true
      }
    ];
  }

  // Crea una nuova recensione
  async createReview(params: CreateReviewParams): Promise<Review | null> {
    try {
      // Validazioni base
      if (params.rating < 1 || params.rating > 5) {
        throw new Error('Rating deve essere tra 1 e 5');
      }

      // Verifica che l'utente possa recensire questo booking
      const canReview = await this.canUserReview(params.bookingId, params.clientId);
      if (!canReview.allowed) {
        throw new Error(canReview.reason || 'Non puoi recensire questo servizio');
      }

      // Analisi del contenuto
      const moderationResult = await this.moderateContent({
        title: params.title || '',
        comment: params.comment || '',
        rating: params.rating
      });

      // Analisi sentiment
      const sentimentResult = await this.analyzeSentiment(params.comment || '');

      // Crea la recensione
      const reviewData = {
        booking_id: params.bookingId,
        client_id: params.clientId,
        provider_id: params.providerId,
        service_id: params.serviceId,
        rating: params.rating,
        title: params.title,
        comment: params.comment,
        status: moderationResult.status,
        moderation_action: moderationResult.action,
        moderation_reason: moderationResult.reason,
        sentiment_score: sentimentResult.score,
        sentiment_confidence: sentimentResult.confidence,
        helpful_votes: 0,
        total_votes: 0,
        metadata: {
          ...params.metadata,
          moderation_flags: moderationResult.flags,
          sentiment_keywords: sentimentResult.keywords
        }
      };

      const { data: review, error } = await this.supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Errore creazione recensione:', error);
        return null;
      }

      // Aggiorna rating del provider se la recensione è approvata
      if (moderationResult.status === 'approved') {
        await this.updateProviderRating(params.providerId);
      }

      return review as Review;
    } catch (error) {
      console.error('Errore creazione recensione:', error);
      return null;
    }
  }

  // Verifica se un utente può recensire un booking
  private async canUserReview(
    bookingId: string,
    clientId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Verifica che il booking esista e appartenga all'utente
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('client_id', clientId)
        .maybeSingle();

      if (bookingError || !booking) {
        return { allowed: false, reason: 'Booking non trovato' };
      }

      // Verifica che il booking sia completato
      if (booking.status !== 'completed') {
        return { allowed: false, reason: 'Il servizio deve essere completato per lasciare una recensione' };
      }

      // Verifica che non esista già una recensione
      const { data: existingReview } = await this.supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('client_id', clientId)
        .maybeSingle();

      if (existingReview) {
        return { allowed: false, reason: 'Hai già recensito questo servizio' };
      }

      // Verifica che non sia passato troppo tempo (es. 90 giorni)
      const completionDate = new Date(booking.updated_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 90) {
        return { allowed: false, reason: 'Il tempo per lasciare una recensione è scaduto' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Errore verifica permessi recensione:', error);
      return { allowed: false, reason: 'Errore durante la verifica' };
    }
  }

  // Moderazione automatica del contenuto
  private async moderateContent(content: {
    title: string;
    comment: string;
    rating: number;
  }): Promise<{
    status: ReviewStatus;
    action: ModerationAction;
    reason?: string;
    flags: string[];
  }> {
    const flags: string[] = [];
    const text = `${content.title} ${content.comment}`.toLowerCase();

    // Controllo profanità
    const hasProfanity = this.profanityWords.some(word => 
      text.includes(word.toLowerCase())
    );
    if (hasProfanity) {
      flags.push('profanity');
    }

    // Controllo spam
    const hasSpam = this.spamPatterns.some(pattern => pattern.test(text));
    if (hasSpam) {
      flags.push('spam');
      return {
        status: 'rejected',
        action: 'auto_rejected',
        reason: 'Contenuto identificato come spam',
        flags
      };
    }

    // Controllo lunghezza
    if (content.comment && content.comment.length < 10) {
      flags.push('too_short');
    }

    // Controllo rating estremo con commento breve
    if ((content.rating === 1 || content.rating === 5) && content.comment.length < 20) {
      flags.push('extreme_rating_short_comment');
    }

    // Controllo caratteri ripetuti
    if (/(..)\1{4,}/.test(text)) {
      flags.push('repeated_characters');
    }

    // Decisione finale
    if (flags.includes('profanity') || flags.includes('extreme_rating_short_comment')) {
      return {
        status: 'pending',
        action: 'manual_review',
        reason: 'Richiede revisione manuale',
        flags
      };
    }

    if (flags.length === 0 || (flags.length === 1 && flags.includes('too_short'))) {
      return {
        status: 'approved',
        action: 'auto_approved',
        flags
      };
    }

    return {
      status: 'pending',
      action: 'manual_review',
      reason: 'Contenuto segnalato per revisione',
      flags
    };
  }

  // Analisi sentiment
  private async analyzeSentiment(text: string): Promise<{
    score: SentimentScore;
    confidence: number;
    keywords: string[];
  }> {
    if (!text || text.length < 10) {
      return {
        score: 'neutral',
        confidence: 0.5,
        keywords: []
      };
    }

    // Parole positive e negative (versione semplificata)
    const positiveWords = [
      'ottimo', 'eccellente', 'fantastico', 'perfetto', 'magnifico', 'straordinario',
      'professionale', 'competente', 'veloce', 'preciso', 'affidabile', 'consiglio',
      'soddisfatto', 'contento', 'felice', 'bravo', 'gentile', 'cortese'
    ];

    const negativeWords = [
      'pessimo', 'terribile', 'orribile', 'disastroso', 'inaccettabile',
      'incompetente', 'lento', 'impreciso', 'inaffidabile', 'sconsiglio',
      'deluso', 'arrabbiato', 'furioso', 'maleducato', 'scortese', 'ritardo'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords: string[] = [];

    words.forEach(word => {
      if (positiveWords.includes(word)) {
        positiveCount++;
        foundKeywords.push(word);
      } else if (negativeWords.includes(word)) {
        negativeCount++;
        foundKeywords.push(word);
      }
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const sentimentRatio = totalSentimentWords > 0 ? 
      (positiveCount - negativeCount) / totalSentimentWords : 0;

    let score: SentimentScore;
    let confidence: number;

    if (sentimentRatio >= 0.6) {
      score = 'very_positive';
      confidence = Math.min(0.9, 0.6 + (sentimentRatio - 0.6) * 0.75);
    } else if (sentimentRatio >= 0.2) {
      score = 'positive';
      confidence = 0.6 + (sentimentRatio - 0.2) * 0.5;
    } else if (sentimentRatio >= -0.2) {
      score = 'neutral';
      confidence = 0.5 + Math.abs(sentimentRatio) * 0.25;
    } else if (sentimentRatio >= -0.6) {
      score = 'negative';
      confidence = 0.6 + Math.abs(sentimentRatio + 0.2) * 0.5;
    } else {
      score = 'very_negative';
      confidence = Math.min(0.9, 0.6 + Math.abs(sentimentRatio + 0.6) * 0.75);
    }

    return {
      score,
      confidence,
      keywords: foundKeywords
    };
  }

  // Aggiorna rating del provider
  private async updateProviderRating(providerId: string): Promise<void> {
    try {
      const { data: reviews } = await this.supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId)
        .eq('status', 'approved');

      if (reviews && reviews.length > 0) {
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await this.supabase
          .from('provider_profiles')
          .update({
            rating_average: Math.round(averageRating * 100) / 100,
            reviews_count: reviews.length,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', providerId);
      }
    } catch (error) {
      console.error('Errore aggiornamento rating provider:', error);
    }
  }

  // Ottieni recensioni per un servizio
  async getServiceReviews(
    serviceId: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
      filterRating?: number;
      includeHidden?: boolean;
    } = {}
  ): Promise<Review[]> {
    try {
      let query = this.supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey(first_name, last_name)
        `)
        .eq('service_id', serviceId);

      if (!options.includeHidden) {
        query = query.in('status', ['approved']);
      }

      if (options.filterRating) {
        query = query.eq('rating', options.filterRating);
      }

      // Ordinamento
      switch (options.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'rating_high':
          query = query.order('rating', { ascending: false });
          break;
        case 'rating_low':
          query = query.order('rating', { ascending: true });
          break;
        case 'helpful':
          query = query.order('helpful_votes', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Errore recupero recensioni:', error);
        return [];
      }

      return data as Review[];
    } catch (error) {
      console.error('Errore recupero recensioni:', error);
      return [];
    }
  }

  // Risposta del provider a una recensione
  async respondToReview(
    reviewId: string,
    providerId: string,
    response: string
  ): Promise<boolean> {
    try {
      // Verifica che la recensione appartenga al provider
      const { data: review, error: reviewError } = await this.supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('provider_id', providerId)
        .maybeSingle();

      if (reviewError || !review) {
        return false;
      }

      // Aggiorna con la risposta
      const { error } = await this.supabase
        .from('reviews')
        .update({
          response,
          response_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      return !error;
    } catch (error) {
      console.error('Errore risposta recensione:', error);
      return false;
    }
  }

  // Vota utilità di una recensione
  async voteReviewHelpfulness(
    reviewId: string,
    userId: string,
    helpful: boolean
  ): Promise<boolean> {
    try {
      // Verifica se l'utente ha già votato
      const { data: existingVote } = await this.supabase
        .from('review_votes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingVote) {
        // Aggiorna voto esistente
        await this.supabase
          .from('review_votes')
          .update({ helpful })
          .eq('review_id', reviewId)
          .eq('user_id', userId);
      } else {
        // Crea nuovo voto
        await this.supabase
          .from('review_votes')
          .insert({
            review_id: reviewId,
            user_id: userId,
            helpful
          });
      }

      // Aggiorna contatori nella recensione
      const { data: votes } = await this.supabase
        .from('review_votes')
        .select('helpful')
        .eq('review_id', reviewId);

      if (votes) {
        const helpfulVotes = votes.filter(v => v.helpful).length;
        const totalVotes = votes.length;

        await this.supabase
          .from('reviews')
          .update({
            helpful_votes: helpfulVotes,
            total_votes: totalVotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);
      }

      return true;
    } catch (error) {
      console.error('Errore voto recensione:', error);
      return false;
    }
  }

  // Analytics recensioni per provider
  async getReviewAnalytics(
    providerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ReviewAnalytics | null> {
    try {
      let query = this.supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .eq('status', 'approved');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: reviews, error } = await query;

      if (error || !reviews) {
        console.error('Errore analytics recensioni:', error);
        return null;
      }

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {},
          sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
          topKeywords: [],
          monthlyTrends: [],
          responseRate: 0,
          averageResponseTime: 0
        };
      }

      // Calcoli base
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      // Distribuzione rating
      const ratingDistribution = reviews.reduce((acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Analisi sentiment
      const sentimentCounts = reviews.reduce((acc, r) => {
        const sentiment = r.sentiment_score;
        if (sentiment === 'positive' || sentiment === 'very_positive') {
          acc.positive++;
        } else if (sentiment === 'negative' || sentiment === 'very_negative') {
          acc.negative++;
        } else {
          acc.neutral++;
        }
        return acc;
      }, { positive: 0, neutral: 0, negative: 0 });

      // Keywords più frequenti
      const allKeywords = reviews
        .filter(r => r.metadata?.sentiment_keywords)
        .flatMap(r => r.metadata.sentiment_keywords);
      
      const keywordCounts = allKeywords.reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topKeywords = Object.entries(keywordCounts)
        .map(([keyword, count]) => ({
          keyword,
          count,
          sentiment: 'neutral' as SentimentScore // Semplificato
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Trend mensili
      const monthlyData = reviews.reduce((acc, review) => {
        const date = new Date(review.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { ratings: [], count: 0 };
        }
        
        acc[monthKey].ratings.push(review.rating);
        acc[monthKey].count++;
        
        return acc;
      }, {} as Record<string, { ratings: number[]; count: number }>);

      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          averageRating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
          reviewCount: data.count
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      // Tasso di risposta
      const reviewsWithResponse = reviews.filter(r => r.response).length;
      const responseRate = (reviewsWithResponse / totalReviews) * 100;

      // Tempo medio di risposta
      const responseTimes = reviews
        .filter(r => r.response && r.response_date)
        .map(r => {
          const reviewDate = new Date(r.created_at);
          const responseDate = new Date(r.response_date!);
          return responseDate.getTime() - reviewDate.getTime();
        });
      
      const averageResponseTime = responseTimes.length > 0 ?
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60 * 60 * 24) : 0;

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingDistribution,
        sentimentAnalysis: sentimentCounts,
        topKeywords,
        monthlyTrends,
        responseRate: Math.round(responseRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100
      };
    } catch (error) {
      console.error('Errore analytics recensioni:', error);
      return null;
    }
  }

  // Moderazione manuale
  async moderateReview(
    reviewId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<boolean> {
    try {
      const status: ReviewStatus = action === 'approve' ? 'approved' : 
                                  action === 'reject' ? 'rejected' : 'flagged';

      const { error } = await this.supabase
        .from('reviews')
        .update({
          status,
          moderation_action: 'manual_review',
          moderation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (!error && status === 'approved') {
        // Aggiorna rating provider se approvata
        const { data: review } = await this.supabase
          .from('reviews')
          .select('provider_id')
          .eq('id', reviewId)
          .maybeSingle();
        
        if (review) {
          await this.updateProviderRating(review.provider_id);
        }
      }

      return !error;
    } catch (error) {
      console.error('Errore moderazione recensione:', error);
      return false;
    }
  }

  // Ottieni recensioni in attesa di moderazione
  async getPendingReviews(limit: number = 50): Promise<Review[]> {
    try {
      const { data, error } = await this.supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey(first_name, last_name),
          provider_profiles!inner(business_name),
          services!inner(title)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Errore recupero recensioni pending:', error);
        return [];
      }

      return data as Review[];
    } catch (error) {
      console.error('Errore recupero recensioni pending:', error);
      return [];
    }
  }
}

// Funzioni di utilità
export const ReviewHelpers = {
  // Formatta rating con stelle
  formatRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  },

  // Ottieni colore per rating
  getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  },

  // Ottieni colore per sentiment
  getSentimentColor(sentiment: SentimentScore): string {
    switch (sentiment) {
      case 'very_positive': return 'text-green-600 bg-green-100';
      case 'positive': return 'text-green-500 bg-green-50';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      case 'negative': return 'text-red-500 bg-red-50';
      case 'very_negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  },

  // Formatta tempo relativo
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minuti fa`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ore fa`;
    if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 1440)} giorni fa`;
    return date.toLocaleDateString('it-IT');
  },

  // Tronca testo
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
};

// Istanza singleton
let reviewManagerInstance: ReviewManager | null = null;

export function getReviewManager(): ReviewManager {
  if (!reviewManagerInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurazione Supabase mancante per le recensioni');
    }
    
    reviewManagerInstance = new ReviewManager(supabaseUrl, supabaseKey);
  }
  
  return reviewManagerInstance;
}

export type {
  Review,
  ReviewStatus,
  ReviewAnalytics,
  ModerationRule,
  CreateReviewParams,
  SentimentScore,
  ModerationAction
};

export { ReviewManager };
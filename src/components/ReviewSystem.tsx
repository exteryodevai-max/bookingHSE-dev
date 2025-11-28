// Componente sistema recensioni per BookingHSE
import React, { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, MessageCircle, Filter, TrendingUp } from 'lucide-react';
import { getReviewManager, ReviewHelpers } from '../lib/reviews';
import type { Review, ReviewAnalytics, CreateReviewParams } from '../lib/reviews';

interface ReviewSystemProps {
  serviceId?: string;
  providerId?: string;
  bookingId?: string;
  mode: 'display' | 'create' | 'manage' | 'analytics';
  currentUserId?: string;
  isProvider?: boolean;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({
  serviceId,
  providerId,
  bookingId,
  mode,
  currentUserId,
  isProvider = false
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: ''
  });
  const [filters, setFilters] = useState({
    sortBy: 'newest' as 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful',
    filterRating: 0,
    showAll: false
  });
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const reviewManager = getReviewManager();

  // Carica recensioni
  const loadReviews = useCallback(async () => {
    if (!serviceId) return;
    
    setLoading(true);
    try {
      const data = await reviewManager.getServiceReviews(serviceId, {
        sortBy: filters.sortBy,
        filterRating: filters.filterRating || undefined,
        includeHidden: filters.showAll,
        limit: 20
      });
      setReviews(data);
    } catch {
      setError('Errore nel caricamento delle recensioni');
    } finally {
      setLoading(false);
    }
  }, [serviceId, filters.sortBy, filters.filterRating, filters.showAll, reviewManager]);

  const loadAnalytics = useCallback(async () => {
    if (!providerId) return;
    
    setLoading(true);
    try {
      const data = await reviewManager.getReviewAnalytics(providerId);
      setAnalytics(data);
    } catch {
      setError('Errore nel caricamento delle analytics');
    } finally {
      setLoading(false);
    }
  }, [providerId, reviewManager]);

  useEffect(() => {
    if (mode === 'display' && serviceId) {
      loadReviews();
    } else if (mode === 'analytics' && providerId) {
      loadAnalytics();
    }
  }, [serviceId, providerId, mode, filters, loadReviews, loadAnalytics]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !currentUserId || !serviceId || !providerId) return;

    setLoading(true);
    try {
      const params: CreateReviewParams = {
        bookingId,
        clientId: currentUserId,
        providerId,
        serviceId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment
      };

      const review = await reviewManager.createReview(params);
      if (review) {
        setFormData({ rating: 5, title: '', comment: '' });
        setError(null);
        // Mostra messaggio di successo
        alert('Recensione inviata con successo! Sarà visibile dopo la moderazione.');
      } else {
        setError('Errore nell\'invio della recensione');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Errore nell\'invio della recensione');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteHelpfulness = async (reviewId: string, helpful: boolean) => {
    if (!currentUserId) return;
    
    try {
      await reviewManager.voteReviewHelpfulness(reviewId, currentUserId, helpful);
      loadReviews(); // Ricarica per aggiornare i contatori
    } catch (err) {
      console.error('Errore nel voto:', err);
    }
  };

  const handleProviderResponse = async (reviewId: string) => {
    if (!providerId || !responseText.trim()) return;
    
    try {
      const success = await reviewManager.respondToReview(reviewId, providerId, responseText);
      if (success) {
        setShowResponseForm(null);
        setResponseText('');
        loadReviews();
      }
    } catch (err) {
      console.error('Errore nella risposta:', err);
    }
  };

  const renderStarRating = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderCreateForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Lascia una recensione</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitReview} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valutazione
          </label>
          {renderStarRating(formData.rating, true, (rating) => 
            setFormData(prev => ({ ...prev, rating }))
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titolo (opzionale)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Riassumi la tua esperienza"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commento
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Descrivi la tua esperienza in dettaglio"
            minLength={10}
            maxLength={1000}
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            {formData.comment.length}/1000 caratteri
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || formData.comment.length < 10}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Invio in corso...' : 'Invia recensione'}
        </button>
      </form>
    </div>
  );

  const renderReviewCard = (review: Review) => (
    <div key={review.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {(review as any).reviewer?.first_name?.[0] || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {(review as any).reviewer?.first_name} {(review as any).reviewer?.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {ReviewHelpers.formatTimeAgo(review.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {renderStarRating(review.rating)}
          {review.sentiment_score && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              ReviewHelpers.getSentimentColor(review.sentiment_score)
            }`}>
              {review.sentiment_score}
            </span>
          )}
        </div>
      </div>

      {review.title && (
        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
      )}
      
      <p className="text-gray-700 mb-4">{review.comment}</p>

      {/* Risposta del provider */}
      {review.response && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex items-center mb-2">
            <MessageCircle className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Risposta del provider</span>
            <span className="text-xs text-blue-600 ml-2">
              {ReviewHelpers.formatTimeAgo(review.response_date!)}
            </span>
          </div>
          <p className="text-blue-800">{review.response}</p>
        </div>
      )}

      {/* Azioni */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {currentUserId && (
            <>
              <button
                onClick={() => handleVoteHelpfulness(review.id, true)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Utile ({review.helpful_votes})</span>
              </button>
              <button
                onClick={() => handleVoteHelpfulness(review.id, false)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Non utile</span>
              </button>
            </>
          )}
          <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600">
            <Flag className="w-4 h-4" />
            <span>Segnala</span>
          </button>
        </div>

        {/* Risposta provider */}
        {isProvider && !review.response && (
          <button
            onClick={() => setShowResponseForm(review.id)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Rispondi
          </button>
        )}
      </div>

      {/* Form risposta provider */}
      {showResponseForm === review.id && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Scrivi la tua risposta..."
            maxLength={500}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setShowResponseForm(null)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Annulla
            </button>
            <button
              onClick={() => handleProviderResponse(review.id)}
              disabled={!responseText.trim()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Invia risposta
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center space-x-4">
        <Filter className="w-5 h-5 text-gray-600" />
        
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as "newest" | "oldest" | "rating_high" | "rating_low" | "helpful" }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Più recenti</option>
          <option value="oldest">Più vecchie</option>
          <option value="rating_high">Voto più alto</option>
          <option value="rating_low">Voto più basso</option>
          <option value="helpful">Più utili</option>
        </select>

        <select
          value={filters.filterRating}
          onChange={(e) => setFilters(prev => ({ ...prev, filterRating: parseInt(e.target.value) }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0}>Tutte le stelle</option>
          <option value={5}>5 stelle</option>
          <option value={4}>4 stelle</option>
          <option value={3}>3 stelle</option>
          <option value={2}>2 stelle</option>
          <option value={1}>1 stella</option>
        </select>

        {isProvider && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.showAll}
              onChange={(e) => setFilters(prev => ({ ...prev, showAll: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mostra tutte</span>
          </label>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="space-y-6">
        {/* Metriche principali */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-400" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.averageRating}
                </div>
                <div className="text-sm text-gray-600">Rating medio</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <MessageCircle className="w-8 h-8 text-blue-400" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.totalReviews}
                </div>
                <div className="text-sm text-gray-600">Recensioni totali</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.responseRate}%
                </div>
                <div className="text-sm text-gray-600">Tasso risposta</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <MessageCircle className="w-8 h-8 text-purple-400" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.averageResponseTime}d
                </div>
                <div className="text-sm text-gray-600">Tempo risposta medio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuzione rating */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuzione Rating</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = analytics.ratingDistribution[rating] || 0;
              const percentage = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analisi sentiment */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Analisi Sentiment</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.sentimentAnalysis.positive}
              </div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {analytics.sentimentAnalysis.neutral}
              </div>
              <div className="text-sm text-gray-600">Neutrali</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.sentimentAnalysis.negative}
              </div>
              <div className="text-sm text-gray-600">Negative</div>
            </div>
          </div>
        </div>

        {/* Top keywords */}
        {analytics.topKeywords.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Parole Chiave Frequenti</h3>
            <div className="flex flex-wrap gap-2">
              {analytics.topKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {keyword.keyword} ({keyword.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {mode === 'create' && renderCreateForm()}
      
      {mode === 'display' && (
        <>
          {renderFilters()}
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map(renderReviewCard)
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nessuna recensione trovata
              </div>
            )}
          </div>
        </>
      )}
      
      {mode === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default ReviewSystem;
export type { ReviewSystemProps };
import React, { useState, useEffect } from 'react';
import {
  Play,
  Bookmark,
  Star,
  Clock,
  Calendar,
  Layers,
  Users,
  Film,
  Tv,
  MessageSquare,
  Send,
  X,
  ExternalLink,
  ChevronRight,
  Loader2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { MediaDetails, Episode, Season, UserReview, MediaItem } from '../../types';
import {
  fetchMovieDetails,
  fetchTVDetails,
  fetchTVSeason,
  getImageUrl,
  getBackdropUrl,
} from '../../services/tmdb';
import {
  addToWatchlist,
  removeFromWatchlist,
  isMediaInWatchlist,
  addReview,
  getMediaReviews,
  deleteReview,
} from '../../services/firestore';
import { useAuth } from '../../context/AuthContext';
import { VideoPlayer } from '../player/VideoPlayer';
import { WatchProvidersModal } from './WatchProvidersModal';

interface MediaDetailsViewProps {
  mediaId: number | string;
  mediaType: 'movie' | 'tv';
  onClose?: () => void;
  onSelectMedia?: (item: MediaItem) => void;
  onRequireAuth?: () => void;
  autoplay?: boolean;
}

export const MediaDetailsView: React.FC<MediaDetailsViewProps> = ({
  mediaId,
  mediaType,
  onClose,
  onSelectMedia,
  onRequireAuth,
  autoplay = false,
}) => {
  const { user, isAdmin } = useAuth();
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Watch state
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Watchlist state
  const [inWatchlist, setInWatchlist] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewRating, setReviewRating] = useState(10);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Watch providers modal
  const [providersModalOpen, setProvidersModalOpen] = useState(false);

  // Load details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsPlaying(autoplay);

    const loadData = async () => {
      try {
        const data =
          mediaType === 'movie'
            ? await fetchMovieDetails(mediaId)
            : await fetchTVDetails(mediaId);

        if (!isMounted) return;
        setDetails(data);

        // Check watchlist
        if (user) {
          const inList = await isMediaInWatchlist(user.uid, mediaType, String(mediaId));
          if (isMounted) setInWatchlist(inList);
        }

        // Load reviews
        const revs = await getMediaReviews(String(mediaId), mediaType);
        if (isMounted) setReviews(revs);

        // Load season 1 episodes if TV
        if (mediaType === 'tv') {
          setLoadingEpisodes(true);
          const firstSeasonNum = data.seasons && data.seasons[0]?.season_number === 0 && data.seasons.length > 1
            ? data.seasons[1].season_number
            : (data.seasons && data.seasons[0]?.season_number) || 1;
          setSelectedSeason(firstSeasonNum);
          setSelectedEpisode(1);
          try {
            const seasonData = await fetchTVSeason(mediaId, firstSeasonNum);
            if (isMounted) setSeasonEpisodes(seasonData.episodes || []);
          } catch (e) {
            console.error('Failed to load season 1', e);
          } finally {
            if (isMounted) setLoadingEpisodes(false);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType, user]);

  // Load season episodes when user switches season
  const handleSeasonChange = async (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    setSelectedEpisode(1);
    setLoadingEpisodes(true);
    try {
      const seasonData = await fetchTVSeason(mediaId, seasonNum);
      setSeasonEpisodes(seasonData.episodes || []);
    } catch (err) {
      console.error('Failed to change season', err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Toggle watchlist
  const handleToggleWatchlist = async () => {
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!details) return;

    try {
      if (inWatchlist) {
        await removeFromWatchlist(user.uid, mediaType, String(mediaId));
        setInWatchlist(false);
      } else {
        await addToWatchlist({
          userId: user.uid,
          mediaId: String(mediaId),
          mediaType,
          title: details.title || details.name || 'Untitled',
          posterPath: details.poster_path,
          voteAverage: details.vote_average || 0,
          releaseDate: details.release_date || details.first_air_date,
        });
        setInWatchlist(true);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist', err);
    }
  };

  // Play button click
  const handlePlayClick = () => {
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!reviewContent.trim()) return;

    setSubmittingReview(true);
    try {
      const newId = await addReview({
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'User',
        userPhoto: user.photoURL || undefined,
        mediaId: String(mediaId),
        mediaType,
        mediaTitle: details?.title || details?.name || 'Untitled',
        rating: reviewRating,
        content: reviewContent.trim(),
      });

      setReviews([
        {
          id: newId,
          userId: user.uid,
          userDisplayName: user.displayName || 'User',
          mediaId: String(mediaId),
          mediaType,
          mediaTitle: details?.title || details?.name || 'Untitled',
          rating: reviewRating,
          content: reviewContent.trim(),
          createdAt: new Date().toISOString(),
        },
        ...reviews,
      ]);
      setReviewContent('');
    } catch (err) {
      console.error('Failed to post review', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-neutral-300">Retrieving title details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-400 font-semibold mb-2">{error || 'Media not found'}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-xs"
          >
            Back
          </button>
        )}
      </div>
    );
  }

  const title = details.title || details.name || 'Untitled';
  const releaseDate = details.release_date || details.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const rating = details.vote_average ? details.vote_average.toFixed(1) : null;
  const backdropUrl = getBackdropUrl(details.backdrop_path || details.poster_path);
  const posterUrl = getImageUrl(details.poster_path, 'w500');

  // Find trailer
  const trailer = details.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );

  return (
    <div className="relative w-full max-w-6xl mx-auto pb-16 space-y-8 animate-ios-page-enter">
      {/* Top Floating Close Button if modal/overlay mode */}
      {onClose && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full ios-glass hover:bg-white/20 text-neutral-300 hover:text-white border border-white/20 transition active:scale-90 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Video Player Section if playing */}
      {isPlaying && (
        <div className="scroll-mt-20">
          <VideoPlayer
            mediaType={mediaType}
            tmdbId={mediaId}
            title={title}
            posterPath={details.poster_path}
            season={selectedSeason}
            episode={selectedEpisode}
            maxEpisodes={seasonEpisodes.length || 1}
            onEpisodeChange={(s, e) => {
              setSelectedSeason(s);
              setSelectedEpisode(e);
            }}
          />
        </div>
      )}

      {/* Backdrop Header (if not playing or below player) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 ios-glass-card shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
        {backdropUrl && (
          <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover object-top opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/70 to-transparent" />
          </div>
        )}

        <div className="relative z-10 px-6 sm:px-10 pb-10 -mt-32 sm:-mt-44 flex flex-col md:flex-row gap-6 md:gap-10 items-start">
          {/* Poster */}
          <div className="shrink-0 w-36 sm:w-48 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] bg-neutral-900">
            {posterUrl ? (
              <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-500">
                <Film className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Details Meta */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600/90 text-white border border-red-400/40 backdrop-blur-md shadow-[0_4px_16px_rgba(239,68,68,0.35)]">
                {mediaType === 'tv' ? 'TV SHOW' : 'MOVIE'}
              </span>
              {rating && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 backdrop-blur-md text-amber-200 border border-amber-300/30 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  {rating} / 10
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white/80 ios-glass border border-white/15">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  {year}
                </span>
              )}
              {details.runtime ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white/80 ios-glass border border-white/15">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  {details.runtime} min
                </span>
              ) : details.number_of_seasons ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white/80 ios-glass border border-white/15">
                  <Layers className="w-3 h-3 text-neutral-400" />
                  {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug drop-shadow-md">
              {title}
            </h1>

            {details.tagline && (
              <p className="text-sm font-medium text-neutral-300/80 italic">"{details.tagline}"</p>
            )}

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {details.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full text-xs font-medium ios-glass text-neutral-300 border border-white/15"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <p className="text-xs sm:text-sm text-neutral-300/95 leading-relaxed max-w-3xl drop-shadow-sm">
              {details.overview || 'No overview summary available for this title.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handlePlayClick}
                className="px-6 py-3 rounded-2xl ios-glass-btn-primary text-white text-sm font-bold flex items-center gap-2 shadow-[0_12px_32px_rgba(239,68,68,0.45)] hover:scale-105 active:scale-95 transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isPlaying ? 'Resume Playback' : 'Watch Now'}</span>
              </button>

              <button
                onClick={handleToggleWatchlist}
                className={`px-4 py-3 rounded-2xl border text-sm font-semibold flex items-center gap-2 transition hover:scale-105 active:scale-95 ${
                  inWatchlist
                    ? 'bg-red-500/30 border-red-400/60 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                    : 'ios-glass-btn-secondary text-neutral-200 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-red-400 text-red-400' : ''}`} />
                <span>{inWatchlist ? 'In Watchlist' : 'Add to My List'}</span>
              </button>

              <button
                onClick={() => setProvidersModalOpen(true)}
                className="px-4 py-3 rounded-2xl ios-glass-btn-secondary text-white text-sm font-semibold flex items-center gap-2 transition active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Watch Providers</span>
              </button>

              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-2xl ios-glass-btn-secondary text-neutral-200 hover:text-white text-sm font-semibold flex items-center gap-2 transition active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Trailer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TV Seasons and Episodes Selector (if TV Show) */}
      {mediaType === 'tv' && details.seasons && (
        <div className="ios-glass p-6 sm:p-7 rounded-3xl border border-white/15 space-y-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl ios-glass border border-white/15">
                <Tv className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Seasons & Episodes</h3>
            </div>

            {/* Season Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 ios-glass p-1 rounded-2xl border border-white/10">
              {details.seasons
                .filter((s) => s.season_number > 0)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSeasonChange(s.season_number)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                      selectedSeason === s.season_number
                        ? 'ios-pill-active text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Season {s.season_number}
                  </button>
                ))}
            </div>
          </div>

          {/* Episode Grid */}
          {loadingEpisodes ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : seasonEpisodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {seasonEpisodes.map((ep) => {
                const isSelected =
                  selectedSeason === ep.season_number && selectedEpisode === ep.episode_number;
                return (
                  <div
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep.episode_number);
                      handlePlayClick();
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex gap-3 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-red-500/20 border-red-400/50 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                        : 'ios-glass-card border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="relative w-24 aspect-video shrink-0 bg-black/40 rounded-xl overflow-hidden border border-white/10">
                      {ep.still_path ? (
                        <img
                          src={getImageUrl(ep.still_path, 'w300')}
                          alt={ep.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-bold">
                          EP {ep.episode_number}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-0.5">
                        <span className="font-bold text-red-400">Ep {ep.episode_number}</span>
                        {ep.runtime && <span>{ep.runtime}m</span>}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{ep.name}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                        {ep.overview || 'No episode description available.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-4 text-center">
              No episodes listed for this season.
            </p>
          )}
        </div>
      )}

      {/* Cast & Crew Section */}
      {details.credits?.cast && details.credits.cast.length > 0 && (
        <div className="ios-glass p-6 sm:p-7 rounded-3xl border border-white/15 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <div className="p-2 rounded-xl ios-glass border border-white/15">
              <Users className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Top Cast</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {details.credits.cast.slice(0, 10).map((cast) => (
              <div key={cast.id} className="w-24 shrink-0 text-center space-y-1.5">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-neutral-900 border-2 border-white/20 shadow-md">
                  {cast.profile_path ? (
                    <img
                      src={getImageUrl(cast.profile_path, 'w300')}
                      alt={cast.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                      {cast.name.slice(0, 2)}
                    </div>
                  )}
                </div>
                <h5 className="text-xs font-semibold text-white truncate">{cast.name}</h5>
                <p className="text-[10px] text-neutral-400 truncate">{cast.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Reviews & Ratings Section */}
      <div className="ios-glass p-6 sm:p-7 rounded-3xl border border-white/15 space-y-6 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl ios-glass border border-white/15">
              <MessageSquare className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Community Reviews</h3>
          </div>
          <span className="text-xs text-neutral-400 font-medium px-2.5 py-1 rounded-full ios-glass border border-white/10">
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </span>
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 space-y-3.5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-white">Leave a Review & Score:</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setReviewRating(num)}
                  className={`w-6 h-6 rounded-lg text-[11px] font-bold transition active:scale-95 ${
                    reviewRating >= num
                      ? 'bg-amber-400/90 text-black shadow-sm'
                      : 'ios-glass text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={2}
            placeholder={
              user
                ? 'Share your thoughts on the plot, acting, and cinematography...'
                : 'Please sign in to submit a review'
            }
            disabled={!user || submittingReview}
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500/80 focus:bg-white/[0.08] disabled:opacity-50 transition"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !reviewContent.trim() || submittingReview}
              className="px-5 py-2.5 rounded-xl ios-glass-btn-primary text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 shadow-sm"
            >
              {submittingReview ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Review</span>
            </button>
          </div>
        </form>

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl ios-glass-card border border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {(rev.userDisplayName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{rev.userDisplayName}</p>
                      <p className="text-[10px] text-neutral-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[11px] font-bold backdrop-blur-md">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      {rev.rating}/10
                    </span>

                    {(isAdmin || (user && user.uid === rev.userId)) && (
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-red-400 transition"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-neutral-300/90 leading-relaxed">{rev.content}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 text-center py-4">
              No reviews yet. Be the first to review this {mediaType === 'tv' ? 'show' : 'movie'}!
            </p>
          )}
        </div>
      </div>

      {/* Similar / Recommended Titles */}
      {details.similar?.results && details.similar.results.length > 0 && (
        <div className="ios-glass p-6 sm:p-7 rounded-3xl border border-white/15 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <div className="p-2 rounded-xl ios-glass border border-white/15">
              <Film className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">You Might Also Like</h3>
          </div>
          <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
            {details.similar.results.slice(0, 8).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectMedia && onSelectMedia({ ...item, media_type: mediaType })}
                className="group cursor-pointer space-y-1.5 select-none"
              >
                <div className="aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-black/40 border border-white/10 group-hover:border-white/30 group-hover:shadow-[0_12px_30px_rgba(239,68,68,0.2)] transition-all duration-300">
                  <img
                    src={getImageUrl(item.poster_path, 'w300')}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <h5 className="text-[11px] sm:text-xs font-medium text-white/90 truncate group-hover:text-red-400 transition">
                  {item.title || item.name}
                </h5>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watch Providers Modal */}
      {providersModalOpen && (
        <WatchProvidersModal
          movieId={mediaId}
          movieTitle={title}
          isOpen={providersModalOpen}
          onClose={() => setProvidersModalOpen(false)}
        />
      )}
    </div>
  );
};

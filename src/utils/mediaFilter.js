export function isRealMedia(item) {
  if (!item) return false;
  // If media_type exists and is not 'movie' or 'tv', reject
  if (item.media_type && item.media_type !== "movie" && item.media_type !== "tv") return false;

  // Must have a title (movie) or name (tv)
  if (!item.title && !item.name) return false;

  // Should have a release/air date or at least a poster
  if (!item.poster_path && !item.release_date && !item.first_air_date) return false;

  return true;
}

export function filterMediaArray(arr = []) {
  return arr.filter(isRealMedia);
}

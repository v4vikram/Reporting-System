
/**
 * Resolves an image URL to a full absolute URL if needed.
 * This ensures images work correctly across different environments (local, dev, production).
 */
export const getImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  
  // Get the base API URL from environment, fallback to current origin
  const apiUrl = import.meta.env.VITE_API_URL || '';
  
  // If the URL already contains /api, we might just need to prepend the origin in some local setups
  // But if VITE_API_URL is set (like in local dev pointing to a remote backend), we use that.
  
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  if (apiUrl) {
    // If apiUrl is an absolute URL (e.g. http://localhost:5000), use it
    if (apiUrl.startsWith('http')) {
      const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      // Note: If the url already starts with /api and apiUrl also has /api, avoid duplication
      if (cleanUrl.startsWith('/api') && base.endsWith('/api')) {
          return `${base.replace('/api', '')}${cleanUrl}`;
      }
      return `${base}${cleanUrl}`;
    }
    // If it's relative like /api, it will be handled by the current origin
    return cleanUrl;
  }

  return cleanUrl;
};

// Utility to resolve asset URLs correctly across local dev, custom domain, and GitHub Pages subpath
export function assetUrl(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const mediaBase = import.meta.env.VITE_MEDIA_BASE_URL;
  if (mediaBase) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${mediaBase.replace(/\/$/, "")}${cleanPath}`;
  }
  const base = import.meta.env.BASE_URL || "./";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

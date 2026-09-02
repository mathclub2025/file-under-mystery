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

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const base = import.meta.env.BASE_URL || "./";

  if (base.startsWith("/") && base !== "/") {
    const cleanBase = base.endsWith("/") ? base : `${base}/`;
    return `${cleanBase}${cleanPath}`;
  }

  // Dynamic window resolution for GitHub Pages repository subpaths (e.g. /file-under-mystery/)
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname || "/";
    const repoBase = pathname.endsWith("/") ? pathname : pathname.slice(0, pathname.lastIndexOf("/") + 1);
    return `${repoBase}${cleanPath}`;
  }

  return `./${cleanPath}`;
}

import slugify from "limax";

import { SITE, APP_BLOG } from "~/utils/config";
import { trim } from "~/utils/utils";

/**
 * Removes leading and trailing slashes from a string.
 * @param s - The string to trim.
 * @returns Trimmed string without leading/trailing slashes.
 */
export const trimSlash = (s: string): string => trim(trim(s, "/"));

/**
 * Joins multiple path segments into a normalized URL path.
 * @param params - Path segments to join.
 * @returns Normalized path starting with `/`.
 */
const createPath = (...params: string[]): string => {
  const paths = params
    .map((el) => trimSlash(el))
    .filter(Boolean)
    .join("/");
  return "/" + paths + (SITE.trailingSlash && paths ? "/" : "");
};

const BASE_PATHNAME = SITE.base || "/";

/**
 * Normalizes and slugifies a string for use in a URL.
 * @param text - The text to slugify.
 * @returns Slugified string.
 */
export const cleanSlug = (text = ""): string =>
  trimSlash(text)
    .split("/")
    .map((slug) => slugify(slug))
    .join("/");

export const BLOG_BASE = cleanSlug(APP_BLOG?.list?.pathname);
export const CATEGORY_BASE = cleanSlug(APP_BLOG?.category?.pathname);
export const TAG_BASE = cleanSlug(APP_BLOG?.tag?.pathname) || "tag";

export const POST_PERMALINK_PATTERN = trimSlash(
  APP_BLOG?.post?.permalink || `${BLOG_BASE}/%slug%`,
);

/**
 * Returns a canonical URL for a given path.
 * @param path - Path to convert into a canonical URL.
 * @returns Canonical URL string.
 */
export const getCanonical = (path = ""): string => {
  const url = new URL(path, SITE.site).toString();
  if (SITE.trailingSlash === false && path && url.endsWith("/")) {
    return url.slice(0, -1);
  } else if (SITE.trailingSlash === true && path && !url.endsWith("/")) {
    return url + "/";
  }
  return url;
};

/**
 * Returns a permalink for a given slug and type (page, post, category, tag).
 * @param slug - Slug or path segment.
 * @param type - Type of permalink ("page" | "post" | "category" | "tag").
 * @returns Normalized permalink string.
 */
export const getPermalink = (
  slug = "",
  type: "page" | "post" | "category" | "tag" = "page",
): string => {
  let permalink: string;

  switch (type) {
    case "category":
      permalink = createPath(CATEGORY_BASE, trimSlash(slug));
      break;
    case "tag":
      permalink = createPath(TAG_BASE, trimSlash(slug));
      break;
    case "post":
      permalink = createPath(trimSlash(slug));
      break;
    case "page":
    default:
      permalink = createPath(slug);
      break;
  }

  return definitivePermalink(permalink);
};

/**
 * Returns the home page permalink.
 * @returns Home permalink string.
 */
export const getHomePermalink = (): string => getPermalink("/");

/**
 * Returns the blog base permalink.
 * @returns Blog base permalink string.
 */
export const getBlogPermalink = (): string => getPermalink(BLOG_BASE);

/**
 * Returns a full URL path for an asset.
 * @param path - Path to the asset.
 * @returns Asset URL string.
 */
export const getAsset = (path: string): string =>
  "/" +
  [BASE_PATHNAME, path]
    .map((el) => trimSlash(el))
    .filter(Boolean)
    .join("/");

/**
 * Normalizes a permalink by prepending the base path.
 * @param permalink - Permalink to normalize.
 * @returns Definitive permalink string.
 */
const definitivePermalink = (permalink: string): string =>
  createPath(BASE_PATHNAME, permalink);

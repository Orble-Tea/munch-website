import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import type { OpenGraph } from "@astrolib/seo";

/**
 * Loads all local images in the assets/images folder using Vite's import.meta.glob
 * @returns A record of image paths to async import functions
 */
const load = async (): Promise<
  Record<string, () => Promise<unknown>> | undefined
> => {
  let images: Record<string, () => Promise<unknown>> | undefined = undefined;
  try {
    images = import.meta.glob(
      "~/assets/images/**/*.{jpeg,jpg,png,tiff,webp,gif,svg,JPEG,JPG,PNG,TIFF,WEBP,GIF,SVG}",
    );
  } catch {
    // continue regardless of error
  }
  return images;
};

let _images: Record<string, () => Promise<unknown>> | undefined = undefined;

/**
 * Fetches and caches local images
 * @returns Record of image paths to import functions
 */
export const fetchLocalImages = async (): Promise<
  Record<string, () => Promise<unknown>> | undefined
> => {
  _images = _images || (await load());
  return _images;
};

/**
 * Resolves a local or remote image path to either ImageMetadata or a string URL
 * @param imagePath - Image path or ImageMetadata object
 * @returns Resolved ImageMetadata or string URL, or null if not found
 */
export const findImage = async (
  imagePath?: string | ImageMetadata | null,
): Promise<ImageMetadata | string | null | undefined> => {
  // Not a string => return as-is
  if (typeof imagePath !== "string") {
    return imagePath;
  }

  // Absolute paths
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("/")
  ) {
    return imagePath;
  }

  // Relative paths or not in "~/assets/images"
  if (!imagePath.startsWith("~/assets/images")) {
    return imagePath;
  }

  const images = await fetchLocalImages();
  const key = imagePath.replace("~/", "/src/");

  return images && typeof images[key] === "function"
    ? ((await images[key]()) as { default: ImageMetadata })["default"]
    : null;
};

/**
 * Adapts OpenGraph images to use local images if available
 * @param openGraph - Original OpenGraph object
 * @param astroSite - Base URL for the site (used for relative URLs)
 * @returns OpenGraph object with adapted images
 */
export const adaptOpenGraphImages = async (
  openGraph: OpenGraph = {},
  astroSite: URL = new URL(""),
): Promise<OpenGraph> => {
  if (!openGraph?.images?.length) {
    return openGraph;
  }

  const images = openGraph.images;
  const defaultWidth = 1200;
  const defaultHeight = 626;

  const adaptedImages = await Promise.all(
    images.map(async (image) => {
      if (image?.url) {
        const resolvedImage = (await findImage(image.url)) as
          | ImageMetadata
          | undefined;

        if (!resolvedImage) {
          return { url: "" };
        }

        const _image = await getImage({
          src: resolvedImage,
          alt: image.alt || "Placeholder alt",
          width: image?.width || defaultWidth,
          height: image?.height || defaultHeight,
        });

        if (typeof _image === "object") {
          return {
            url:
              "src" in _image && typeof _image.src === "string"
                ? new URL(_image.src, astroSite).toString()
                : "",
            width:
              "width" in _image && typeof _image.width === "number"
                ? _image.width
                : undefined,
            height:
              "height" in _image && typeof _image.height === "number"
                ? _image.height
                : undefined,
          };
        }

        return { url: "" };
      }

      return { url: "" };
    }),
  );

  return { ...openGraph, ...(adaptedImages ? { images: adaptedImages } : {}) };
};

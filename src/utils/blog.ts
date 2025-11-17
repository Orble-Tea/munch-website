import type { PaginateFunction } from "astro";
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

import {
  cleanSlug,
  trimSlash,
  BLOG_BASE,
  POST_PERMALINK_PATTERN,
  CATEGORY_BASE,
  TAG_BASE,
} from "./permalinks";

import type { Post } from "~/types";
import { APP_BLOG } from "~/utils/config";

/**
 * Generate a permalink string for a post using the configured pattern.
 * @param {{id:string,slug:string,publishDate:Date,category?:string}} options
 * @returns {Promise<string>} The generated permalink (without leading/trailing slashes)
 */
const generatePermalink = async ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category: string | undefined;
}): Promise<string> => {
  const year = String(publishDate.getFullYear()).padStart(4, "0");
  const month = String(publishDate.getMonth() + 1).padStart(2, "0");
  const day = String(publishDate.getDate()).padStart(2, "0");
  const hour = String(publishDate.getHours()).padStart(2, "0");
  const minute = String(publishDate.getMinutes()).padStart(2, "0");
  const second = String(publishDate.getSeconds()).padStart(2, "0");

  const permalink = POST_PERMALINK_PATTERN.replace("%slug%", slug)
    .replace("%id%", id)
    .replace("%category%", category || "")
    .replace("%year%", year)
    .replace("%month%", month)
    .replace("%day%", day)
    .replace("%hour%", hour)
    .replace("%minute%", minute)
    .replace("%second%", second);

  return permalink
    .split("/")
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join("/");
};

/**
 * Normalize a collection entry into the site's `Post` shape.
 * @param {CollectionEntry<"post">} post - Raw Astro collection entry for a post
 * @returns {Promise<Post>} The normalized post object
 */
const getNormalizedPost = async (
  post: CollectionEntry<"post">,
): Promise<Post> => {
  const { id, slug: rawSlug = "", data } = post;
  const { Content, remarkPluginFrontmatter } = await post.render();

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    metadata = {},
  } = data;

  const slug = cleanSlug(rawSlug); // cleanSlug(rawSlug.split('/').pop());
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;
  const category = rawCategory ? cleanSlug(rawCategory) : undefined;
  const tags = rawTags.map((tag: string) => cleanSlug(tag));

  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, publishDate, category }),

    publishDate: publishDate,
    updateDate: updateDate,

    title: title,
    excerpt: excerpt,
    image: image,

    category: category,
    tags: tags,
    author: author,

    draft: draft,

    metadata,

    Content: Content,
    // or 'content' in case you consume from API

    readingTime: remarkPluginFrontmatter?.readingTime,
  };
};

/**
 * Pick up to `num` random entries from `array` (removes chosen items from input array).
 * @param {Post[]} array - Source posts array (will be mutated)
 * @param {number} num - Number of posts to pick
 * @returns {Post[]} Randomized selection of posts
 */
const getRandomizedPosts = (array: Post[], num: number): Post[] => {
  const newArray: Post[] = [];

  while (newArray.length < num && array.length > 0) {
    const randomIndex = Math.floor(Math.random() * array.length);
    newArray.push(array[randomIndex]);
    array.splice(randomIndex, 1);
  }

  return newArray;
};

/**
 * Load all posts from the Astro collection and normalize them.
 * @returns {Promise<Array<Post>>} All normalized posts (sorted newest-first, drafts removed)
 */
const load = async function (): Promise<Array<Post>> {
  const posts = await getCollection("post");
  const normalizedPosts = posts.map(
    async (post) => await getNormalizedPost(post),
  );

  const results = (await Promise.all(normalizedPosts))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((post) => !post.draft);

  return results;
};

let _posts: Array<Post>;

/** */
export const isBlogEnabled = APP_BLOG.isEnabled;
export const isRelatedPostsEnabled = APP_BLOG.isRelatedPostsEnabled;
export const isBlogListRouteEnabled = APP_BLOG.list.isEnabled;
export const isBlogPostRouteEnabled = APP_BLOG.post.isEnabled;
export const isBlogCategoryRouteEnabled = APP_BLOG.category.isEnabled;
export const isBlogTagRouteEnabled = APP_BLOG.tag.isEnabled;

export const blogListRobots = APP_BLOG.list.robots;
export const blogPostRobots = APP_BLOG.post.robots;
export const blogCategoryRobots = APP_BLOG.category.robots;
export const blogTagRobots = APP_BLOG.tag.robots;

export const blogPostsPerPage = APP_BLOG?.postsPerPage;

/** */
/**
 * Return cached posts (loads and caches on first call).
 * @returns {Promise<Array<Post>>} Cached posts
 */
export const fetchPosts = async (): Promise<Array<Post>> => {
  if (!_posts) {
    _posts = await load();
  }

  return _posts;
};

/** */
/**
 * Find posts by their slugs.
 * @param {Array<string>} slugs - Array of post slugs to find
 * @returns {Promise<Array<Post>>} Matching posts in the same order as `slugs`
 */
export const findPostsBySlugs = async (
  slugs: Array<string>,
): Promise<Array<Post>> => {
  if (!Array.isArray(slugs)) return [];

  const posts = await fetchPosts();

  return slugs.reduce(function (r: Array<Post>, slug: string) {
    posts.some(function (post: Post) {
      return slug === post.slug && r.push(post);
    });
    return r;
  }, []);
};

/** */
/**
 * Find posts by their ids.
 * @param {Array<string>} ids - Array of post ids to find
 * @returns {Promise<Array<Post>>} Matching posts in the same order as `ids`
 */
export const findPostsByIds = async (
  ids: Array<string>,
): Promise<Array<Post>> => {
  if (!Array.isArray(ids)) return [];

  const posts = await fetchPosts();

  return ids.reduce(function (r: Array<Post>, id: string) {
    posts.some(function (post: Post) {
      return id === post.id && r.push(post);
    });
    return r;
  }, []);
};

/** */
/**
 * Return the latest posts up to `count`.
 * @param {{count?: number}} options - Optional count of items to return
 * @returns {Promise<Array<Post>>} Latest posts
 */
export const findLatestPosts = async ({
  count,
}: {
  count?: number;
}): Promise<Array<Post>> => {
  const _count = count || 4;
  const posts = await fetchPosts();

  return posts ? posts.slice(0, _count) : [];
};

/** */
/**
 * Get static paths for the blog list (paginated).
 * @param {{paginate: PaginateFunction}} root0 - Object containing `paginate`
 * @returns {Promise<unknown>} Result of `paginate` or empty array when blog disabled
 */
export const getStaticPathsBlogList = async ({
  paginate,
}: {
  paginate: PaginateFunction;
}): Promise<unknown> => {
  if (!isBlogEnabled || !isBlogListRouteEnabled) return [];
  return paginate(await fetchPosts(), {
    params: { blog: BLOG_BASE || undefined },
    pageSize: blogPostsPerPage,
  });
};

/** */
/**
 * Get static paths for individual blog posts.
 * @returns {Promise<unknown>} Array of path objects for each post or empty array
 */
export const getStaticPathsBlogPost = async (): Promise<unknown> => {
  if (!isBlogEnabled || !isBlogPostRouteEnabled) return [];
  return (await fetchPosts()).flatMap((post) => ({
    params: {
      blog: post.permalink,
    },
    props: { post },
  }));
};

/** */
/**
 * Get static paths for blog categories (paginated).
 * @param {{paginate: PaginateFunction}} root0 - Object containing `paginate`
 * @returns {Promise<unknown>} Result of paginate for each category
 */
export const getStaticPathsBlogCategory = async ({
  paginate,
}: {
  paginate: PaginateFunction;
}): Promise<unknown> => {
  if (!isBlogEnabled || !isBlogCategoryRouteEnabled) return [];

  const posts = await fetchPosts();
  const categories = new Set<string>();
  posts.map((post) => {
    typeof post.category === "string" &&
      categories.add(post.category.toLowerCase());
  });

  return Array.from(categories).flatMap((category) =>
    paginate(
      posts.filter(
        (post) =>
          typeof post.category === "string" &&
          category === post.category.toLowerCase(),
      ),
      {
        params: { category: category, blog: CATEGORY_BASE || undefined },
        pageSize: blogPostsPerPage,
        props: { category },
      },
    ),
  );
};

/** */
/**
 * Get static paths for blog tags (paginated).
 * @param {{paginate: PaginateFunction}} root0 - Object containing `paginate`
 * @returns {Promise<unknown>} Result of paginate for each tag
 */
export const getStaticPathsBlogTag = async ({
  paginate,
}: {
  paginate: PaginateFunction;
}): Promise<unknown> => {
  if (!isBlogEnabled || !isBlogTagRouteEnabled) return [];

  const posts = await fetchPosts();
  const tags = new Set<string>();
  posts.map((post) => {
    Array.isArray(post.tags) &&
      post.tags.map((tag) => tags.add(tag.toLowerCase()));
  });

  return Array.from(tags).flatMap((tag) =>
    paginate(
      posts.filter(
        (post) =>
          Array.isArray(post.tags) &&
          post.tags.find((elem) => elem.toLowerCase() === tag),
      ),
      {
        params: { tag: tag, blog: TAG_BASE || undefined },
        pageSize: blogPostsPerPage,
        props: { tag },
      },
    ),
  );
};

/** */
/**
 * Return related posts for a given post by tag overlap, filling with random posts when needed.
 * @param {Post[]} allPosts - All available posts
 * @param {string} currentSlug - Slug of the current post
 * @param {string[]} currentTags - Tags of the current post
 * @returns {Post[]} Array of related posts
 */
export function getRelatedPosts(
  allPosts: Post[],
  currentSlug: string,
  currentTags: string[],
): Post[] {
  if (!isBlogEnabled || !isRelatedPostsEnabled) return [];

  const relatedPosts = getRandomizedPosts(
    allPosts.filter(
      (post) =>
        post.slug !== currentSlug &&
        post.tags?.some((tag) => currentTags.includes(tag)),
    ),
    APP_BLOG.relatedPostsCount,
  );

  if (relatedPosts.length < APP_BLOG.relatedPostsCount) {
    const morePosts = getRandomizedPosts(
      allPosts.filter(
        (post) =>
          post.slug !== currentSlug &&
          !post.tags?.some((tag) => currentTags.includes(tag)),
      ),
      APP_BLOG.relatedPostsCount - relatedPosts.length,
    );
    relatedPosts.push(...morePosts);
  }

  return relatedPosts;
}

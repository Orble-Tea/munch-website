import { getRssString } from "@astrojs/rss";

import { SITE, METADATA, APP_BLOG } from "~/utils/config";
import { fetchPosts } from "~/utils/blog";
import { getPermalink } from "~/utils/permalinks";

/**
 * Generate RSS feed XML for the blog.
 *
 * @returns {Promise<Response>} A Response containing XML RSS output.
 */
export const GET = async (): Promise<Response> => {
  if (!APP_BLOG.isEnabled) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const posts = await fetchPosts();

  const rss = await getRssString({
    title: `${SITE.name}’s Blog`,
    description: METADATA?.description ?? "",
    site: import.meta.env.SITE,

    items: posts.map((post) => ({
      link: getPermalink(post.permalink, "post"),
      title: post.title,
      description: post.excerpt,
      pubDate: post.publishDate,
    })),

    trailingSlash: SITE.trailingSlash,
  });

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};

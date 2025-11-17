const DEFAULT_SITE_NAME = "Munch Industries";

/**
 * Returns site configuration.
 * @returns {{
 *   name: string;
 *   site: string;
 *   base: string;
 *   trailingSlash: boolean;
 *   googleSiteVerificationId: string;
 * }}
 */
const getSite = (): {
  name: string;
  site: string;
  base: string;
  trailingSlash: boolean;
  googleSiteVerificationId: string;
} => ({
  name: DEFAULT_SITE_NAME,
  site: "https://munch-industries.com",
  base: "/",
  trailingSlash: false,
  googleSiteVerificationId: "orcPxI47GSa-cRvY11tUe6iGg2IO_RPvnA1q95iEM3M",
});

/**
 * Returns spam/honeypot configuration.
 * @returns {{
 *   honeypotField: string;
 *   honeypotDuration: number;
 * }}
 */
const getSpam = (): {
  honeypotField: string;
  honeypotDuration: number;
} => ({
  honeypotField: "honeypot",
  honeypotDuration: 2000,
});

/**
 * Returns site metadata configuration.
 * @returns {object}
 */
const getMetadata = (): {
  title: { default: string; template: string };
  description: string;
  robots: { index: boolean; follow: boolean };
  openGraph: {
    siteName: string;
    images: { url: string; width: number; height: number }[];
    type: string;
  };
  twitter: {
    handle: string;
    site: string;
    cardType: string;
  };
} => ({
  title: {
    default: DEFAULT_SITE_NAME,
    template: "%s — Munch Industries",
  },
  description: "Pioneering food automation.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: DEFAULT_SITE_NAME,
    images: [
      {
        url: "~/assets/images/preview-page.jpeg",
        width: 1200,
        height: 872,
      },
    ],
    type: "website",
  },
  twitter: {
    handle: "@onwidget",
    site: "@onwidget",
    cardType: "summary_large_image",
  },
});

/**
 * Returns i18n configuration.
 * @returns {{
 *   language: string;
 *   textDirection: string;
 *   dateFormatter: Intl.DateTimeFormat;
 * }}
 */
const getI18N = (): {
  language: string;
  textDirection: string;
  dateFormatter: Intl.DateTimeFormat;
} => ({
  language: "en",
  textDirection: "ltr",
  dateFormatter: new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }),
});

/**
 * Returns blog configuration.
 * @returns {object}
 */
const getAppBlog = (): {
  isEnabled: boolean;
  postsPerPage: number;
  isRelatedPostsEnabled: boolean;
  relatedPostsCount: number;
  post: {
    isEnabled: boolean;
    permalink: string;
    robots: { index: boolean; follow: boolean };
  };
  list: {
    isEnabled: boolean;
    pathname: string;
    robots: { index: boolean; follow: boolean };
  };
  category: {
    isEnabled: boolean;
    pathname: string;
    robots: { index: boolean; follow: boolean };
  };
  tag: {
    isEnabled: boolean;
    pathname: string;
    robots: { index: boolean; follow: boolean };
  };
} => ({
  isEnabled: true,
  postsPerPage: 6,
  isRelatedPostsEnabled: true,
  relatedPostsCount: 4,
  post: {
    isEnabled: true,
    permalink: "/%slug%",
    robots: {
      index: true,
      follow: true,
    },
  },
  list: {
    isEnabled: true,
    pathname: "blog",
    robots: {
      index: true,
      follow: true,
    },
  },
  category: {
    isEnabled: true,
    pathname: "category",
    robots: {
      index: true,
      follow: true,
    },
  },
  tag: {
    isEnabled: true,
    pathname: "tag",
    robots: {
      index: false,
      follow: true,
    },
  },
});

/**
 * Returns UI theme configuration.
 * @returns {object}
 */
const getUI = (): {
  theme: string;
  classes: Record<string, unknown>;
  tokens: {
    default: {
      fonts: Record<string, string>;
      colors: Record<string, string>;
    };
    dark: {
      fonts: Record<string, string>;
      colors: Record<string, string>;
    };
  };
} => ({
  theme: "system",
  classes: {},
  tokens: {
    default: {
      fonts: {
        sans: "InterVariable",
        serif: "var(--ph-font-sans)",
        heading: "var(--ph-font-sans)",
      },
      colors: {
        default: "rgb(16, 16, 16)",
        heading: "rgb(0, 0, 0)",
        muted: "rgb(40, 40, 40)",
        bgPage: "rgb(255, 255, 255)",
        primary: "rgb(0, 124, 220)",
        secondary: "rgb(30, 58, 138)",
        accent: "rgb(109, 40, 217)",
        info: "rgb(119, 182, 234)",
        success: "rgb(54, 211, 153)",
        warning: "rgb(251, 189, 35)",
        error: "rgb(248, 114, 114)",
        link: "var(--ph-color-primary)",
        linkActive: "var(--ph-color-link)",
      },
    },
    dark: {
      fonts: {},
      colors: {
        default: "rgb(247, 248, 248)",
        heading: "rgb(247, 248, 248)",
        muted: "rgb(200, 188, 208)",
        bgPage: "rgb(3, 6, 32)",
        primary: "rgb(29, 78, 216)",
        secondary: "rgb(30, 58, 138)",
        accent: "rgb(135, 77, 2267)",
        info: "rgb(58, 191, 248)",
        success: "rgb(54, 211, 153)",
        warning: "rgb(251, 189, 35)",
        error: "rgb(248, 114, 114)",
        link: "var(--ph-color-primary)",
        linkActive: "var(--ph-color-link)",
      },
    },
  },
});

/**
 * Returns analytics vendor configuration.
 * @returns {{
 *   vendors: {
 *     googleAnalytics: {
 *       id: string | null;
 *       partytown: boolean;
 *     };
 *   };
 * }}
 */
const getAnalytics = (): {
  vendors: {
    googleAnalytics: {
      id: string | null;
      partytown: boolean;
    };
  };
} => ({
  vendors: {
    googleAnalytics: {
      id: null,
      partytown: true,
    },
  },
});

export const SITE = getSite();
export const I18N = getI18N();
export const METADATA = getMetadata();
export const APP_BLOG = getAppBlog();
export const UI = getUI();
export const ANALYTICS = getAnalytics();
export const SPAM = getSpam();

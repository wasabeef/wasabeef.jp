// Typography and spacing constants
export const TYPOGRAPHY = {
  fonts: {
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
  sizes: {
    code: "0.875rem",
    codeInline: "0.875em",
  },
  lineHeights: {
    code: 1.6,
    prose: 1.7,
  },
} as const;

// Color constants for Prism theme
export const PRISM_COLORS = {
  comment: "#6a737d",
  punctuation: "#24292e",
  property: "#005cc5",
  string: "#032f62",
  operator: "#d73a49",
  keyword: "#d73a49",
  function: "#6f42c1",
  variable: "#e36209",
} as const;

// Layout constants
export const LAYOUT = {
  maxWidth: {
    content: "2xl",
    prose: "none",
  },
  padding: {
    codeBlock: "1.5rem",
    page: {
      mobile: "1rem",
      desktop: "6rem",
    },
  },
  scrollMarginTop: "5rem", // 20 * 0.25rem = 5rem
} as const;

// Icon sizes
export const ICON_SIZES = {
  small: "h-4 w-4",
  medium: "h-5 w-5",
  large: "h-6 w-6",
} as const;

// External link constants
export const EXTERNAL_LINK = {
  indicator: "↗",
  ariaLabel: "(新しいタブで開く)",
} as const;

// Error messages in Japanese
export const ERROR_MESSAGES = {
  postNotFound: "記事が見つかりません",
  generalError: "エラーが発生しました",
  blogLoadError: "ブログの読み込み中にエラーが発生しました",
  pageNotFound: "ページが見つかりません",
  searchNotFound: "お探しのページは存在しないか、移動された可能性があります。",
  contactAdmin: "問題が続く場合は、サイト管理者にお問い合わせください。",
} as const;

// Navigation messages
export const NAV_MESSAGES = {
  backToHome: "ホームに戻る",
  backToBlog: "ブログ一覧に戻る",
  viewBlog: "ブログを見る",
  allPosts: "すべての記事",
  recentPosts: "最新の記事",
} as const;

// Magic numbers
export const LIMITS = {
  postsPerPage: 10,
  recentPosts: 3,
} as const;

// Image dimensions
export const IMAGE_DIMENSIONS = {
  ogImage: {
    width: 1200,
    height: 630,
  },
} as const;

// Animation durations (in ms)
export const ANIMATIONS = {
  fadeIn: 600,
  transition: 200,
} as const;

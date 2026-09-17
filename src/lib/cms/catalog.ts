import { SITE_ASSETS } from "@/lib/site-assets";

export type CmsFieldType = "text" | "textarea" | "image" | "url" | "select";

export type CmsField = {
  key: string;
  label: string;
  type: CmsFieldType;
  hint?: string;
  optionsSource?: "courses" | "ebooks";
};

export type CmsKind = "setting" | "section" | "item";

export type CmsDefinition = {
  kind: CmsKind;
  key: string;
  parentKey?: string;
  label: string;
  placement: string;
  groupName: string;
  sortOrder: number;
  enabled: boolean;
  fields: CmsField[];
  data: Record<string, string>;
  itemFields?: CmsField[];
};

const text = (key: string, label: string, hint?: string): CmsField => ({ key, label, type: "text", hint });
const area = (key: string, label: string, hint?: string): CmsField => ({ key, label, type: "textarea", hint });
const image = (key: string, label: string, hint?: string): CmsField => ({ key, label, type: "image", hint });
const url = (key: string, label: string, hint?: string): CmsField => ({ key, label, type: "url", hint });
const courseSelect = (key: string, label: string, hint?: string): CmsField => ({
  key,
  label,
  type: "select",
  hint,
  optionsSource: "courses",
});
const ebookSelect = (key: string, label: string, hint?: string): CmsField => ({
  key,
  label,
  type: "select",
  hint,
  optionsSource: "ebooks",
});

const linkFields: CmsField[] = [text("label", "Label"), url("href", "Link")];
const statFields: CmsField[] = [text("value", "Number"), text("label", "Label"), text("icon", "Icon name", "Material icon, e.g. groups")];
const benefitFields: CmsField[] = [text("text", "Benefit")];
const featureFields: CmsField[] = [text("text", "Point")];
const trustFields: CmsField[] = [text("label", "Label"), text("icon", "Icon name")];
const cardFields: CmsField[] = [text("icon", "Icon name"), text("title", "Title"), area("description", "Description")];
const stepFields: CmsField[] = [text("icon", "Icon name"), text("title", "Title"), text("description", "Description")];
const moduleFields: CmsField[] = [
  text("num", "Number"),
  text("title", "Title"),
  text("meta", "Meta"),
  area("summary", "Summary", "Leave blank if you list lessons below."),
  area("lessons", "Lessons", "One per line: Lesson title | 15:20"),
];

function setting(
  key: string,
  label: string,
  placement: string,
  groupName: string,
  sortOrder: number,
  fields: CmsField[],
  data: Record<string, string>,
): CmsDefinition {
  return { kind: "setting", key, label, placement, groupName, sortOrder, enabled: true, fields, data };
}

function section(
  key: string,
  label: string,
  placement: string,
  groupName: string,
  sortOrder: number,
  fields: CmsField[],
  data: Record<string, string>,
  itemFields?: CmsField[],
): CmsDefinition {
  return { kind: "section", key, label, placement, groupName, sortOrder, enabled: true, fields, data, itemFields };
}

function item(
  key: string,
  parentKey: string,
  label: string,
  placement: string,
  groupName: string,
  sortOrder: number,
  fields: CmsField[],
  data: Record<string, string>,
): CmsDefinition {
  return { kind: "item", key, parentKey, label, placement, groupName, sortOrder, enabled: true, fields, data };
}

export const CMS_DEFINITIONS: CmsDefinition[] = [
  setting(
    "site.settings",
    "Site identity",
    "Header, footer, and browser tab",
    "Site",
    1,
    [
      text("name", "Site name"),
      text("tagline", "Tagline"),
      image("logo", "Logo"),
      image("favicon", "Favicon"),
      text("email", "Email"),
      text("phone", "Phone"),
      area("address", "Address"),
      area("footerDescription", "Footer description"),
      text("copyrightName", "Copyright name"),
    ],
    {
      name: "Sikau Paisa",
      tagline: "Learn · Grow · Earn",
      logo: SITE_ASSETS.logo,
      favicon: SITE_ASSETS.logo,
      email: "",
      phone: "",
      address: "",
      footerDescription:
        "Empowering every Nepali household with the right knowledge of money, saving, investing and wealth creation. Founded by Raju Khatiwada.",
      copyrightName: "Sikau Paisa",
    },
  ),
  setting(
    "seo.site",
    "Default SEO",
    "Pages that do not have their own title",
    "SEO",
    1,
    [
      text("title", "Page title"),
      area("description", "Meta description"),
      text("ogTitle", "Social title"),
      area("ogDescription", "Social description"),
      image("ogImage", "Social image"),
    ],
    {
      title: "Sikau Paisa | Fintech Academy",
      description:
        "Master personal finance, investing, and digital payments with Nepal's gamified fintech learning platform.",
      ogTitle: "Sikau Paisa | Fintech Academy",
      ogDescription:
        "Master personal finance, investing, and digital payments with Nepal's gamified fintech learning platform.",
      ogImage: SITE_ASSETS.cover,
    },
  ),
  setting(
    "seo.home",
    "Homepage SEO",
    "The homepage title and social preview",
    "SEO",
    2,
    [
      text("title", "Page title"),
      area("description", "Meta description"),
      text("ogTitle", "Social title"),
      area("ogDescription", "Social description"),
      image("ogImage", "Social image"),
    ],
    {
      title: "Sikau Paisa | Personal Finance Masterclass by Raju Khatiwada",
      description:
        "Master the art of SIP, life insurance, and wealth building with Raju Khatiwada. Join Nepal's leading financial education community.",
      ogTitle: "Sikau Paisa | Personal Finance Masterclass by Raju Khatiwada",
      ogDescription:
        "Master the art of SIP, life insurance, and wealth building with Raju Khatiwada. Join Nepal's leading financial education community.",
      ogImage: SITE_ASSETS.raju1,
    },
  ),
  setting(
    "seo.learn",
    "Learn page SEO",
    "/learn title and social preview",
    "SEO",
    3,
    [
      text("title", "Page title"),
      area("description", "Meta description"),
      text("ogTitle", "Social title"),
      area("ogDescription", "Social description"),
      image("ogImage", "Social image"),
    ],
    {
      title: "Learn | Sikau Paisa",
      description:
        "Explore Raju Khatiwada's Personal Finance Masterclass and all Sikau Paisa courses on budgeting, investing, and digital finance.",
      ogTitle: "Learn | Sikau Paisa",
      ogDescription:
        "Explore Raju Khatiwada's Personal Finance Masterclass and all Sikau Paisa courses on budgeting, investing, and digital finance.",
      ogImage: SITE_ASSETS.cover,
    },
  ),
  section("site.nav", "Main menu", "Header on every page", "Menu & footer", 1, [], {}, linkFields),
  item("site.nav.home", "site.nav", "Home", "Main menu", "Menu & footer", 1, linkFields, { label: "Home", href: "/" }),
  item("site.nav.ebooks", "site.nav", "Ebook", "Main menu", "Menu & footer", 2, linkFields, { label: "Ebook", href: "/ebooks" }),
  item("site.nav.learn", "site.nav", "Courses", "Main menu", "Menu & footer", 3, linkFields, { label: "Courses", href: "/learn" }),
  item("site.nav.newsletter", "site.nav", "Newsletter", "Main menu", "Menu & footer", 4, linkFields, {
    label: "Newsletter",
    href: "/newsletter",
  }),
  item("site.nav.community", "site.nav", "Community", "Main menu", "Menu & footer", 5, linkFields, {
    label: "Community",
    href: "/community",
  }),
  item("site.nav.blog", "site.nav", "Blog", "Main menu", "Menu & footer", 6, linkFields, { label: "Blog", href: "/blog" }),
  section("site.footer.quick", "Footer quick links", "Footer column", "Menu & footer", 2, [text("heading", "Heading")], { heading: "Quick Links" }, linkFields),
  item("site.footer.quick.home", "site.footer.quick", "Home", "Footer quick links", "Menu & footer", 1, linkFields, { label: "Home", href: "/" }),
  item("site.footer.quick.ebook", "site.footer.quick", "NEPSE Ebook", "Footer quick links", "Menu & footer", 2, linkFields, {
    label: "NEPSE Ebook",
    href: "/ebooks",
  }),
  item("site.footer.quick.newsletter", "site.footer.quick", "Newsletter", "Footer quick links", "Menu & footer", 3, linkFields, {
    label: "Newsletter",
    href: "/newsletter",
  }),
  item("site.footer.quick.community", "site.footer.quick", "Community", "Footer quick links", "Menu & footer", 4, linkFields, {
    label: "Community",
    href: "/community",
  }),
  item("site.footer.quick.blog", "site.footer.quick", "Blog", "Footer quick links", "Menu & footer", 5, linkFields, { label: "Blog", href: "/blog" }),
  section("site.footer.resources", "Footer resources", "Footer column", "Menu & footer", 3, [text("heading", "Heading")], { heading: "Resources" }, linkFields),
  item("site.footer.resources.subscribe", "site.footer.resources", "Subscribe", "Footer resources", "Menu & footer", 1, linkFields, {
    label: "Subscribe newsletter",
    href: "/newsletter",
  }),
  item("site.footer.resources.read", "site.footer.resources", "Start reading", "Footer resources", "Menu & footer", 2, linkFields, {
    label: "Start reading",
    href: "/ebooks",
  }),
  item("site.footer.resources.blog", "site.footer.resources", "Blog", "Footer resources", "Menu & footer", 3, linkFields, { label: "Blog", href: "/blog" }),
  item("site.footer.resources.login", "site.footer.resources", "Login", "Footer resources", "Menu & footer", 4, linkFields, { label: "Login", href: "/login" }),
  item("site.footer.resources.signup", "site.footer.resources", "Sign up", "Footer resources", "Menu & footer", 5, linkFields, { label: "Sign up", href: "/signup" }),
  section("site.footer.legal", "Footer legal links", "Bottom of the footer", "Menu & footer", 4, [], {}, linkFields),
  item("site.footer.legal.privacy", "site.footer.legal", "Privacy", "Footer legal links", "Menu & footer", 1, linkFields, { label: "Privacy Policy", href: "#" }),
  item("site.footer.legal.terms", "site.footer.legal", "Terms", "Footer legal links", "Menu & footer", 2, linkFields, { label: "Terms", href: "#" }),
  item("site.footer.legal.cookies", "site.footer.legal", "Cookies", "Footer legal links", "Menu & footer", 3, linkFields, { label: "Cookies", href: "#" }),
  section(
    "site.social",
    "Social links",
    "Footer social icons",
    "Menu & footer",
    5,
    [],
    {},
    [text("label", "Name"), url("href", "Link"), text("icon", "Icon name")],
  ),
  item("site.social.facebook", "site.social", "Facebook", "Social links", "Menu & footer", 1, [text("label", "Name"), url("href", "Link"), text("icon", "Icon name")], {
    label: "Facebook",
    href: "#",
    icon: "groups",
  }),
  item("site.social.instagram", "site.social", "Instagram", "Social links", "Menu & footer", 2, [text("label", "Name"), url("href", "Link"), text("icon", "Icon name")], {
    label: "Instagram",
    href: "#",
    icon: "photo_camera",
  }),
  item("site.social.youtube", "site.social", "YouTube", "Social links", "Menu & footer", 3, [text("label", "Name"), url("href", "Link"), text("icon", "Icon name")], {
    label: "YouTube",
    href: "#",
    icon: "play_circle",
  }),
  item("site.social.linkedin", "site.social", "LinkedIn", "Social links", "Menu & footer", 4, [text("label", "Name"), url("href", "Link"), text("icon", "Icon name")], {
    label: "LinkedIn",
    href: "#",
    icon: "work",
  }),
  section("site.footer.newsletter", "Footer newsletter", "Footer newsletter column", "Menu & footer", 6, [text("heading", "Heading")], {
    heading: "Newsletter",
  }),
  section(
    "home.hero",
    "Hero",
    "Homepage top",
    "Homepage",
    1,
    [
      text("badge", "Badge"),
      text("titleLine1", "Title, first line"),
      text("titleLine2", "Title, second line"),
      image("image", "Hero photo"),
      text("imageAlt", "Photo description"),
      text("primaryCta", "Primary button"),
      url("primaryHref", "Primary button link"),
      text("secondaryCta", "Secondary button"),
      url("secondaryHref", "Secondary button link", "Leave blank to keep the current preview button."),
    ],
    {
      badge: "Nepal's Leading Financial Educator",
      titleLine1: "Take Control of",
      titleLine2: "Your Money",
      image: SITE_ASSETS.raju1,
      imageAlt: "Raju Khatiwada",
      primaryCta: "Get the Ebook",
      primaryHref: "/ebooks",
      secondaryCta: "Watch Free Preview",
      secondaryHref: "",
    },
    benefitFields,
  ),
  item("home.hero.benefit.1", "home.hero", "Benefit 1", "Homepage hero", "Homepage", 1, benefitFields, { text: "Learn SIP investing step-by-step" }),
  item("home.hero.benefit.2", "home.hero", "Benefit 2", "Homepage hero", "Homepage", 2, benefitFields, { text: "Understand life & health insurance" }),
  item("home.hero.benefit.3", "home.hero", "Benefit 3", "Homepage hero", "Homepage", 3, benefitFields, { text: "Build long-term wealth with confidence" }),
  item("home.hero.benefit.4", "home.hero", "Benefit 4", "Homepage hero", "Homepage", 4, benefitFields, { text: "Real examples from the Nepali market" }),
  section("home.hero.stats", "Hero stats", "Numbers under the homepage title", "Homepage", 2, [], {}, statFields),
  item("home.hero.stats.1", "home.hero.stats", "Followers", "Hero stats", "Homepage", 1, statFields, { value: "45k+", label: "Trusted Nepalis", icon: "groups" }),
  item("home.hero.stats.2", "home.hero.stats", "Rating", "Hero stats", "Homepage", 2, statFields, { value: "4.9", label: "Average rating", icon: "star" }),
  item("home.hero.stats.3", "home.hero.stats", "Lessons", "Hero stats", "Homepage", 3, statFields, { value: "100+", label: "Expert lessons", icon: "school" }),
  section("home.trust", "Trust bar", "Scrolling bar under the hero", "Homepage", 3, [], {}, trustFields),
  item("home.trust.1", "home.trust", "Followers", "Trust bar", "Homepage", 1, trustFields, { icon: "groups", label: "45,000+ Followers" }),
  item("home.trust.2", "home.trust", "Learning", "Trust bar", "Homepage", 2, trustFields, { icon: "school", label: "Practical Learning" }),
  item("home.trust.3", "home.trust", "Access", "Trust bar", "Homepage", 3, trustFields, { icon: "history", label: "Lifetime Access" }),
  item("home.trust.4", "home.trust", "Strategies", "Trust bar", "Homepage", 4, trustFields, { icon: "verified_user", label: "Verified Strategies" }),
  item("home.trust.5", "home.trust", "Support", "Trust bar", "Homepage", 5, trustFields, { icon: "chat", label: "24/7 Community Support" }),
  section(
    "home.raju",
    "Meet Raju",
    "Homepage story section",
    "Homepage",
    4,
    [
      text("title", "Heading"),
      area("description", "Description"),
      image("image", "Photo"),
      text("imageAlt", "Photo description"),
      area("quote", "Quote"),
      text("cta", "Button text"),
      url("ctaHref", "Button link"),
    ],
    {
      title: "Meet Raju Khatiwada",
      description:
        "With over a decade of experience in financial markets and education, Raju has simplified complex investing for thousands of Nepalis worldwide.",
      image: SITE_ASSETS.raju2,
      imageAlt: "Raju Khatiwada teaching",
      quote: "Financial freedom isn't a dream, it's a calculated plan.",
      cta: "Watch My Story",
      ctaHref: "",
    },
    [text("title", "Title"), area("description", "Description")],
  ),
  item("home.raju.1", "home.raju", "Beginning", "Meet Raju timeline", "Homepage", 1, [text("title", "Title"), area("description", "Description")], {
    title: "The Beginning",
    description: "Navigating the complexities of first-time saving.",
  }),
  item("home.raju.2", "home.raju", "Market", "Meet Raju timeline", "Homepage", 2, [text("title", "Title"), area("description", "Description")], {
    title: "Mastering the Market",
    description: "Years of learning institutional-grade investment strategies.",
  }),
  item("home.raju.3", "home.raju", "Launch", "Meet Raju timeline", "Homepage", 3, [text("title", "Title"), area("description", "Description")], {
    title: "Sikau Paisa Launch",
    description: "Creating a platform for democratized financial literacy.",
  }),
  section(
    "home.masterclass",
    "Featured course",
    "Dark course banner on the homepage",
    "Homepage",
    5,
    [
      courseSelect("courseSlug", "Course to promote", "Pick a published course. Title, photo, and price come from that course."),
      text("badge", "Badge"),
      text("title", "Heading override", "Leave blank to use the course title."),
      image("image", "Photo override", "Leave blank to use the course cover."),
      text("imageAlt", "Photo description"),
      text("listPrice", "Old price", "Optional crossed-out price, e.g. NPR 4,999"),
      text("price", "Price override", "Leave blank to use the course price."),
      text("cta", "Button text"),
    ],
    {
      courseSlug: "",
      badge: "Premium Course",
      title: "",
      image: "",
      imageAlt: "Course cover",
      listPrice: "",
      price: "",
      cta: "View course",
    },
    featureFields,
  ),
  item("home.masterclass.1", "home.masterclass", "Feature 1", "Featured course", "Homepage", 1, featureFields, { text: "4+ Hours of On-Demand HD Video" }),
  item("home.masterclass.2", "home.masterclass", "Feature 2", "Featured course", "Homepage", 2, featureFields, { text: "Lifetime Access & Free Updates" }),
  item("home.masterclass.3", "home.masterclass", "Feature 3", "Featured course", "Homepage", 3, featureFields, { text: "Exclusive Community Networking" }),
  item("home.masterclass.4", "home.masterclass", "Feature 4", "Featured course", "Homepage", 4, featureFields, { text: "Ready-to-use Wealth Calculators" }),
  section(
    "home.ebookPromo",
    "Featured ebook",
    "Ebook banner on the homepage",
    "Homepage",
    6,
    [
      ebookSelect("ebookSlug", "Ebook to promote", "Pick a published ebook. Title, cover, and price come from that ebook."),
      text("badge", "Badge"),
      text("title", "Heading override", "Leave blank to use the ebook title."),
      area("description", "Short description override", "Leave blank to use the ebook description."),
      image("image", "Cover override", "Leave blank to use the ebook cover."),
      text("listPrice", "Old price", "Optional crossed-out price"),
      text("price", "Price override", "Leave blank to use the ebook price."),
      text("cta", "Button text"),
    ],
    {
      ebookSlug: "",
      badge: "Ebook",
      title: "",
      description: "",
      image: "",
      listPrice: "",
      price: "",
      cta: "Get the ebook",
    },
  ),
  section(
    "home.newsletter",
    "Newsletter banner",
    "Homepage newsletter strip. Product title and price still come from Newsletter.",
    "Homepage",
    7,
    [text("badge", "Badge"), text("primaryCta", "Primary button"), text("secondaryCta", "Secondary button")],
    { badge: "Newsletter", primaryCta: "Subscribe", secondaryCta: "Login first" },
  ),
  section(
    "home.live",
    "Live sessions heading",
    "Homepage live section. Sessions themselves are managed under Live sessions.",
    "Homepage",
    8,
    [text("badge", "Badge"), text("title", "Heading"), area("description", "Description")],
    {
      badge: "Live sessions",
      title: "Join a live session",
      description: "Upcoming sessions scheduled by the admin. Join opens at the listed date and time once the host goes live.",
    },
  ),
  section(
    "home.curriculum",
    "Curriculum cards",
    "Homepage topic grid",
    "Homepage",
    9,
    [text("title", "Heading"), area("description", "Description")],
    {
      title: "A Comprehensive Curriculum",
      description: "Master every facet of personal finance with structured, jargon-free modules designed for practical execution.",
    },
    cardFields,
  ),
  ...[
    ["payments", "Budgeting", "Master the 50-30-20 rule and optimize expenses."],
    ["monitoring", "SIP Strategy", "Consistent wealth building through Mutual Funds."],
    ["health_and_safety", "Insurance", "Protecting your family from life's uncertainties."],
    ["savings", "Retirement", "Early retirement planning for a peaceful future."],
    ["account_balance", "Tax Planning", "Legal ways to maximize your tax savings."],
    ["real_estate_agent", "Real Estate", "Investing in land and properties wisely."],
    ["currency_exchange", "Stock Market", "Fundamental analysis for the long term."],
    ["credit_score", "Debt Management", "Escaping the trap of high-interest loans."],
    ["diversity_3", "Estate Planning", "Ensuring wealth transfers to your next generation."],
    ["diamond", "Wealth Creation", "The psychology and habit of the top 1%."],
  ].map(([icon, title, description], index) =>
    item(`home.curriculum.${index + 1}`, "home.curriculum", title, "Curriculum cards", "Homepage", index + 1, cardFields, {
      icon,
      title,
      description,
    }),
  ),
  section(
    "home.stories",
    "Reviews section",
    "Homepage reviews heading. Review cards come from Admin → Reviews.",
    "Homepage",
    10,
    [text("title", "Heading"), area("description", "Description")],
    {
      title: "What learners say",
      description: "Real feedback from people who joined Sikau Paisa.",
    },
  ),
  section(
    "home.roadmap",
    "Roadmap",
    "Homepage six-step journey",
    "Homepage",
    10,
    [text("title", "Heading"), area("description", "Description")],
    {
      title: "Your Financial Freedom Roadmap",
      description: "A 6-step journey to financial independence.",
    },
    stepFields,
  ),
  ...[
    ["visibility", "1. Understand", "Audit your current financial status"],
    ["calculate", "2. Budget", "Set strict spending boundaries"],
    ["trending_up", "3. Invest", "Deploy capital into high-yield SIPs"],
    ["shield", "4. Protect", "Secure life & health coverage"],
    ["event_available", "5. Plan", "Long-term retirement goals"],
    ["architecture", "6. Build Wealth", "Achieve compounding freedom"],
  ].map(([icon, title, description], index) =>
    item(`home.roadmap.${index + 1}`, "home.roadmap", title, "Roadmap", "Homepage", index + 1, stepFields, { icon, title, description }),
  ),
  section(
    "home.inside",
    "Inside the masterclass",
    "Homepage accordion",
    "Homepage",
    11,
    [text("title", "Heading"), area("description", "Description")],
    {
      title: "Inside the Masterclass",
      description: "7 Depth-Packed Modules. No filler content.",
    },
    moduleFields,
  ),
  item("home.inside.1", "home.inside", "Module 1", "Inside the masterclass", "Homepage", 1, moduleFields, {
    num: "01",
    title: "Introduction to Financial Freedom",
    meta: "3 Lessons • 45m",
    summary: "",
    lessons: "Understanding Wealth Psychology | 15:20\nIncome vs Assets: The Real Difference | 12:10\nSetting SMART Financial Goals | 18:05",
  }),
  item("home.inside.2", "home.inside", "Module 2", "Inside the masterclass", "Homepage", 2, moduleFields, {
    num: "02",
    title: "Mastering the SIP Engine",
    meta: "5 Lessons • 1h 15m",
    summary: "Deep dive into mutual fund selection, compounding math, and risk mitigation strategies.",
    lessons: "",
  }),
  item("home.inside.3", "home.inside", "Module 3", "Inside the masterclass", "Homepage", 3, moduleFields, {
    num: "03",
    title: "The Insurance Safety Net",
    meta: "4 Lessons • 50m",
    summary: "Choosing between Term and Endowment. Medical insurance hacks for Nepal.",
    lessons: "",
  }),
  section(
    "home.cta",
    "Closing banner",
    "Green banner at the bottom of the homepage",
    "Homepage",
    12,
    [
      text("title", "Heading"),
      area("description", "Description"),
      text("primaryCta", "Primary button"),
      url("primaryHref", "Primary button link"),
      text("secondaryCta", "Secondary button"),
      url("secondaryHref", "Secondary button link"),
    ],
    {
      title: "Your Financial Future Starts Today",
      description: "Join Raju and 45,000+ others in the mission to make Nepal financially literate and wealthy.",
      primaryCta: "Subscribe to Newsletter",
      primaryHref: "/newsletter",
      secondaryCta: "Get the NEPSE Ebook",
      secondaryHref: "/ebooks",
    },
  ),
  section(
    "learn.featured",
    "Featured course on Learn",
    "Top banner on /learn",
    "Learn page",
    1,
    [
      courseSelect("courseSlug", "Course to feature", "This course appears at the top of the Courses page."),
      text("badge", "Badge"),
      text("subtitle", "Subtitle", "Optional line under the title. Leave blank to use instructor name."),
      text("listPrice", "Old price", "Optional crossed-out price, e.g. NPR 4,999"),
      text("cta", "Button text for guests"),
      area("includes", "What you'll get", "One benefit per line. Shown in the side card."),
    ],
    {
      courseSlug: "",
      badge: "Featured course",
      subtitle: "",
      listPrice: "",
      cta: "View course",
      includes:
        "Lifetime access to all modules\nDownloadable worksheets & templates\nPrivate community access\nCompletion certificate\nMonthly live Q&A sessions",
    },
    featureFields,
  ),
  item("learn.featured.1", "learn.featured", "Feature 1", "Featured course on Learn", "Learn page", 1, featureFields, {
    text: "4+ Hours of On-Demand HD Video",
  }),
  item("learn.featured.2", "learn.featured", "Feature 2", "Featured course on Learn", "Learn page", 2, featureFields, {
    text: "Lifetime Access & Free Updates",
  }),
  item("learn.featured.3", "learn.featured", "Feature 3", "Featured course on Learn", "Learn page", 3, featureFields, {
    text: "Exclusive Community Networking",
  }),
  item("learn.featured.4", "learn.featured", "Feature 4", "Featured course on Learn", "Learn page", 4, featureFields, {
    text: "Ready-to-use Wealth Calculators",
  }),
  section(
    "learn.explore",
    "Course list heading",
    "Learn page, below the featured course",
    "Learn page",
    2,
    [text("badge", "Badge"), text("title", "Heading"), area("description", "Description")],
    {
      badge: "All Courses",
      title: "Explore More Lessons",
      description: "Browse premium and free courses across personal finance, investing, and digital payments.",
    },
  ),
  section(
    "dashboard.hero",
    "Dashboard welcome",
    "Logged-in dashboard header",
    "Logged-in pages",
    1,
    [text("badge", "Badge"), text("title", "Heading"), area("description", "Description")],
    {
      badge: "Your Dashboard",
      title: "Welcome back, Learner!",
      description: "Keep your streak alive and continue your financial education journey.",
    },
  ),
];

export const CMS_GROUPS = ["Site", "Menu & footer", "Homepage", "Learn page", "Logged-in pages", "SEO"] as const;

export function definitionByKey(key: string) {
  return CMS_DEFINITIONS.find((item) => item.key === key);
}

export function itemTemplate(parentKey: string) {
  return CMS_DEFINITIONS.find((item) => item.key === parentKey)?.itemFields ?? [];
}

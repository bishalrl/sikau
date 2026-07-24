export type Course = {
  id: string;
  title: string;
  titleNe: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  progress?: number;
  rating: number;
  students: number;
  instructor: string;
  featured?: boolean;
  image: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  questionNe: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const courses: Course[] = [
  {
    id: "budgeting-basics",
    title: "Budgeting Basics",
    titleNe: "बजेट बनाउने आधारभूत",
    description: "Learn to track income, expenses, and build your first monthly budget.",
    category: "Personal Finance",
    level: "Beginner",
    duration: "2h 30m",
    lessons: 8,
    progress: 62,
    rating: 4.9,
    students: 2840,
    instructor: "Raju Khatiwada",
    featured: true,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
  },
  {
    id: "investment-101",
    title: "Investment 101",
    titleNe: "लगानीको परिचय",
    description: "Understand stocks, mutual funds, and long-term wealth building.",
    category: "Investing",
    level: "Intermediate",
    duration: "4h 15m",
    lessons: 12,
    progress: 25,
    rating: 4.8,
    students: 1920,
    instructor: "Raju Khatiwada",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
  },
  {
    id: "digital-payments",
    title: "Digital Payments & eSewa",
    titleNe: "डिजिटल भुक्तानी",
    description: "Master mobile wallets, online banking, and safe digital transactions.",
    category: "Digital Finance",
    level: "Beginner",
    duration: "1h 45m",
    lessons: 6,
    rating: 4.7,
    students: 3100,
    instructor: "Sikau Team",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
  },
  {
    id: "tax-nepal",
    title: "Tax Planning in Nepal",
    titleNe: "नेपालमा कर योजना",
    description: "Navigate income tax, deductions, and filing requirements.",
    category: "Tax & Legal",
    level: "Advanced",
    duration: "3h 20m",
    lessons: 10,
    rating: 4.6,
    students: 980,
    instructor: "CA Binod Sharma",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop",
  },
  {
    id: "emergency-fund",
    title: "Emergency Fund Mastery",
    titleNe: "आकस्मिक कोष",
    description: "Build a safety net for unexpected expenses and job loss.",
    category: "Personal Finance",
    level: "Beginner",
    duration: "1h 20m",
    lessons: 5,
    rating: 4.9,
    students: 2200,
    instructor: "Raju Khatiwada",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop",
  },
  {
    id: "crypto-basics",
    title: "Crypto & Blockchain Basics",
    titleNe: "क्रिप्टो परिचय",
    description: "Understand blockchain technology and evaluate crypto investments.",
    category: "Investing",
    level: "Intermediate",
    duration: "2h 50m",
    lessons: 9,
    rating: 4.5,
    students: 1560,
    instructor: "Tech Finance Lab",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop",
  },
];

export const categories = [
  "All",
  "Personal Finance",
  "Investing",
  "Digital Finance",
  "Tax & Legal",
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the 50/30/20 budgeting rule?",
    questionNe: "५०/३०/२० बजेट नियम के हो?",
    options: [
      "50% needs, 30% wants, 20% savings",
      "50% savings, 30% needs, 20% wants",
      "50% wants, 30% savings, 20% needs",
      "Equal split across all categories",
    ],
    correctIndex: 0,
    explanation: "The 50/30/20 rule allocates 50% to needs, 30% to wants, and 20% to savings and debt repayment.",
  },
  {
    id: 2,
    question: "What is compound interest?",
    questionNe: "चक्रवृद्धि ब्याज के हो?",
    options: [
      "Interest only on the principal",
      "Interest on principal plus accumulated interest",
      "A fixed fee charged monthly",
      "Tax on investment returns",
    ],
    correctIndex: 1,
    explanation: "Compound interest earns returns on both your original amount and previously earned interest.",
  },
  {
    id: 3,
    question: "How many months of expenses should an emergency fund cover?",
    questionNe: "आकस्मिक कोषले कति महिनाको खर्च कभर गर्नुपर्छ?",
    options: ["1–2 months", "3–6 months", "12–18 months", "24 months minimum"],
    correctIndex: 1,
    explanation: "Financial experts recommend 3–6 months of living expenses in an easily accessible emergency fund.",
  },
  {
    id: 4,
    question: "What does diversification mean in investing?",
    questionNe: "लगानीमा विविधीकरण भनेको के हो?",
    options: [
      "Putting all money in one stock",
      "Spreading investments across different assets",
      "Only investing in gold",
      "Avoiding all risk",
    ],
    correctIndex: 1,
    explanation: "Diversification reduces risk by spreading investments across different asset classes and sectors.",
  },
  {
    id: 5,
    question: "Which is NOT a common digital payment method in Nepal?",
    questionNe: "नेपालमा कुन डिजिटल भुक्तानी विधि सामान्य छैन?",
    options: ["eSewa", "Khalti", "PayPal (widely used locally)", "Fonepay"],
    correctIndex: 2,
    explanation: "While eSewa, Khalti, and Fonepay are widely used in Nepal, PayPal has limited local adoption.",
  },
];

export const masterclassModules = [
  { title: "Mindset & Money Psychology", duration: "45 min", lessons: 3 },
  { title: "Building Your First Portfolio", duration: "1h 20m", lessons: 5 },
  { title: "Real Estate in Nepal", duration: "55 min", lessons: 4 },
  { title: "Side Hustles & Passive Income", duration: "1h 10m", lessons: 4 },
  { title: "Retirement Planning (NRS)", duration: "40 min", lessons: 3 },
];

export const dashboardStats = {
  streak: 12,
  xp: 2840,
  level: 7,
  coursesCompleted: 3,
  coursesInProgress: 2,
  quizScore: 87,
};

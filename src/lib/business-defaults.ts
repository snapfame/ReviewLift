export const BUSINESS_CATEGORIES = [
  "Automotive Services",
  "Salon & Spa",
  "Restaurant & Cafe",
  "Healthcare",
  "Retail",
  "Home Services",
  "Education",
  "Hospitality",
  "Professional Services",
  "Other",
] as const;

export const DEFAULT_ATTRIBUTES = [
  "Quality of Work",
  "Staff",
  "Finishing",
  "Pricing",
  "Speed",
  "Installation",
  "Product Range",
  "Communication",
  "Cleanliness",
  "Overall Experience",
] as const;

export interface DefaultService {
  name: string;
  vocabulary: string[];
}

export interface DefaultCategory {
  name: string;
  services: DefaultService[];
}

const AUTOMOTIVE: DefaultCategory[] = [
  {
    name: "Car Accessories",
    services: [
      {
        name: "Premium Car Accessories",
        vocabulary: ["selection", "installation", "product range", "fitment", "accessories"],
      },
    ],
  },
  {
    name: "Auto Deals",
    services: [{ name: "Auto Deals", vocabulary: ["communication", "deal process", "vehicle", "experience"] }],
  },
  {
    name: "Auto Detailing",
    services: [
      { name: "PPF", vocabulary: ["film", "fitment", "installation", "edges", "finish"] },
      { name: "Ceramic Coating", vocabulary: ["coating", "shine", "finish", "application", "appearance"] },
      { name: "Teflon Coating", vocabulary: ["coating", "finish", "appearance", "application"] },
      {
        name: "Deep Interior Cleaning",
        vocabulary: ["interior", "cleaning", "detailing", "cleanliness", "finish"],
      },
    ],
  },
  {
    name: "Car Modification",
    services: [
      {
        name: "Base-to-Top Car Modification",
        vocabulary: ["modification", "conversion", "fitment", "final look", "workmanship"],
      },
      {
        name: "Old-to-New Model Conversion",
        vocabulary: ["conversion", "body work", "fitment", "final look", "updated appearance"],
      },
    ],
  },
  {
    name: "Infotainment",
    services: [
      {
        name: "Infotainment Systems",
        vocabulary: ["screen", "installation", "setup", "audio", "system", "functionality"],
      },
    ],
  },
  {
    name: "Lighting",
    services: [
      {
        name: "Projector Headlamps",
        vocabulary: ["lighting", "fitment", "installation", "projector setup", "final appearance"],
      },
    ],
  },
  {
    name: "Wheels",
    services: [{ name: "Alloy Wheels", vocabulary: ["wheels", "fitment", "selection", "installation", "appearance"] }],
  },
];

const GENERIC: DefaultCategory[] = [
  {
    name: "Services",
    services: [{ name: "General Service", vocabulary: ["service", "quality", "staff", "experience"] }],
  },
];

const BY_CATEGORY: Record<string, DefaultCategory[]> = {
  "Automotive Services": AUTOMOTIVE,
  "Salon & Spa": [
    {
      name: "Hair",
      services: [
        { name: "Haircut", vocabulary: ["cut", "styling", "finish"] },
        { name: "Hair Colour", vocabulary: ["colour", "finish", "application"] },
      ],
    },
    {
      name: "Spa",
      services: [{ name: "Facial", vocabulary: ["treatment", "skin", "relaxing"] }],
    },
  ],
  "Restaurant & Cafe": [
    {
      name: "Dining",
      services: [
        { name: "Dine-in", vocabulary: ["food", "service", "ambiance"] },
        { name: "Takeaway", vocabulary: ["packaging", "speed", "food"] },
      ],
    },
  ],
  Healthcare: [
    {
      name: "Care",
      services: [{ name: "Consultation", vocabulary: ["advice", "staff", "wait time"] }],
    },
  ],
  Retail: [
    {
      name: "Store",
      services: [{ name: "In-store Purchase", vocabulary: ["selection", "staff", "pricing"] }],
    },
  ],
  "Home Services": [
    {
      name: "Jobs",
      services: [{ name: "Home Visit", vocabulary: ["workmanship", "punctuality", "finish"] }],
    },
  ],
  Education: [
    {
      name: "Learning",
      services: [{ name: "Class / Session", vocabulary: ["teaching", "clarity", "staff"] }],
    },
  ],
  Hospitality: [
    {
      name: "Stay",
      services: [{ name: "Room / Stay", vocabulary: ["cleanliness", "staff", "comfort"] }],
    },
  ],
  "Professional Services": GENERIC,
  Other: GENERIC,
};

export function defaultsForCategory(category: string): DefaultCategory[] {
  return BY_CATEGORY[category] ?? GENERIC;
}

export const EXPERIENCE_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "average", label: "Average" },
  { value: "not_good", label: "Not Good" },
] as const;

export type ExperienceValue = (typeof EXPERIENCE_OPTIONS)[number]["value"];

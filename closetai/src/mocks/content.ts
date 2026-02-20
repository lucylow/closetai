export const mockCaptions = {
  casual: {
    casual: "Chillin' in my favorite white tee and black jeans. Sometimes the simplest outfits hit the hardest. #OOTD #CasualStyle #Minimalist",
    party: "Ready to dance the night away in this floral dress! Twirl-worthy and photo-ready. #PartyTime #NightOut #FloralVibes",
    work: "Keeping it professional but comfortable. This blazer makes everything better. #WorkWear #SmartCasual #OfficeLook",
    date: "Feeling cute, might delete later. Perfect outfit for a dinner date. #DateNight #StyleInspo #GRWM",
  },
  funny: {
    casual: "Dressed like I have my life together (I don't). But at least the outfit works! #FashionFail #Winning #RealLife",
    party: "If the dress fits, wear it. If it doesn't, buy new clothes. That's my motto. #PartyMode #NoRegrets",
    work: "My work wardrobe: 90% black, 10% 'is this appropriate?' Spoiler: it never is. #OfficeLife #WorkProblems",
    date: "I dressed up for our date. The other person is my couch and a pizza box. #ForeverAlone #SelfDate #Style",
  },
  inspirational: {
    casual: "Style is a way to say who you are without having to speak. Today I'm saying effortlessly cool. #StyleInspo #BeYou #Confidence",
    party: "Shine like the star you are. Confidence is the best accessory — everything else is just bonus. #PartyVibes #SelfLove",
    work: "Dress for the job you want, not the job you have. Today I'm aiming for CEO. #CareerGoals #PowerDressing #BossEnergy",
    date: "Be your own kind of beautiful. This outfit is just the outer reflection of inner confidence. #InnerBeauty #DateNight",
  },
  professional: {
    casual: "A refined approach to casual wear. Thoughtful details elevate the everyday. #PolishedCasual #Elevated",
    party: "Elegance meets celebration. A sophisticated look for any gathering. #Chic #Sophisticated #PartyReady",
    work: "Excellence is not a skill, it's an attitude — and a well-tailored blazer. Dressed for success. #Professional #QuietLuxury",
    date: "Making a lasting impression with understated elegance. Less is always more. #Classy #TimelessStyle",
  },
};

export const generatedCaption: Record<string, string> = {
  casual: mockCaptions.casual.casual,
  funny: mockCaptions.funny.casual,
  inspirational: mockCaptions.inspirational.casual,
  professional: mockCaptions.professional.work,
};

export const mockHashtags = {
  default: ['#OOTD', '#Fashion', '#Style', '#LookOfTheDay', '#OutfitInspo', '#WhatIWore'],
  color: {
    black: ['#BlackOutfit', '#BlackIsAlwaysChic', '#AllBlackEverything', '#DarkAesthetic'],
    white: ['#WhiteOutfit', '#CleanLook', '#Minimalist', '#FreshFit'],
    blue: ['#BlueHues', '#DenimDay', '#BlueStyle', '#DenimOnDenim'],
    pink: ['#PinkLove', '#BarbieCore', '#Blush', '#PrettyInPink'],
    cream: ['#CreamTones', '#NeutralPalette', '#WarmTones', '#EarthyVibes'],
    brown: ['#BrownAesthetic', '#EarthTones', '#WarmAndCozy'],
    navy: ['#NavyBlue', '#ClassicNavy', '#Preppy', '#NauticalVibes'],
    beige: ['#BeigeAesthetic', '#NeutralTones', '#SandColor', '#DesertVibes'],
    red: ['#RedAlert', '#BoldRed', '#StatementPiece'],
    gray: ['#GrayTones', '#GreyAesthetic', '#Monochrome'],
  },
  category: {
    dress: ['#DressGoals', '#FloralDress', '#SummerDress', '#DressUp', '#OOTD_dress'],
    top: ['#Tops', '#Blouse', '#ShirtStyle', '#TopOfTheDay'],
    bottom: ['#Jeans', '#Pants', '#Bottoms', '#DenimStyle'],
    outerwear: ['#Jacket', '#CoatSeason', '#Layering', '#BlazerStyle', '#OuterwearGoals'],
    shoes: ['#Shoes', '#SneakerHead', '#Heels', '#FootwearFashion'],
    accessory: ['#Accessories', '#StatementPiece', '#JewelryLover', '#Sunglasses'],
  },
  style: {
    casual: ['#CasualStyle', '#EverydayWear', '#Comfy', '#EffortlessStyle'],
    formal: ['#FormalWear', '#SuitsAndTies', '#Elegant', '#BlackTie'],
    bohemian: ['#BohoStyle', '#FreeSpirit', '#BohoChic', '#Wanderlust'],
    edgy: ['#EdgyStyle', '#RockStyle', '#Alternative', '#LeatherVibes'],
    "smart casual": ['#SmartCasual', '#Polished', '#BusinessCasual', '#ModernStyle'],
    sporty: ['#Athleisure', '#SportyChic', '#FitAndFashion'],
  },
  trending: [
    '#SpringTrends2026',
    '#OversizedBlazer',
    '#SustainableFashion',
    '#QuietLuxury',
    '#DopamineDressing',
    '#CapsuleWardrobe',
    '#90sVibes',
    '#CoastalGrandmother',
  ],
};

export const suggestedHashtags = [
  '#OOTD',
  '#Fashion',
  '#StreetStyle',
  '#SustainableFashion',
  '#SpringTrends2026',
  '#QuietLuxury',
  '#CapsuleWardrobe',
  '#OversizedBlazer',
  '#DopamineDressing',
];

export const mockStyledImages = {
  casual: '/images/wardrobe/white-tee.jpg',
  party: '/images/wardrobe/floral-dress.jpg',
  work: '/images/wardrobe/navy-blazer.jpg',
  date: '/images/wardrobe/silk-blouse.jpg',
  default: '/images/wardrobe/leather-jacket.jpg',
};

export const styledImage = mockStyledImages.default;

export const mockTemplates = {
  instagram: {
    template: '{caption}\n\n{hashtags}',
    tips: ['Use 3-5 relevant hashtags for best reach', 'Post between 11am-1pm for peak engagement', 'Add location tags for 79% more engagement'],
  },
  tiktok: {
    template: '{caption} {hashtags}',
    tips: ['Keep captions short and punchy', 'Use trending sounds with outfit reveals', 'Show the transformation from casual to styled'],
  },
  pinterest: {
    template: '{caption}\n\nShop similar styles on ClosetAI\n\n{hashtags}',
    tips: ['Vertical images perform 50% better', 'Include brand names and specific item details', 'Use rich pins for product links'],
  },
  twitter: {
    template: '{caption} {hashtags}',
    tips: ['Keep under 280 characters', 'Thread outfit breakdowns for engagement', 'Tag brands for potential reposts'],
  },
};

export const mockContentApi = {
  generateCaption: async (outfitDescription: string, tone: string, occasion: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const toneData = mockCaptions[tone as keyof typeof mockCaptions] || mockCaptions.casual;
    const caption = toneData[occasion as keyof typeof toneData] || toneData.casual || 'Stylish and ready for anything! #OOTD';
    return { caption };
  },

  suggestHashtags: async (outfitAttributes: { color?: string; category?: string; style?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const tags: string[] = [];
    if (outfitAttributes?.color) {
      const colorTags = mockHashtags.color[outfitAttributes.color.toLowerCase() as keyof typeof mockHashtags.color];
      if (colorTags) tags.push(...colorTags.slice(0, 2));
    }
    if (outfitAttributes?.category) {
      const catTags = mockHashtags.category[outfitAttributes.category.toLowerCase() as keyof typeof mockHashtags.category];
      if (catTags) tags.push(...catTags.slice(0, 2));
    }
    if (outfitAttributes?.style) {
      const styleTags = mockHashtags.style[outfitAttributes.style.toLowerCase() as keyof typeof mockHashtags.style];
      if (styleTags) tags.push(...styleTags.slice(0, 2));
    }
    tags.push(...mockHashtags.trending.slice(0, 3));
    const unique = Array.from(new Set(tags));
    return { hashtags: unique.slice(0, 12) };
  },

  generateStyledImage: async (prompt: string, _style: string = 'photorealistic') => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    let imageKey: keyof typeof mockStyledImages = 'default';
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('party') || lowerPrompt.includes('floral')) imageKey = 'party';
    else if (lowerPrompt.includes('work') || lowerPrompt.includes('blazer') || lowerPrompt.includes('professional')) imageKey = 'work';
    else if (lowerPrompt.includes('date') || lowerPrompt.includes('silk') || lowerPrompt.includes('elegant')) imageKey = 'date';
    else if (lowerPrompt.includes('casual') || lowerPrompt.includes('tee') || lowerPrompt.includes('sneaker')) imageKey = 'casual';
    return { url: mockStyledImages[imageKey] || mockStyledImages.default };
  },
};

export const demoContentHistory = [
  {
    id: "post-001",
    platform: "instagram",
    caption: "Effortless weekend vibes in my go-to leather jacket and jeans combo. Style doesn't have to be complicated. #OOTD #WeekendStyle #LeatherJacket",
    hashtags: ['#OOTD', '#WeekendStyle', '#LeatherJacket', '#CasualCool', '#StreetStyle'],
    outfitItems: ["Leather Jacket", "Black Jeans", "White Sneakers"],
    engagement: { likes: 234, comments: 18, saves: 42 },
    postedAt: "2026-02-17T12:30:00Z",
    imageUrl: "/images/wardrobe/leather-jacket.jpg",
  },
  {
    id: "post-002",
    platform: "instagram",
    caption: "Garden party ready! This floral dress is giving main character energy. #FloralDress #SpringVibes #PartyReady",
    hashtags: ['#FloralDress', '#SpringVibes', '#PartyReady', '#BohemianStyle', '#OOTD'],
    outfitItems: ["Floral Dress", "Sunglasses"],
    engagement: { likes: 456, comments: 32, saves: 87 },
    postedAt: "2026-02-15T14:00:00Z",
    imageUrl: "/images/wardrobe/floral-dress.jpg",
  },
  {
    id: "post-003",
    platform: "tiktok",
    caption: "From bed to boardroom in 60 seconds. Watch this outfit transformation! #GRWM #WorkOutfit",
    hashtags: ['#GRWM', '#WorkOutfit', '#OfficeLook', '#QuietLuxury', '#StyleTransformation'],
    outfitItems: ["Navy Blazer", "Silk Blouse", "Khaki Chinos"],
    engagement: { likes: 1200, comments: 89, saves: 156 },
    postedAt: "2026-02-14T08:45:00Z",
    imageUrl: "/images/wardrobe/navy-blazer.jpg",
  },
];

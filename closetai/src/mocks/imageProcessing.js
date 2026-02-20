/**
 * Mock extracted attributes for different clothing types.
 * These mimic the output of the AI attribute extractor.
 */
export const mockAttributes = {
  'white-tee': {
    category: 'top',
    color: 'white',
    pattern: 'solid',
    style: 'casual',
    confidence: 0.98,
    detected: {
      hasSleeves: true,
      isKnit: false,
    },
  },
  'black-jeans': {
    category: 'bottom',
    color: 'black',
    pattern: 'solid',
    style: 'casual',
    confidence: 0.95,
    detected: {
      hasPockets: true,
      isDenim: true,
    },
  },
  'floral-dress': {
    category: 'dress',
    color: 'pink',
    pattern: 'floral',
    style: 'bohemian',
    confidence: 0.92,
    detected: {
      hasSleeves: false,
      length: 'midi',
    },
  },
  'leather-jacket': {
    category: 'outerwear',
    color: 'brown',
    pattern: 'solid',
    style: 'edgy',
    confidence: 0.96,
    detected: {
      hasZipper: true,
      material: 'leather',
    },
  },
  'sneakers': {
    category: 'shoes',
    color: 'white',
    pattern: 'solid',
    style: 'sporty',
    confidence: 0.97,
    detected: {
      type: 'sneaker',
      laceUp: true,
    },
  },
  'wool-scarf': {
    category: 'accessory',
    color: 'gray',
    pattern: 'plaid',
    style: 'casual',
    confidence: 0.88,
    detected: {
      material: 'wool',
    },
  },
  'navy-blazer': {
    category: 'outerwear',
    color: 'navy',
    pattern: 'solid',
    style: 'formal',
    confidence: 0.94,
    detected: {
      hasButtons: true,
      isTailored: true,
    },
  },
};

/**
 * Mock image URLs – original, background removed, and thumbnail.
 * In a real app, these would be stored on Linode Object Storage.
 */
export const mockImages = {
  original: {
    'white-tee': '/images/wardrobe/white-tee.jpg',
    'black-jeans': '/images/wardrobe/black-jeans.jpg',
    'floral-dress': '/images/wardrobe/floral-dress.jpg',
    'leather-jacket': '/images/wardrobe/leather-jacket.jpg',
    'sneakers': '/images/wardrobe/sneakers.jpg',
    'wool-scarf': '/images/wardrobe/wool-scarf.jpg',
    'navy-blazer': '/images/wardrobe/navy-blazer.jpg',
  },
  processed: {
    'white-tee': '/images/wardrobe/white-tee.jpg',
    'black-jeans': '/images/wardrobe/black-jeans.jpg',
    'floral-dress': '/images/wardrobe/floral-dress.jpg',
    'leather-jacket': '/images/wardrobe/leather-jacket.jpg',
    'sneakers': '/images/wardrobe/sneakers.jpg',
    'wool-scarf': '/images/wardrobe/wool-scarf.jpg',
    'navy-blazer': '/images/wardrobe/navy-blazer.jpg',
  },
  thumbnail: {
    'white-tee': '/images/wardrobe/white-tee.jpg',
    'black-jeans': '/images/wardrobe/black-jeans.jpg',
    'floral-dress': '/images/wardrobe/floral-dress.jpg',
    'leather-jacket': '/images/wardrobe/leather-jacket.jpg',
    'sneakers': '/images/wardrobe/sneakers.jpg',
    'wool-scarf': '/images/wardrobe/wool-scarf.jpg',
    'navy-blazer': '/images/wardrobe/navy-blazer.jpg',
  },
};

/**
 * Mock embedding vectors (512‑dim) for similarity search.
 * For demo, we generate random arrays and freeze them for consistency.
 */
const generateEmbedding = (seed) => {
  // Deterministic pseudo‑random based on seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // convert to 32-bit integer
  }
  const random = (i) => (Math.sin(hash * i) * 10000) % 1;
  return Array.from({ length: 512 }, (_, i) => random(i) * 2 - 1); // range [-1,1]
};

export const mockEmbeddings = {
  'white-tee': generateEmbedding('white-tee'),
  'black-jeans': generateEmbedding('black-jeans'),
  'floral-dress': generateEmbedding('floral-dress'),
  'leather-jacket': generateEmbedding('leather-jacket'),
  'sneakers': generateEmbedding('sneakers'),
  'wool-scarf': generateEmbedding('wool-scarf'),
  'navy-blazer': generateEmbedding('navy-blazer'),
};

/**
 * Mock processing result – combines attributes, image URLs, and embedding.
 */
export const mockProcessedItem = (itemKey) => {
  return {
    id: `item-${itemKey}-${Date.now()}`,
    imageUrl: mockImages.original[itemKey],
    processedImageUrl: mockImages.processed[itemKey],
    thumbnailUrl: mockImages.thumbnail[itemKey],
    attributes: mockAttributes[itemKey],
    embedding: mockEmbeddings[itemKey],
    status: 'success',
  };
};

/**
 * Simulate API calls for image upload and processing.
 */
export const mockImageProcessingApi = {
  /**
   * POST /api/wardrobe (or /api/upload)
   * Simulates uploading an image and receiving processed data.
   * @param {File} file - The uploaded file (ignored in mock)
   * @param {string} itemKey - Key to select mock data (e.g., 'white-tee')
   * @returns {Promise<Object>} Processed item data
   */
  uploadAndProcess: async (file, itemKey = 'white-tee') => {
    console.log('Mock uploadAndProcess called with file:', file, 'key:', itemKey);
    await new Promise(resolve => setTimeout(resolve, 2000)); // simulate 2s processing

    // Determine which mock data to return based on filename or provided key
    // For flexibility, you can also map from file.name to a key
    let key = itemKey;
    if (!key && file) {
      const fileName = file.name.toLowerCase();
      if (fileName.includes('white')) key = 'white-tee';
      else if (fileName.includes('black')) key = 'black-jeans';
      else if (fileName.includes('floral')) key = 'floral-dress';
      else if (fileName.includes('leather')) key = 'leather-jacket';
      else if (fileName.includes('sneaker')) key = 'sneakers';
      else if (fileName.includes('scarf')) key = 'wool-scarf';
      else if (fileName.includes('blazer')) key = 'navy-blazer';
      else key = 'white-tee'; // default
    }

    return mockProcessedItem(key);
  },

  /**
   * Simulate background removal only.
   * @param {File} file - Original image
   * @param {string} itemKey
   * @returns {Promise<Blob>} Processed image blob
   */
  removeBackground: async (file, itemKey = 'white-tee') => {
    console.log('Mock removeBackground called with:', file, itemKey);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const url = mockImages.processed[itemKey] || mockImages.processed['white-tee'];
    const response = await fetch(url);
    return response.blob();
  },

  /**
   * Simulate attribute extraction only.
   * @param {File} file - Original image
   * @param {string} itemKey
   * @returns {Promise<Object>} Extracted attributes
   */
  extractAttributes: async (file, itemKey = 'white-tee') => {
    console.log('Mock extractAttributes called with:', file, itemKey);
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockAttributes[itemKey] || mockAttributes['white-tee'];
  },

  /**
   * Simulate embedding generation.
   * @param {File} file - Original image
   * @param {string} itemKey
   * @returns {Promise<number[]>} Embedding vector
   */
  generateEmbedding: async (file, itemKey = 'white-tee') => {
    console.log('Mock generateEmbedding called with:', file, itemKey);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockEmbeddings[itemKey] || mockEmbeddings['white-tee'];
  },
};

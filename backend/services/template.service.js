/**
 * Social media posting templates with platform-specific character limits.
 */
const templates = {
  instagram: {
    name: 'Instagram',
    structure: '{caption}\n\n{hashtags}',
    characterLimit: 2200,
  },
  tiktok: {
    name: 'TikTok',
    structure: '{caption}\n\n{hashtags}',
    characterLimit: 150,
  },
  pinterest: {
    name: 'Pinterest',
    structure: '{caption}\n\n{hashtags}',
    characterLimit: 500,
  },
  twitter: {
    name: 'X (Twitter)',
    structure: '{caption}\n\n{hashtags}',
    characterLimit: 280,
  },
};

function getTemplate(platform) {
  return templates[platform] || templates.instagram;
}

/**
 * Apply caption and hashtags to a platform template.
 * @param {string} platform - 'instagram', 'tiktok', 'pinterest', 'twitter'
 * @param {string} caption
 * @param {string[]} hashtags
 * @returns {string} Formatted post
 */
function applyTemplate(platform, caption = '', hashtags = []) {
  const template = getTemplate(platform);
  const hashtagString = Array.isArray(hashtags) ? hashtags.join(' ') : String(hashtags);
  let post = template.structure
    .replace('{caption}', caption || '')
    .replace('{hashtags}', hashtagString);

  if (post.length > template.characterLimit) {
    post = post.substring(0, template.characterLimit - 3) + '...';
  }
  return post;
}

module.exports = {
  templates,
  getTemplate,
  applyTemplate,
};

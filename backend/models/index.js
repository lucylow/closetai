const User = require('./User');
const WardrobeItem = require('./WardrobeItem');
const Outfit = require('./Outfit');
const Rating = require('./Rating');
const Draft = require('./Draft');
const UserPreference = require('./UserPreference');

User.hasMany(WardrobeItem, { foreignKey: 'userId', as: 'wardrobe' });
WardrobeItem.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Outfit, { foreignKey: 'userId', as: 'outfits' });
Outfit.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Rating, { foreignKey: 'userId' });
Outfit.hasMany(Rating, { foreignKey: 'outfitId' });
Rating.belongsTo(User, { foreignKey: 'userId' });
Rating.belongsTo(Outfit, { foreignKey: 'outfitId' });

User.hasMany(Draft, { foreignKey: 'userId', as: 'drafts' });
Draft.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(UserPreference, { foreignKey: 'userId', as: 'preferences' });
UserPreference.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  WardrobeItem,
  Outfit,
  Rating,
  Draft,
  UserPreference,
};

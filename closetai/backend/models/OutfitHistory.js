const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutfitHistory = sequelize.define('OutfitHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  outfitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'outfits', key: 'id' },
  },
  wornDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  occasion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  weather: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'worn_date'] },
    { fields: ['outfit_id'] },
  ],
});

module.exports = OutfitHistory;

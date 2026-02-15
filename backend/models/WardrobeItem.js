const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WardrobeItem = sequelize.define('WardrobeItem', {
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
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  extractedAttributes: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  userTags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  wearCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastWornDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  embedding: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { using: 'gin', fields: ['user_tags'] },
    { using: 'gin', fields: ['extracted_attributes'] },
  ],
});

module.exports = WardrobeItem;

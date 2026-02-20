const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Outfit = sequelize.define('Outfit', {
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
  items: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
  },
  occasion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  weatherTags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  trendScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  userScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  underscored: true,
});

module.exports = Outfit;

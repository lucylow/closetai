const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Draft = sequelize.define(
  'Draft',
  {
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
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hashtags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'posted'),
      defaultValue: 'draft',
    },
  },
  { timestamps: true, underscored: true }
);

module.exports = Draft;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPreference = sequelize.define(
  'UserPreference',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
    },
    tourCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastTourStep: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  { timestamps: true, underscored: true }
);

module.exports = UserPreference;

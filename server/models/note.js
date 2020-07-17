'use strict';
const Sequelize = require('sequelize');
const shortId = require('shortid');

// permission types
var permissionTypes = ['public', 'share', 'private'];

module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    shortid: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      defaultValue: shortId.generate
    },
    view_permission: {
      type: DataTypes.ENUM,
      values: permissionTypes,
      defaultValue: 'private'
    },
    write_permission: {
      type: DataTypes.ENUM,
      values: permissionTypes,
      defaultValue: 'private'
    },
    viewcount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    title: {
      type: DataTypes.TEXT,
    },
    content: {
      type: DataTypes.TEXT('long'),
    },
    authorship: {
      type: DataTypes.TEXT('long'),
    },
    lastchangeAt: {
      type: DataTypes.DATE
    },
    savedAt: {
      type: DataTypes.DATE
    }
  });

  Note.associate = function (models) {
    Note.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner',
      constraints: false,
      onDelete: 'CASCADE',
      hooks: true
    });
    Note.belongsTo(models.User, {
      foreignKey: 'lastchangeuserId',
      as: 'lastchangeuser',
      constraints: false
    });
    Note.hasMany(models.Revision, {
      foreignKey: 'noteId',
      constraints: false
    });
    Note.hasMany(models.Author, {
      foreignKey: 'noteId',
      as: 'authors',
      constraints: false
    });
  };
  return Note;
};
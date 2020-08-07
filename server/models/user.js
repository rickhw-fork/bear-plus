'use strict';
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const { PWD_SALT_ROUND } = require('../config/config');
const shortId = require('shortid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    user_url: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      defaultValue: shortId.generate
    },
    profile_id: {
      type: DataTypes.STRING,
      unique: true
    },
    profile: {
      type: DataTypes.TEXT
    },
    access_token: {
      type: DataTypes.TEXT
    },
    refresh_token: {
      type: DataTypes.TEXT
    },
    delete_token: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    email: {
      type: Sequelize.TEXT,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: Sequelize.TEXT
    }
  }, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  });

  User.hashPassword = async function (plain) {
    return await bcrypt.hashSync(plain, PWD_SALT_ROUND);
  };

  User.prototype.verifyPassword = async function (attempt) {
    return await bcrypt.compareSync(attempt, this.password);
  };

  User.addHook('beforeCreate', async function (user) {
    // only do hash when password is presented
    if (user.password) {
      user.password = await User.hashPassword(user.password);
    }
  });

  User.addHook('beforeUpdate', async function (user) {
    if (user.changed('password')) {
      user.password = await User.hashPassword(user.password);
    }
  });

  User.associate = function (models) {
    User.hasMany(models.Note, {
      foreignKey: 'owner_id',
      constraints: false
    });
    User.hasMany(models.Note, {
      foreignKey: 'lastchange_user_id',
      constraints: false
    });
  };

  User.getProfile = function (user) {
    if (!user) {
      return null;
    }
    return user.profile_id ? User.parseProfile(user.profile) : User.parseProfileByEmail(user);
  };

  User.parseProfile = function (profile) {
    try {
      profile = JSON.parse(profile);
    } catch (err) {
      profile = null;
    }
    if (profile) {
      profile = {
        name: profile.displayName || profile.username,
        photo: User.parsePhotoByProfile(profile),
        biggerphoto: User.parsePhotoByProfile(profile, true)
      };
    }
    return profile;
  };

  User.parsePhotoByProfile = function (profile, bigger) {
    var photo = null;
    switch (profile.provider) {
      case 'facebook':
        photo = 'https://graph.facebook.com/' + profile.id + '/picture';
        if (bigger) photo += '?width=400';
        else photo += '?width=96';
        break;
      case 'google':
        photo = profile.photos[0].value;
        if (bigger) photo = photo.replace(/(\?sz=)\d*$/i, '$1400');
        else photo = photo.replace(/(\?sz=)\d*$/i, '$196');
        break;
      case 'updated':
        photo = profile.photo;
    }
    return photo;
  };

  User.parseProfileByEmail = function (user) {
    const profile = JSON.parse(user.profile);
    return {
      name: profile.username,
      photo: profile.photo || '/img/default-user-avatar.png', //generateAvatarURL('', email, false),
      biggerphoto: profile.photo || '/img/default-user-avatar.png', //generateAvatarURL('', email, true)
    };
  };
  return User;
};
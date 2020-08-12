'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const { NODE_ENV, PRODUCTION_DB_URL, DEVELOPMENT_DB_URL, TEST_DB_URL} = require('../config/config');
const db = {};

let sequelize;
switch (NODE_ENV) {
  case 'development':
    sequelize = new Sequelize(DEVELOPMENT_DB_URL);
    break;
  case 'production':
    sequelize = new Sequelize(PRODUCTION_DB_URL, { logging: false });
    break;
  case 'test':
    sequelize = new Sequelize(TEST_DB_URL, { logging: false });
    break;
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

import { Sequelize, DataTypes } from "sequelize";
import { DATABASE_HOST, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_USERNAME } from "../utils/constants";

export const database = new Sequelize(DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD, {
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  dialect: 'mariadb',
  pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
  },
  logging: false
});

// The subscriptions to log events for
export const SubscribedSubscriptions = database.define('SubscribedSubscriptions', {
  id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
  },
  subscription: {
      type: DataTypes.CHAR(24),
      allowNull: false
  },
  userId: {
      type: DataTypes.CHAR(19),
      allowNull: false
  },
  alertAtCount: {
      type: DataTypes.INTEGER,
      allowNull: false
  }
}, {
  indexes: [
      {
          unique: true,
          fields: ['subscription', 'userId', 'alertAtCount']
      }
  ]
});

export const Plays = database.define('Plays', {
  subscription: {
      type: DataTypes.CHAR(24),
      allowNull: false,
      primaryKey: true
  },
  name: {
      type: DataTypes.CHAR(255),
      allowNull: false
  },
  lastWinPlayCount: {
      type: DataTypes.INTEGER,
  },
  plays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
  }
});

export const History = database.define('History', {
  subscription: {
      type: DataTypes.CHAR(24),
      allowNull: false
  },
  winCount: {
      type: DataTypes.INTEGER,
      allowNull: false
  }
});

export async function init() {
  await SubscribedSubscriptions.sync();
  await Plays.sync();
  await History.sync();
}
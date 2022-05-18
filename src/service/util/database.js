const { database } = require('../../../config.json');
const { Sequelize, DataTypes } = require('sequelize');

console.log(database);

const db = new Sequelize(database.name, database.username, database.password, {
    host: database.host,
    port: database.port,
    dialect: 'mariadb',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

db.authenticate().then(() => console.log('not broken'));

// The subscriptions to log events for
const SubscribedSubscriptions = db.define('SubscribedSubscriptions', {
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
    guildId: {
        type: DataTypes.CHAR(19),
        allowNull: false
    },
    channelId: {
        type: DataTypes.CHAR(19),
        allowNull: false
    },
    token: {
        type: DataTypes.CHAR(255),
        allowNull: false
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['subscription', 'guildId']
        }
    ]
});

const Plays = db.define('Plays', {
    subscription: {
        type: DataTypes.CHAR(24),
        allowNull: false,
        primaryKey: true
    },
    lastWinPlayCount: {
        type: DataTypes.INTEGER
    },
    plays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = {
    SubscribedSubscriptions,
    Plays
};
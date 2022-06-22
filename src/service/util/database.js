const { database } = require('../../../config.json');
const { Sequelize, DataTypes } = require('sequelize');

const db = new Sequelize(database.name, database.username, database.password, {
    host: database.host,
    port: database.port,
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

const Plays = db.define('Plays', {
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

const History = db.define('History', {
    subscription: {
        type: DataTypes.CHAR(24),
        allowNull: false
    },
    winCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});


module.exports = {
    SubscribedSubscriptions,
    Plays,
    History,
    init: async () => {
        await SubscribedSubscriptions.sync();
        await Plays.sync();
        await History.sync();
    }
};
const { Plays, SubscribedSubscriptions, History, init : initDatabase } = require('./util/database');

class NotificationService {

    setClient(client) {
        this._client = client;
    }

    setAPI(api) {
        this._api = api;
    }

    async init() {
        await initDatabase();
    }

    async registerPlay(id) {
        let row = await Plays.findOne({
            where: {
                subscription: id
            }
        });
        if (!row) {
            // New machine! Fetch the name.
            let nameData = (await this._api.getName(id))[0];
            if (!nameData) {
                nameData = {
                    name: 'UNKNOWN MACHINE NAME - CONTACT DEVELOPER'
                };
                console.error(`FAILED TO FIND MACHINE NAME FOR ${id}`);
            }

            const { name } = nameData;
            row = await Plays.create({
                name,
                subscription: id,
                plays: 0
            });
        }

        const currentPlayCount = row.plays + 1;

        await Plays.update({
            plays: currentPlayCount
        }, {
            where: {
                subscription: id
            }
        });

        const notifySubscriptionListeners = await this._getSubscriptionsWithAlertCountAt(id, currentPlayCount);
        for (const subscription of notifySubscriptionListeners) {
            const user = await this._client.users.fetch(subscription.userId);
            await user.send(`\`${id}\` (**${row.name}**) is at ${currentPlayCount} plays!\nThe last winning play count was at ${row.lastWinPlayCount} plays!\n<https://tokyocatch.com/game/${id}>`);
        }
    }

    async getPlayCount(id) {
        const row = await Plays.findOne({
            where: {
                subscription: id
            }
        });

        if (!row) {
            return 0;
        }

        return row.plays;
    }

    async getLastWinCount(id) {
        const row = await Plays.findOne({
            where: {
                subscription: id
            }
        });

        if (!row) {
            return 0;
        }

        return row.lastWinPlayCount;
    }

    async registerWin(id) {
        const winningPlayCount = await this.getPlayCount(id);

        if (winningPlayCount > 0) {
            const [oldRecord] = await Plays.findOrCreate({
                where: {
                    subscription: id
                }
            });
    
            await Plays.update({
                plays: 0,
                lastWinPlayCount: winningPlayCount
            }, {
                where: {
                    subscription: id
                }
            });

            await History.create({
                subscription: id,
                winCount: winningPlayCount
            });

            const winningSubscriptionListeners = await this._getSubscriptionsWithAlertCountAt(id, -1);
            for (const subscription of winningSubscriptionListeners) {
                const user = await this._client.users.fetch(subscription.userId);
                await user.send(`\`${id}\` (**${oldRecord.name}**) was won at ${winningPlayCount} plays just now! (the previous play count was ${oldRecord.lastWinPlayCount} plays)\n<https://tokyocatch.com/game/${id}>`);
            }
        }
    }

    async registerSubscription(userId, machineId, alertCount) {
        await SubscribedSubscriptions.findOrCreate({
            where: {
                userId,
                subscription: machineId,
                alertAtCount: alertCount
            }
        });
    }

    async unregisterSubscription(userId, machineId) {
        return (await SubscribedSubscriptions.destroy({
            where: {
                userId,
                subscription: machineId
            }
        })) > 0;
    }

    async unregisterAllSubscriptions(userId) {
        return (await SubscribedSubscriptions.destroy({
            where: {
                userId
            }
        })) > 0;
    }

    async getPreviousWins(machineId) {
        return (await History.findAll({
            where: {
                subscription: machineId
            }
        })).map(row => row.winCount);
    }

    async _getSubscriptionsWithAlertCountAt(machineId, count) {
        return (await SubscribedSubscriptions.findAll({
            where: {
                subscription: machineId,
                alertAtCount: count
            }
        }));
    }
}

module.exports = {
    NotificationService
};
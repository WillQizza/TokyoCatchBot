const { Client, Intents } = require('discord.js');

class DiscordClient extends Client {

    constructor(options = {}) {
        super(Object.assign({
            intents: Intents.FLAGS.GUILDS
        }, options));

        this._init();
    }

    _init() {
        this.on('ready', () => {
            console.log(`${this.user.tag} is online.`);
        });
    }

}

module.exports = {
    DiscordClient
};
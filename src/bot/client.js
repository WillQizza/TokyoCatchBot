const { Client, Intents } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

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

            this.guilds.cache.forEach(guild => guild.commands.create(new SlashCommandBuilder()
                .setDefaultPermission(true)
                .setName('plays')
                .setDescription('See how many plays a machine has!')
                .addStringOption(option => option.setName('machine_id')
                    .setDescription('id of the machine found in the url!')
                    .setRequired(true))));

            this.guilds.cache.forEach(guild => guild.commands.create(new SlashCommandBuilder()
                .setDefaultPermission(true)
                .setName('subscribe')
                .setDescription('Subscribe to notifications for a specific machine!')
                .addStringOption(option => option.setName('machine_id')
                    .setDescription('id of the machine found in the url!')
                    .setRequired(true))
                .addIntegerOption(option => option.setName('alert_at_count')
                    .setDescription('If the bot should notify you at a specific count')
                    .setRequired(false))));

            this.guilds.cache.forEach(guild => guild.commands.create(new SlashCommandBuilder()
                .setDefaultPermission(true)
                .setName('unsubscribe')
                .setDescription('Unsubscribe from notifications for a specific machine!')
                .addStringOption(option => option.setName('machine_id')
                    .setDescription('id of the machine found in the url!')
                    .setRequired(true))));

            this.guilds.cache.forEach(guild => guild.commands.create(new SlashCommandBuilder()
                .setDefaultPermission(true)
                .setName('unsubscribe-all')
                .setDescription('Unsubscribe from all machines!')));

            this.guilds.cache.forEach(guild => guild.commands.create(new SlashCommandBuilder()
                .setDefaultPermission(true)
                .setName('history')
                .setDescription('View the win history of a machine!')
                .addStringOption(option => option.setName('machine_id')
                    .setDescription('id of the machine found in the url!')
                    .setRequired(true))));
        });
        this.on('error', console.error);
    }

}

module.exports = {
    DiscordClient
};
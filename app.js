const { NotificationService } = require('./src/service/notifications');
const { DiscordClient } = require('./src/bot/client');
const { APIClient } = require('./src/api/client');

const { bot : { token : BOT_TOKEN } } = require('./config.json');

const service = new NotificationService();

service.init().then(() => {
    const apiClient = new APIClient();

    apiClient.setEventHandler(async event => {
        try {
            switch (event.getStatus()) {
                case 'playing':
                    await service.registerPlay(event.getId());
                    break;
                case 'get':
                    console.log('WIN ON ' + event.getId());
                    await service.registerWin(event.getId());
                    break;
            }
        } catch (error) {
            console.error(error);
        }
    });

    apiClient.connect().then(() => {
        apiClient.subscribe('60b478068bb64fdf72cfec73').then(subscription => console.log(subscription))
            .catch(console.error);
    });
});

const discordClient = new DiscordClient();

discordClient.on('interactionCreate', async interaction => {
    if (interaction.isCommand) {
        const machineId = (interaction.options.getString('machine_id') || '').trim();
        const plays = await service.getPlayCount(machineId);
        
        switch (interaction.commandName) {
            case 'plays':
                const lastWinCount = await service.getLastWinCount(machineId);

                if (lastWinCount > 0) {
                    await interaction.reply({
                        content: `The provided machine \`${machineId}\` is at ${plays} plays.\nThe last win was at ${lastWinCount} plays.`,
                    });
                } else {
                    await interaction.reply({
                        content: `The provided machine \`${machineId}\` is at ${plays} plays.`,
                    });
                }
                break;
            case 'subscribe':
                const alertAtCount = interaction.options.getInteger('alert_at_count') || -1;
                await service.registerSubscription(interaction.user.id, machineId, alertAtCount);

                if (alertAtCount === -1) {
                    await interaction.reply({
                        content: `You will be DMed when this machine (\`${machineId}\`) wins!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `You will be DMed when this machine (\`${machineId}\`) hits ${alertAtCount} plays!`,
                        ephemeral: true
                    });
                }
                break;
            case 'unsubscribe':
                const unsubscriptionStatus = await service.unregisterSubscription(interaction.user.id, machineId);

                if (unsubscriptionStatus) {
                    await interaction.reply({
                        content: `You will no longer be DMed for the machine \`${machineId}\`.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `You were never subscribed to \`${machineId}\`.`,
                        ephemeral: true
                    });
                }
                break;
            case 'unsubscribe-all':
                await service.unregisterAllSubscriptions(interaction.user.id);
                await interaction.reply({
                    content: `You are now unsubscribed from ALL machines.`,
                    ephemeral: true
                });
                break;
        }
    }
});

service.setClient(discordClient);
discordClient.login(BOT_TOKEN);
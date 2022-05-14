const { DiscordClient } = require('./src/bot/client');
const { APIClient } = require('./src/api/client');

const { bot : { token : BOT_TOKEN } } = require('./config.json');

const apiClient = new APIClient();

apiClient.setEventHandler(event => {
    console.log(event);
});

// apiClient.connect().then(() => {
//     apiClient.subscribe('60b478068bb64fdf72cfec73').then(subscription => console.log(subscription))
//         .catch(console.error);
// });

const discordClient = new DiscordClient();
// discordClient.login(BOT_TOKEN);
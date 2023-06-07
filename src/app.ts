import { IntentsBitField, Partials } from "discord.js";

import { PlaysService, SubscriptionService } from "./service/plays/index";
import { DiscordClient } from "./bot/index";
import { APIMachineEvent, APIService } from "./service/api/index";
import { init } from "./database/index";
import { BOT_TOKEN } from "./utils/constants";

// Load database before any services
init().then(async () => {
  const playService = new PlaysService();
  const subscriptionService = new SubscriptionService();
  const apiService = new APIService();

  // Call the play service on api events
  apiService.on("change", async (event: APIMachineEvent) => {
    try {
      switch (event.status) {
        case "playing":
          await playService.registerPlay(event.machine);
          break;
        case "get":
          const time = new Date();
          console.log(`${event.machine.id} won! ${time.getHours()}:${time.getMinutes()}`);
          
          await playService.registerWin(event.machine);
          break;
      }
    } catch (error) {
      console.error(error);
    }
  });

  const discordClient = new DiscordClient({
    services: {
      plays: playService,
      subscriptions: subscriptionService,
      api: apiService
    },
    partials: [
      Partials.User,
      Partials.Channel
    ],
    intents: [ IntentsBitField.Flags.Guilds, IntentsBitField.Flags.DirectMessages ]
  });

  await apiService.connect();
  await discordClient.login(BOT_TOKEN);
  console.log(`${discordClient.user.tag} is up and running!`);
});
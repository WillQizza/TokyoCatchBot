import { ClientOptions, CommandInteraction } from "discord.js";
import { APIService } from "../service/api";
import { PlaysService, SubscriptionService } from "../service/plays";
import { DiscordClient } from "./client";


export type CraneClientOptions = ClientOptions & {
  services: CraneServices
};

export type CraneServices = {
  plays: PlaysService,
  subscriptions: SubscriptionService,
  api: APIService
};

export type CraneCommandInteraction = CommandInteraction & {
  client: DiscordClient
};
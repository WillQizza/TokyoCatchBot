import { SlashCommandBuilder } from "discord.js";
import { CraneCommandInteraction } from "../types";
import { Command } from "./command";

const UNSUBSCRIBE_SUCCESS = `You are no longer subscribed to ANY machines!`;

class UnsubscribeAllCommand extends Command {

  constructor() {
    super(new SlashCommandBuilder()
      .setName("unsubscribe-all")
      .setDescription("Unsubscribe from notifications for ALL machines!")
      .toJSON());
  }

  async execute(interaction: CraneCommandInteraction) {
    await interaction.client.services.subscriptions.getUserSubscriptions(interaction.user.id);
    await interaction.reply({
      content: UNSUBSCRIBE_SUCCESS,
      ephemeral: true
    });
  }

}

export default new UnsubscribeAllCommand();
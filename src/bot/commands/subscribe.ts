import { SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption } from "discord.js";
import { CraneCommandInteraction } from "../types";
import { Command } from "./command";

const INVALID_MACHINE = `\`{{ID}}\` is not a valid machine id.`;
const DM_ON_WIN = `You will be DMed when **{{NAME}}** wins! (\`{{ID}}\` - {{TYPE}})`;
const DM_ON_COUNT = `You will be DMed when **{{NAME}}** hits {{ALERT_AT_COUNT}} plays! (\`{{ID}}\` - {{TYPE}})`;

class SubscribeCommand extends Command {

  constructor() {
    super(new SlashCommandBuilder()
      .setName("subscribe")
      .setDescription("Subscribe to notifications for a specific machine!")
      .addStringOption(new SlashCommandStringOption()
        .setName("machine_id")
        .setDescription("id of the machine found in the url!")
        .setRequired(true))
      .addIntegerOption(new SlashCommandIntegerOption()
        .setName("alert_at_count")
        .setDescription("If the bot should notify you at a specific count! (not specifying a value alerts you on win)")
        .setRequired(false))
      .toJSON());
  }

  async execute(interaction: CraneCommandInteraction) {
    const machineId = (interaction.options.get("machine_id").value as string).trim();
    const machine = await interaction.client.services.api.getMachine(machineId);

    if (!machine) {
      return interaction.reply({
        content: INVALID_MACHINE
          .replace(/{{ID}}/g, machineId),
        ephemeral: true
      });
    }

    const alertAtCount = interaction.options.get("alert_at_count") ? interaction.options.get("alert_at_count").value as number : -1;
    await interaction.client.services.subscriptions.registerSubscription({
      machine,
      alertAtCount,
      user: interaction.user.id
    });

    if (alertAtCount === -1) {
      await interaction.reply({
          content: DM_ON_WIN
            .replace(/{{NAME}}/g, machine.name)
            .replace(/{{ID}}/g, machine.id)
            .replace(/{{TYPE}}/g, machine.type),
          ephemeral: true
      });
    } else {
        await interaction.reply({
            content: DM_ON_COUNT
              .replace(/{{NAME}}/g, machine.name)
              .replace(/{{ID}}/g, machine.id)
              .replace(/{{TYPE}}/g, machine.type)
              .replace(/{{ALERT_AT_COUNT}}/g, alertAtCount.toString()),
            ephemeral: true
        });
    }
  }

}

export default new SubscribeCommand();
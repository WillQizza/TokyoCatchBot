import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { CraneCommandInteraction } from "../types.js";
import { Command } from "./command.js";

const INVALID_MACHINE = `\`{{ID}}\` is not a valid machine id.`;
const UNSUBSCRIBE_SUCCESS = `You are no longer subscribed to **{{NAME}}** (\`{{ID}}\`)`;
const UNSUBSCRIBE_FAILED = `You were not subscribed to **{{NAME}}** (\`{{ID}}\`)`;

class UnsubscribeCommand extends Command {

  constructor() {
    super(new SlashCommandBuilder()
      .setName("unsubscribe")
      .setDescription("Unsubscribe from notifications for a specific machine!")
      .addStringOption(new SlashCommandStringOption()
        .setName("machine_id")
        .setDescription("id of the machine found in the url!")
        .setRequired(true))
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

    const unsubscribed = await interaction.client.services.subscriptions.unregisterSubscription({
      machine,
      user: interaction.user.id
    });

    if (unsubscribed) {
      await interaction.reply({
        content: UNSUBSCRIBE_SUCCESS
          .replace(/{{NAME}}/g, machine.name)
          .replace(/{{ID}}/g, machine.id)
          .replace(/{{TYPE}}/g, machine.type),
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: UNSUBSCRIBE_FAILED
          .replace(/{{NAME}}/g, machine.name)
          .replace(/{{ID}}/g, machine.id)
          .replace(/{{TYPE}}/g, machine.type),
        ephemeral: true
      });
    }
  }

}

export default new UnsubscribeCommand();
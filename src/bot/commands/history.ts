import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { CraneCommandInteraction } from "../types";
import { Command } from "./command";

const INVALID_MACHINE = `\`{{ID}}\` is not a valid machine id.`;
const HISTORY_MESSAGE = `**{{NAME}}** (\`{{ID}}\`)
======
{{HISTORY}}

The machine is currently at {{PLAYS}} plays.`;

class HistoryCommand extends Command {

  constructor() {
    super(new SlashCommandBuilder()
      .setName("history")
      .setDescription("View the win history of a machine!")
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

    const history = (await interaction.client.services.plays.getPreviousWins(machine))
      .slice(0, 20);

    const currentPlays = await interaction.client.services.plays.getPlayCount(machine);

    await interaction.reply({
      content: HISTORY_MESSAGE
        .replace(/{{NAME}}/g, machine.name)
        .replace(/{{ID}}/g, machine.id)
        .replace(/{{TYPE}}/g, machine.type)
        .replace(/{{HISTORY}}/g, history.reverse().map(data => `${data.plays} plays (<t:${data.unixTimestamp}:R>)`).join("\n"))
        .replace(/{{PLAYS}}/g, currentPlays.toString()),
      ephemeral: true
    });
  }

}

export default new HistoryCommand();
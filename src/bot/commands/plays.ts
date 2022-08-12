import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { CraneCommandInteraction } from "../types.js";
import { Command } from "./command.js";

const INVALID_MACHINE = `\`{{ID}}\` is not a valid machine id.`;
const PLAY_MESSAGE = `**{{NAME}}** is at {{PLAYS}} plays. (\`{{ID}}\` - {{TYPE}})`;
const PLAY_MESSAGE_WITH_LAST_WIN_COUNT = `${PLAY_MESSAGE}
The last win was at {{LAST_WIN_COUNT}} plays.`;

class PlaysCommand extends Command {

  constructor() {
    super(new SlashCommandBuilder()
      .setName("plays")
      .setDescription("See how many plays a machine has!")
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
    
    const plays = await interaction.client
      .services.plays.getPlayCount(machine);
    const lastWinCount = await interaction.client
      .services.plays.getLastWinCount(machine);

    if (lastWinCount > 0) {
        await interaction.reply({
            content: PLAY_MESSAGE_WITH_LAST_WIN_COUNT
              .replace(/{{ID}}/g, machine.id)
              .replace(/{{NAME}}/g, machine.name)
              .replace(/{{PLAYS}}/g, plays.toString())
              .replace(/{{TYPE}}/g, machine.type)
              .replace(/{{LAST_WIN_COUNT}}/g, lastWinCount.toString())
        });
    } else {
        await interaction.reply({
            content: PLAY_MESSAGE
              .replace(/{{ID}}/g, machine.id)
              .replace(/{{NAME}}/g, machine.name)
              .replace(/{{PLAYS}}/g, plays.toString())
              .replace(/{{TYPE}}/g, machine.type)
        });
    }
  }

}

export default new PlaysCommand();
import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { findMedianWithoutOutliers } from "../../utils/findMedianWithoutOutliers.js";
import { CraneCommandInteraction } from "../types.js";
import { Command } from "./command.js";

const INVALID_MACHINE = `\`{{ID}}\` is not a valid machine id.`;
const GUESS_MESSAGE = `**{{NAME}}** is predicted to win around {{GUESS}} plays. (\`{{ID}}\` - {{TYPE}})`;
const TOO_EARLY_MESSAGE = `It's too early to make a guess for **{{NAME}}** (\`{{ID}}\` - {{TYPE}})`;
const NOT_THREE_PRONG_MESSAGE = `**{{NAME}}** is not a three prong machine! (\`{{ID}}\` - {{TYPE}})`;

class GuessWinCommand extends Command {

  constructor() {
    super(new SlashCommandBuilder()
      .setName("guesswin")
      .setDescription("Guess when a machine will win!")
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

    if (machine.type !== "THREE_CLAW") {
      return interaction.reply({
        content: NOT_THREE_PRONG_MESSAGE
          .replace(/{{NAME}}/g, machine.name)
          .replace(/{{ID}}/g, machine.id)
          .replace(/{{TYPE}}/g, machine.type),
        ephemeral: true
      });
    }
    
    const wins = await interaction.client.services.plays.getPreviousWins(machine);
    if (wins.length < 10) {
      return interaction.reply({
        content: TOO_EARLY_MESSAGE
          .replace(/{{NAME}}/g, machine.name)
          .replace(/{{ID}}/g, machine.id)
          .replace(/{{TYPE}}/g, machine.type),
        ephemeral: true
      });
    }

    await interaction.reply({
      content: GUESS_MESSAGE
        .replace(/{{NAME}}/g, machine.name)
        .replace(/{{ID}}/g, machine.id)
        .replace(/{{TYPE}}/g, machine.type)
        .replace(/{{GUESS}}/g, findMedianWithoutOutliers(wins).toString())
    });
  }

}

export default new GuessWinCommand();
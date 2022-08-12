import { SlashCommandBuilder } from "discord.js";
import { database } from "../../database/index.js";
import { MachineInformation } from "../../service/api/types.js";
import { CLOSE_ENOUGH_TO_WIN_COUNT, MIN_WIN_GUESS_COUNT } from "../../utils/constants.js";
import { findMedianWithoutOutliers } from "../../utils/findMedianWithoutOutliers.js";
import { CraneCommandInteraction } from "../types.js";
import { Command } from "./command.js";

const HOLD_MESSAGE = `Please hold... this might take a bit!`;
const RESULT_MESSAGE = `These three prong machines are close to winning!
=====
{{MACHINES}}`;
const MACHINE_ROW_MESSAGE = `**{{NAME}}** [{{PLAYS}} plays] [projected to win at {{GUESS}} plays] <https://tokyocatch.com/game/{{ID}}>`;

const GET_HISTORY_OF_MACHINES_OVER_MIN_COUNT = `SELECT subscription machineId, winCount FROM Histories HAVING (COUNT((SELECT subscription FROM histories WHERE machineId = histories.subscription))) > ${MIN_WIN_GUESS_COUNT}`;


class WinListCommand extends Command {

  constructor() {
    super(new SlashCommandBuilder()
      .setName("winlist")
      .setDescription("List all machines that might be close to winning!")
      .toJSON());
  }

  async execute(interaction: CraneCommandInteraction) {
    await interaction.reply({
      content: HOLD_MESSAGE
    });

    const [results] = (await database.query(GET_HISTORY_OF_MACHINES_OVER_MIN_COUNT)) as any[];
    
    const machines = {};
    for (const row of results) {
      const machine = await interaction.client.services.api.getMachine(row.machineId);
      if (machine.type !== "THREE_CLAW") {
        continue;
      }

      if (!machines[row.machineId]) {
        machines[row.machineId] = [];
      }
      machines[row.machineId].push(row.winCount);
    }

    const machinesThatMightWin: { machine: MachineInformation, guess: number, currentPlayCount: number }[] = [];
    for (const machineId in machines) {
      const machine = await interaction.client.services.api.getMachine(machineId);
      const wins = machines[machineId];

      const guess = findMedianWithoutOutliers(wins);
      const currentPlayCount = await interaction.client.services.plays.getPlayCount(machine);

      const isCloseToGuess = Math.abs(guess - currentPlayCount) <= CLOSE_ENOUGH_TO_WIN_COUNT || guess < currentPlayCount;
      if (isCloseToGuess) {
        machinesThatMightWin.push({
          machine,
          guess,
          currentPlayCount
        });
      }
    }

    await interaction.editReply({
      content: RESULT_MESSAGE
        .replace(/{{MACHINES}}/g, machinesThatMightWin.slice(0, 40).map(data => 
          MACHINE_ROW_MESSAGE
            .replace(/{{NAME}}/g, data.machine.name)
            .replace(/{{ID}}/g, data.machine.id)
            .replace(/{{PLAYS}}/g, data.currentPlayCount.toString())
            .replace(/{{GUESS}}/g, data.guess.toString())
          ).join("\n")
        )
    });
  }

}

export default new WinListCommand();
import { SlashCommandBuilder } from "discord.js";
import { database } from "../../database/index";
import { MachineInformation } from "../../service/api/types";
import { CLOSE_ENOUGH_TO_WIN_COUNT, MIN_WIN_GUESS_COUNT } from "../../utils/constants";
import { findMedianWithoutOutliers } from "../../utils/findMedianWithoutOutliers";
import { CraneCommandInteraction } from "../types";
import { Command } from "./command";

const HOLD_MESSAGE = `Please hold... this might take a bit!`;
const HEADER_RESULT_MESSAGE = `These three prong machines are close to winning!
=====`;
const MACHINE_ROW_MESSAGE = `**{{NAME}}** [{{PLAYS}} plays] [projected to win at {{GUESS}} plays] <https://tokyocatch.com/game/{{ID}}>`;

const GET_HISTORY_OF_MACHINES_OVER_MIN_COUNT = `SELECT subscription machineId, winCount FROM Histories WHERE subscription IN (SELECT subscription FROM Histories GROUP BY subscription HAVING COUNT(*) >= ${MIN_WIN_GUESS_COUNT});`;

const MACHINES_PER_MESSAGE = 10;

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
      content: HEADER_RESULT_MESSAGE
    });

    for (let i = 0; i < Math.ceil(machinesThatMightWin.length / MACHINES_PER_MESSAGE); i++) {
      const machines = machinesThatMightWin.slice(i * MACHINES_PER_MESSAGE, i * MACHINES_PER_MESSAGE + MACHINES_PER_MESSAGE);
      
      await interaction.channel.send(machines.map(data => 
        MACHINE_ROW_MESSAGE
          .replace(/{{NAME}}/g, data.machine.name)
          .replace(/{{ID}}/g, data.machine.id)
          .replace(/{{PLAYS}}/g, data.currentPlayCount.toString())
          .replace(/{{GUESS}}/g, data.guess.toString())
        ).join("\n"));
    }
  }

}

export default new WinListCommand();
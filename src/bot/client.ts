import fs from "fs";
import path from "path";
import { Client, Interaction, InteractionType } from "discord.js";
import { MachinePlayData } from "../service/plays/index.js";
import { CraneClientOptions, CraneCommandInteraction, CraneServices } from "./types.js";
import { Command } from "./commands/command.js";

const ON_PLAY_MESSAGE = `"{{NAME}}" (\`{{ID}}\`) is at {{PLAY_COUNT}} plays!
The last winning play was at {{LAST_WINNING_PLAY}} plays!
<https://tokyocatch.com/game/{{ID}}>`;

const ON_WIN_MESSAGE = `"{{NAME}}" (\`{{ID}}\`) was won at {{PLAYS}} plays just now!
The last winning play was at {{LAST_WINNING_PLAY}} plays`;

// Checks if two JSON objects are the same
function isEqual(a: Object, b: Object) {
  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    for (let i = 0; i < keysA.length; i++) {
      if (!isEqual(a[keysA[i]], b[keysB[i]]) || (keysA[i] !== keysB[i])) {
        return false;
      }
    }

    return true;
  } else {
    return a === b;
  }
}

export class DiscordClient extends Client {

  readonly services: CraneServices;
  readonly commands: Map<string, Command>;

  constructor(options: CraneClientOptions) {
    super(options);
    this.services = options.services;
    this.commands = new Map();

    this.on("error", console.error);
    this.on("ready", async () => {
      this.services.plays.on("play", play => this.onPlay(play));
      this.services.plays.on("win", win => this.onWin(win));

      // Load commands
      const commandModules = await Promise.all(fs.readdirSync(path.join(__dirname, "commands"))
        .filter(commandFileName => commandFileName !== "command.js")  // filter out command.ts
        .map(commandFileName => import(path.join(__dirname, "commands", commandFileName))));

      for (const commandModule of commandModules) {
        const commandDefinition = commandModule.default as Command;
        this.commands.set(commandDefinition.json.name, commandDefinition);

        await this.application.commands.create(commandDefinition.json);
      }
    });

    this.on("interactionCreate", this.onInteraction);
  }

  private async onPlay(machineInformation: MachinePlayData) {
    const userIds = await this.services.subscriptions.getUsersSubscribedToMachineWithAlertCount(machineInformation, machineInformation.playCount);
    for (const userId of userIds) {
      try {
        const user = await this.users.fetch(userId);
        await user.send(ON_PLAY_MESSAGE
          .replace(/{{NAME}}/g, machineInformation.name)
          .replace(/{{ID}}/g, machineInformation.id)
          .replace(/{{LAST_WINNING_PLAY}}/g, (machineInformation.lastWinCount || "N/A").toString()));
      } catch (error) {
        console.error(error);
      }
    }
  }

  private async onWin(machineInformation: MachinePlayData) {
    const userIds = await this.services.subscriptions.getUsersSubscribedToMachineWithAlertCount(machineInformation, -1);
    for (const userId of userIds) {
      try {
        const user = await this.users.fetch(userId);
        await user.send(ON_WIN_MESSAGE
          .replace(/{{NAME}}/g, machineInformation.name)
          .replace(/{{ID}}/g, machineInformation.id)
          .replace(/{{LAST_WINNING_PLAY}}/g, (machineInformation.lastWinCount || "N/A").toString()));
      } catch (error) {
        console.error(error);
      }
    }
  }

  private async onInteraction(interaction: Interaction) {
    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = this.commands.get(interaction.commandName);
      
      try {
        await command.execute(interaction as CraneCommandInteraction);
      } catch (error) {
        console.error(`An error occurred while running ${interaction.commandName}`, error);
      }
    }
  }

}
import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { CraneCommandInteraction } from "../types";

export abstract class Command {
  
  readonly json: RESTPostAPIApplicationCommandsJSONBody;

  constructor(json: RESTPostAPIApplicationCommandsJSONBody) {
    this.json = json;
  }

  abstract execute(interaction: CraneCommandInteraction);

}
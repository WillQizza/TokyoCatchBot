import EventEmitter from "events";
import { Model } from "sequelize/types";
import { database, History, Plays } from "../../database/index.js";
import { MachineInformation } from "../api/index.js";
import { MachinePlayData } from "./types.js";

export class PlaysService extends EventEmitter {

  async registerPlay(machine: MachineInformation) {
    const row = await this.getRowAndResetIfNecessary(machine);

    // Update machine with new play count and name if necessary
    const currentPlayCount = row["plays"] + 1;
    await Plays.update({
      plays: currentPlayCount
    }, {
      where: {
        subscription: machine.id
      }
    });

    this.emit("play", {
      ...machine,
      playCount: currentPlayCount,
      lastWinCount: row["lastWinPlayCount"]
    } as MachinePlayData);
  }

  async getPlayCount(machine: MachineInformation): Promise<number> {
    const row = await Plays.findOne({
      where: {
          subscription: machine.id
      }
    });

    if (!row) {
        return 0;
    }

    return row["plays"];
  }

  async registerWin(machine: MachineInformation) {
    const winningPlayCount = await this.getPlayCount(machine);

    // Do not register a win at 0 plays.
    if (winningPlayCount > 0) {
      const oldRecord = await this.getRowAndResetIfNecessary(machine);

      // Reset machine count
      await Plays.update({
        plays: 0,
        lastWinPlayCount: winningPlayCount
      }, {
        where: {
          subscription: machine.id
        }
      });

      // Add history log
      await History.create({
        subscription: machine.id,
        winCount: winningPlayCount
      });

      this.emit("win", {
        ...machine,
        playCount: winningPlayCount,
        lastWinCount: oldRecord["lastWinCount"]
      } as MachinePlayData);
    }
  }

  async getLastWinCount(machine: MachineInformation): Promise<number> {
    const row = await Plays.findOne({
      where: {
          subscription: machine.id
      }
    });

    if (!row) {
        return 0;
    }

    return row["plays"];
  }

  async getPreviousWins(machine: MachineInformation): Promise<{ plays: number, unixTimestamp: number }[]> {
    return (await History.findAll({
        where: {
            subscription: machine.id
        },
        order: database.literal("createdAt DESC")
    })).map(row => ({
      plays: row["winCount"],
      unixTimestamp: Math.floor(row["createdAt"].getTime() / 1000)
    }));
}

  // Deletes play and history rows if machine name no longer matches
  private async getRowAndResetIfNecessary(machine: MachineInformation): Promise<Model<any, any>> {
    const [row] = await Plays.findOrCreate({
      where: {
        subscription: machine.id
      },
      defaults: {
        subscription: machine.id,
        name: machine.name
      }
    });

    if (row["name"] !== machine.name) {
      // Machine has different prize now (possibly different odds)
      // Delete old history
      await History.destroy({
        where: {
          subscription: machine.id
        }
      });

      // Delete old play record
      await Plays.destroy({
        where: {
          subscription: machine.id
        }
      });

      // Now that the records no longer exist, recall the function to get the new row.
      return (await this.getRowAndResetIfNecessary(machine));
    }


    return row;
  }

}
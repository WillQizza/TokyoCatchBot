import { SubscribedSubscriptions } from "../../database/index.js";
import { MachineInformation } from "../api/index.js";

export class SubscriptionService {

  async registerSubscription(data: { user: string, machine: MachineInformation, alertAtCount: number }) {
    await SubscribedSubscriptions.findOrCreate({
      where: {
          userId: data.user,
          subscription: data.machine.id,
          alertAtCount: data.alertAtCount
      }
    });
  }

  async unregisterSubscription(data: { user: string, machine?: MachineInformation }) {
    if (data.machine) {
      return (await SubscribedSubscriptions.destroy({
        where: {
            userId: data.user,
            subscription: data.machine.id
        }
      })) > 0;
    } else {
      return (await SubscribedSubscriptions.destroy({
        where: {
            userId: data.user
        }
      })) > 0;
    }
  }

  async getUserSubscriptions(user: string) {
    return (await SubscribedSubscriptions.findAll({
      where: {
        userId: user
      }
    }));
  }

  async getUsersSubscribedToMachineWithAlertCount(machine: MachineInformation, alertAtCount: number) {
    return (await SubscribedSubscriptions.findAll({
      where: {
          subscription: machine.id,
          alertAtCount
      }
    })).map(row => row["userId"]);
  }

}
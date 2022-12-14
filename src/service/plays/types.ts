import { MachineInformation } from "../api/index";

export type MachinePlayData = MachineInformation & {
  playCount: number,
  lastWinCount?: number
};
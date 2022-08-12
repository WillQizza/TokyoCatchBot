import { MachineInformation } from "../api/index.js";

export type MachinePlayData = MachineInformation & {
  playCount: number,
  lastWinCount?: number
};
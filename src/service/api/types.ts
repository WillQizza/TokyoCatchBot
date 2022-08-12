export type MachineInformation = {
  id: string,
  name: string,
  type: string
};

export type APIMachineEvent = {
  machine: MachineInformation,
  status: string,
  won: boolean
};
import EventEmitter from "events";
import fetch from "node-fetch";
import { schedule } from "node-cron";

import { GRAPHQL_URL, MACHINES_QUERY, MACHINE_QUERY, SUBSCRIPTION_QUERY, WS_URL } from "../../utils/constants.js";
import { TokyoCatchSocket } from "./socket.js";
import { APIMachineEvent, MachineInformation } from "./types.js";

export class APIService extends EventEmitter {

  private ws: TokyoCatchSocket;
  private machineCache: Map<string, MachineInformation>;

  constructor() {
    super();
    this.machineCache = new Map();
    this.ws = new TokyoCatchSocket(WS_URL);

    schedule("* * 1 * * *", () => this.getMachines());
  
    this.ws.on("message", async message => {
      if (message.type === "data") {
        const { id, status } = message.payload.data.machineStatusChanged;
        const won = message.payload.data.machineStatusChanged.currentPlay ? message.payload.data.machineStatusChanged.currentPlay.won : false;
        
        const machine = this.machineCache.has(id) ?
          this.machineCache.get(id) :
          (await this.getMachine(id));

        this.emit("change", {
          machine,
          status,
          won
        } as APIMachineEvent);
      }
    });
  }

  async connect() {
    this.on("connect", () => {
      this.ws.send({
        type: 'connection_init',
        payload: {
            language: 'en',
            token: null
        }
      });
      this.ws.send({
        type: "start",
        payload: {
            variables: {},
            extensions: {},
            operationName: null,
            query: SUBSCRIPTION_QUERY
        }
      });
    });
    
    await this.getMachines(); // fill cache
    await this.ws.connect();
  }

  disconnect() {
    this.ws.disconnect();
  }

  async getMachine(machineId : string, useCache = true): Promise<MachineInformation> {
    if (this.machineCache.has(machineId) && useCache) {
      return this.machineCache.get(machineId);
    }

    const row = await this.queryQL([
      {
        operationName: 'machine',
        query: MACHINE_QUERY,
        variables: {
            id: machineId
        }
      }
    ]);

    const { data } = row;
    if (!data) {
      return null;
    }

    const { machine } = data;
    const machineInformation = {
      id: machine.id,
      name: machine.prize.title,
      type: machine.machineType
    };

    this.machineCache.set(machine.id, machineInformation);
    return machineInformation;
  }

  async getMachines(): Promise<MachineInformation[]> {
    const [ { data: { machines } } ] = await this.queryQL([
      {
          operationName: "machines",
          variables: {},
          query: MACHINES_QUERY
      }
    ]);

    // Clear the cache as this request fetches the LATEST machine data
    // and we're repopulating this way while clearing out old entries.
    this.machineCache.clear();

    return machines.map(data => {
      const machineInformation = {
        id: data.id,
        name: data.prize.title,
        type: data.machineType
      } as MachineInformation;

      // Update cache!
      this.machineCache.set(data.id, machineInformation);

      return machineInformation;
    });
  }

  private async queryQL(payload: Object) {
    const result = await (await fetch(GRAPHQL_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
          'Content-Type': 'application/json'
      }
    })).json();

    return result;
  }

}
import dotenv from "dotenv";
dotenv.config();

export const DATABASE_NAME = process.env.DATABASE_NAME;
export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_PORT = parseInt(process.env.DATABASE_PORT);
export const DATABASE_USERNAME = process.env.DATABASE_USERNAME;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const BOT_TOKEN = process.env.BOT_TOKEN;

export const WS_URL = "wss://api.tokyocatch.com/subscriptions";
export const GRAPHQL_URL = "https://api.tokyocatch.com/graphql";

export const MACHINES_QUERY = `query machines {
  machines(types: [TWO_CLAW, THREE_CLAW]) {
    id
    prize {
      title
    }
    machineType
  }
}`;

export const MACHINE_QUERY = `query machine($id: ID!) {
  machine(id: $id) {
    id
    prize {
      title
    }
    machineType
  }
}`;

export const SUBSCRIPTION_QUERY = `subscription {
  machineStatusChanged {
    id
    status
    currentPlay {
      id
      won
      status
    }
  }
}`;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const { SubscriptionEvent } = require('./data/event');
const { SubscriptionError } = require('./error/subscription');
const { WebSocketError } = require('./error/websocket');

const { WS_URL, SUBSCRIPTION_QUERY, GRAPH_QL_URL, NAME_QUERY } = require('./util/constants');
const { WebSocketConnection } = require('./websocket');

class APIClient {

    constructor() {
        this._subscriptionCodeToId = new Map();
        this._idToSubscriptionCode = new Map();
        this._nextId = 1;
        this._ws = new WebSocketConnection(WS_URL);

        this._eventHandler = null;

        this._ws.setMessageHandler(m => {
            if (m.type === 'data') {
                const { id, status } = m.payload.data.machineStatusChanged;
                const won = m.payload.data.machineStatusChanged.currentPlay ? m.payload.data.machineStatusChanged.currentPlay.won : false;
                
                const event = new SubscriptionEvent({
                    id,
                    status,
                    won
                });

                this._eventHandler(event);
            }
        });

        // Resubscribe to everything on reconnect
        this._ws.setConnectionHandler(() => this._subscriptionCodeToId.forEach((id, code) => {
            this._idToSubscriptionCode.delete(id);
            this._subscriptionCodeToId.delete(code);
            this.subscribe(code);
        }));
    }

    setEventHandler(callback) {
        this._eventHandler = callback;
    }

    async subscribe(code) {
        if (!this._ws.isConnected()) {
            throw new WebSocketError('WebSocket is not connected.');
        }
        if (this._subscriptionCodeToId.has(code)) {
            throw new SubscriptionError(`Already subscribed to ${code}!`);
        }
        
        const subscriptionId = this._nextId++;

        this._ws.send({
            id: `${subscriptionId}`,
            type: 'start',
            payload: {
                variables: {
                    id: code
                },
                extensions: {},
                operationName: null,
                query: SUBSCRIPTION_QUERY
            }
        });

        this._subscriptionCodeToId.set(code, subscriptionId);
        this._idToSubscriptionCode.set(subscriptionId, code);
    }

    async unsubscribe(code) {
        if (!this._ws.isConnected()) {
            throw new WebSocketError('WebSocket is not connected.');
        }
        if (!this._subscriptionCodeToId.has(code)) {
            throw new SubscriptionError(`Cannot unsubscribe to ${code} if it was not subscribed to.`);
        }

        this._ws.send({
            id: `${this._subscriptionCodeToId.get(code)}`,
            type: 'stop'
        });
    }

    async getName(machineIds = []) {
        let machines;
        if (typeof machineIds === 'string') {
            machines = [machineIds];
        } else {
            machines = machineIds;
        }

        const rows = await (await fetch(GRAPH_QL_URL, {
            method: 'POST',
            body: JSON.stringify(machines.map(id => ({
                operationName: 'machine',
                query: NAME_QUERY,
                variables: {
                    id
                }
            }))),
            headers: {
                'Content-Type': 'application/json'
            }
        })).json();

        return rows.map(({data}) => ({
            id: data.machine.id,
            name: data.machine.prize.title
        }));
    }
    
    async connect() {
        await this._ws.connect();
        this._ws.send({
            type: 'connection_init',
            payload: {
                language: 'en',
                token: null
            }
        });
    }

    disconnect() {
        this._ws.disconnect();
    }

}

module.exports = {
    APIClient
};
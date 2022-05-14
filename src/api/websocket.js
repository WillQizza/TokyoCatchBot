const { WebSocket } = require('ws');
const { WebSocketError } = require('./error/websocket');

class WebSocketConnection {

    constructor(url) {
        this._url = url;
        this._ws = null;
        this._connected = false;
        this._reconnect = false;

        this._messageHandler = null;
        this._errorHandler = null;
        this._connectionHandler = null;
    }

    send(payload) {
        if (typeof payload !== 'object') {
            throw new WebSocketError('Payload must be an object');
        }
        
        if (this._connected) {
            this._ws.send(JSON.stringify(payload));
        } else {
            throw new WebSocketError('WebSocket is not connected.');
        }
    }

    connect() {
        this._ws = new WebSocket(this._url, 'graphql-ws');

        return new Promise((resolve, reject) => {
            this._ws.on('open', () => {
                this._connected = true;
                this._reconnect = true;

                if (this._connectionHandler !== null) {
                    this._connectionHandler();
                }

                resolve();
            });

            this._ws.on('close', () => {
                this._connected = false;

                // do we need to try to reconnect?
                if (this._reconnect) {
                    try {
                        this.connect();
                    } catch (error) {
                        this._errorHandler(error);
                    }
                }
            });

            this._ws.on('error', error => {
                if (this._errorHandler !== null) {
                    this._errorHandler(error);
                }
                reject(error);
            });
            
            this._ws.on('message', message => {
                if (this._messageHandler !== null) {
                    const packet = JSON.parse(message.toString());
                    this._messageHandler(packet);
                }
            });
        });
    }

    setConnectionHandler(callback) {
        this._connectionHandler = callback;
    }

    setMessageHandler(callback) {
        this._messageHandler = callback;
    }

    setErrorHandler(callback) {
        this._errorHandler = callback;
    }

    isConnected() {
        return this._connected;
    }

    disconnect() {
        this._reconnect = false;
        this._connected = false;
        this._ws.close();
    }

}

module.exports = {
    WebSocketConnection
};
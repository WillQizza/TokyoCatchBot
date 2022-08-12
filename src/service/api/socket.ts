import EventEmitter from "events";
import {
	WebSocket
} from "ws";

export class TokyoCatchSocket extends EventEmitter {

	private url: string;
	private ws: WebSocket;
	private connected: boolean;
	private reconnect: boolean;

	constructor(url: string) {
		super();

		this.url = url;
		this.ws = null;
		this.connected = false;
		this.reconnect = false;
	}

	connect() {
		this.ws = new WebSocket(this.url, "graphql-ws");

		return new Promise((resolve, reject) => {
			this.ws.on("open", () => {
				this.connected = true;
				this.reconnect = true;

				this.emit("connect");
				resolve(null);
			});

			this.ws.on("close", () => {
				this.connected = false;

				// do we need to try to reconnect?
				if (this.reconnect) {
					try {
						this.connect();
					} catch (error) {
						this.emit("error", error);
					}
				}
			});

			this.ws.on("error", error => {
				this.emit("error", error);
				reject(error);
			});

			this.ws.on("message", message => {
				const packet = JSON.parse(message.toString());
				this.emit("message", packet);
			});
		});
	}

	send(payload: Object) {
		if (this.connected) {
			this.ws.send(JSON.stringify(payload));
		} else {
			throw new Error("WebSocket is not connected.");
		}
	}

	disconnect() {
		this.reconnect = false;
		this.connected = false;
		this.ws.close();
	}
	
}
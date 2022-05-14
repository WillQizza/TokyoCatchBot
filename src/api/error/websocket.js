class WebSocketError extends Error {

    constructor(message) {
        super(message);
    }

}

module.exports = {
    WebSocketError
};
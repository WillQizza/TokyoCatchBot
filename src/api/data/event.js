class SubscriptionEvent {
    
    constructor({id, status, won}) {
        this._id = id;
        this._status = status;
        this._won = won;
    }

    getId() {
        return this._id;
    }

    getStatus() {
        return this._status;
    }

    isWon() {
        return this._won;
    }

}

module.exports = {
    SubscriptionEvent
};
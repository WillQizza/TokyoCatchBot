module.exports = {
    WS_URL: 'wss://api.tokyocatch.com/subscriptions',
    SUBSCRIPTION_QUERY: 'subscription {\n machineStatusChanged {\n id\n status\n currentPlay {\n id\n startedAt\n won\n status\n statusUpdatedAt\n __typename\n }\n currentPlayingUserId\n __typename\n }\n}\n'
};
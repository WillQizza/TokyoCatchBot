const { APIClient } = require('../src/api/client');
const { init, Plays } = require('../src/service/util/database');

const apiClient = new APIClient();

init().then(() => {
    console.log('Initialized database... Migrating...');
    Plays.findAll().then(async rows => {
        console.log('fetching names...');
        const machineIds = rows.map(row => row.subscription);
        apiClient.getName(machineIds).then(async data => {
            console.log('names fetched!');
            for (const row of data) {
                await Plays.update({
                    name: row.name
                }, {
                    where: {
                        subscription: row.id
                    }
                });
                console.log(`Updated ${row.id} to be named ${row.name}`);
            }
            console.log('Completed migration');
        });
    });
});

const { playerDB } = require('../data/player-database');

async function testSupabaseConnection() {
    console.log('Testing Supabase connection and savePlayer...');

    const testUser = {
        userId: 'test-user-' + Date.now(),
        username: 'TestUser_' + Date.now(),
        level: 1,
        realPower: 100,
        class: { id: 'test', name: 'Tester' },
        exploration: { currentZone: 'TestZone', unlockedZones: ['TestZone'] }
    };

    try {
        console.log('Attempting to save player:', testUser.username);
        // We need to use the method from the instance
        await playerDB.savePlayer(testUser);
        
        console.log('Save attempt complete. Checking if player exists...');
        const savedPlayer = await playerDB.getPlayer(testUser.userId);
        
        if (savedPlayer) {
            console.log('✅ Player successfully retrieved from DB/Cache:', savedPlayer.username);
            console.log('Cleaning up test user...');
            await playerDB.deletePlayer(testUser.userId);
            console.log('✅ Test user deleted.');
        } else {
            console.error('❌ Failed to retrieve saved player.');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

testSupabaseConnection();

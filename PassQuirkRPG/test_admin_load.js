try {
    const admin = require('./src/commands/slash/admin.js');
    console.log('Loaded admin:', admin.data.name);
} catch (e) {
    console.error('Error loading admin:', e);
}

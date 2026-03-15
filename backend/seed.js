const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seed() {
    try {
        console.log('Seeding database...');

        // Hash password for admin
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', ['admin']);
        if (existing.length === 0) {
            await pool.query(
                'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'Administrator', 'admin']
            );
            console.log('Admin user created: admin / admin123');
        } else {
            // Update password
            await pool.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
            console.log('Admin password updated.');
        }

        // Seed a staff user
        const [staffExists] = await pool.query('SELECT id FROM users WHERE username = ?', ['cashier']);
        if (staffExists.length === 0) {
            const staffPassword = await bcrypt.hash('cashier123', 10);
            await pool.query(
                'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
                ['cashier', staffPassword, 'Cashier User', 'staff']
            );
            console.log('Staff user created: cashier / cashier123');
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();

const db = require('./config/db');
db.query('SELECT email FROM USER_AUTH').then(([rows]) => {
    console.log(rows);
    process.exit(0);
});

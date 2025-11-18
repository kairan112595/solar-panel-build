import { Client } from '@neondatabase/serverless';

export default function handler(req, res) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  console.log("Connecting to database...");
  client.connect()
    .then(() => {
      // Create table if not exists
      return client.query(`
        CREATE TABLE IF NOT EXISTS "panel-list" (
          id SERIAL PRIMARY KEY,
          name TEXT,
          value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    })
    .then(() => {
      if (req.method === 'POST') {
        const { name, value } = req.body;
        return client.query(
          'INSERT INTO "panel-list" (name, value) VALUES ($1, $2) RETURNING *',
          [name, value]
        )
        .then(result => {
          client.end();
          res.status(200).json({ inserted: result.rows[0] });
        });
      } else {
        // GET all rows
        return client.query('SELECT * FROM "panel-list"')
          .then(result => {
            client.end();
            res.status(200).json({ data: result.rows });
          });
      }
    })
    .catch(err => {
      client.end();
      res.status(500).json({ error: err.message });
    });
}

import { Client } from '@neondatabase/serverless';

export default function handler(req, res) {

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*"); // or your domain
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  const client = new Client({ connectionString: process.env.DATABASE_URL });

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

// Starts the free self-hosted server. Configuration (environment variables):
//   PORT             default 8787
//   HOST             default 127.0.0.1 (the tunnel connects locally; no public port is opened)
//   DATA_FILE        SQLite file, default server/data/app.sqlite
//   ALLOWED_ORIGINS  comma-separated browser origins allowed to call the API, e.g. https://your-game.example
import { createApp } from './app.js';

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const app = createApp();

app.server.listen(port, host, () => {
  console.log(`Infinite Match free server listening on http://${host}:${port}`);
});

function shutdown() {
  app.server.close(() => {
    app.db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

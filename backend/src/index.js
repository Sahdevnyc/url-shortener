require('dotenv').config();
const app = require('./app');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 5001;

async function start() {
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

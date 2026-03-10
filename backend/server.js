const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
const app = require('./src/app');

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
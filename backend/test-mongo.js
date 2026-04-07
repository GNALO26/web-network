const { MongoClient } = require('mongodb');

// Remplacez par votre URI complète avec le mot de passe
const uri = mongodb+srv://admin-WebNetwork:Olympe26070720@web-network.cqvjpkn.mongodb.net/?appName=web-network

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Connexion réussie !");
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Ping réussi !");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
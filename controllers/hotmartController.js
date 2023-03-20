const { sendConfirmationEmail } = require("../services/emailService");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");

async function generatePassword() {
  const length = 8;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0, n = charset.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

async function hotmartController(req, res) {
  const hotmartToken = req.headers["hotmart-token"];

  if (hotmartToken !== process.env.HOTMART_TOKEN) {
    console.log("Invalid Hotmart Token:", hotmartToken);
    res.status(401).send("Unauthorized");
    return;
  }

  const eventType = req.body.type;
  const eventData = req.body.data;

  switch (eventType) {
    case "sale":
      console.log("Evento de Compra Recebido:", eventData);
      const { name, email } = eventData.customer;
      const password = await generatePassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db("smartclass-artur");
        const usersCollection = db.collection("users");

        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
          console.log("Este Usuário já existe:", existingUser);
          return;
        }

        const newUser = { name, email, password: hashedPassword };
        const result = await usersCollection.insertOne(newUser);

        sendConfirmationEmail(email, password);

        console.log("Conta criada:", newUser);
      } catch (error) {
        console.error("Erro ao criar conta:", error);
      }

      break;
    case "chargeback":
    case "subscription_cancelled":
      console.log(`Recebido ${eventType} evento - removendo usuário`);

      try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db("smartclass-artur");
        const usersCollection = db.collection("users");

        const { email } = eventData.customer;
        const result = await usersCollection.deleteOne({ email });

        console.log("Usuário removido:", result.deletedCount);
      } catch (error) {
        console.error("Erro ao remover usuário:", error);
      }

      break;
    case "subscription_payment":
      console.log(`Recebido ${eventType} evento - nenhuma ação requerida`);
      break;
    default:
      console.log("Unknown event type:", eventType);
  }

  res.status(200).send("Webhook Recebido");
}

module.exports = {
  hotmartController,
};

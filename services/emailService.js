const nodemailer = require("nodemailer");

async function sendConfirmationEmail(email, password) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const message = {
      from: process.env.EMAIL_FROM_ADDRESS,
      to: email,
      subject: "Acesse sua Conta - EducaGenius",
      text: `Olá, sua nova conta foi criada! Aqui estão suas informações de login:\n\nEmail: ${email}\nSenha: ${password}\n\nPor favor, mantenha essas credenciais seguras.\n\nPara acessar sua conta, entre nesse link: <a target="_blank" href="https://app.educagenius.com/login">Entrar no Aplicativo</a>\n\nPara Trocar sua Senha, Clique aqui -> <a target="_blank" href="https://app.educagenius.com/forgot">Trocar Senha</a>`,
    };

    const info = await transporter.sendMail(message);
    console.log("Email enviado com sucesso:", info);
  } catch (error) {
    console.error("Erro ao enviar e-mail de confirmação:", error);
  }
}

module.exports = { sendConfirmationEmail };

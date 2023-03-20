const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Por favor preencha todos os campos");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("Usuário não encontrado.");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  const token = generateToken(user._id);

  if (isPasswordCorrect) {
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });
  }

  if (user && isPasswordCorrect) {
    const { _id, name, email } = user;
    res.status(200).json({
      _id,
      name,
      email,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Email ou senha incorretos");
  }
});

const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });

  return res.status(200).json({
    message: "Logout realizado com sucesso",
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email } = user;
    res.status(200).json({
      _id,
      name,
      email,
    });
  } else {
    res.status(400);
    throw new Error("Usuário não encontrado");
  }
});

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json(false);
  }

  const verified = jwt.verify(token, process.env.JWT_SECRET);

  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email } = user;

    user.email = email;
    user.name = req.body.name || name;

    const updatedUser = await user.save();

    res.json(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error("Usuário não encontrado");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { oldPassword, newPassword } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("Usuário não encontrado");
  }

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Por favor sua Senha antiga e a Nova Senha");
  }

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (user && isPasswordCorrect) {
    user.password = newPassword;
    await user.save();
    res.status(200).send("Senha alterada com sucesso");
  } else {
    res.status(400);
    throw new Error("Senha antiga incorreta");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("Usuário não encontrado");
  }

  let token = await Token.findOne({ userId: user._id });

  if (token) {
    await token.deleteOne();
  }

  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 5,
  }).save();

  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `
    <h1>Olá ${user.name}, você solicitou uma nova senha</h1>

    <p>Por favor clique no link abaixo para resetar sua senha</p>

    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

  const subject = "Resetar senha";
  const send_to = user.email;
  const send_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, send_from);

    res
      .status(200)
      .json({ success: true, message: "Email enviado com sucesso" });
  } catch (error) {
    res.status(500);
    throw new Error("Erro ao enviar email, por favor tente novamente");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Token inválido ou expirado");
  }

  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Senha alterada com sucesso",
  });
});

module.exports = {
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};

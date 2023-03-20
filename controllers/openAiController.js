const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const generateResponse = async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 700,
      temperature: 0.65,
      presence_penalty: 0.5,
      frequency_penalty: 0.5,
    });

    const textUrl = response.data.choices[0].text;

    res.status(200).json({
      success: true,
      data: textUrl,
    });
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    res.status(400).json({
      success: false,
      error: "O Texto não pode ser gerado",
    });
  }
};

module.exports = { generateResponse };

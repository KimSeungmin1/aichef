// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 테스트용 라우트
app.get('/', (req, res) => {
  res.send('AI Chef Server is running!');
});
const { getRecipeRecommendation } = require('./services/geminiService');

// 레시피 추천 API 엔드포인트
app.post('/api/recommend', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: '재료를 입력해주세요.' });
  }

  try {
    // Gemini에게 요청 보내기
    const recipe = await getRecipeRecommendation(ingredients);
    res.json({ recipe });
  } catch (error) {
    res.status(500).json({ error: '레시피 생성 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
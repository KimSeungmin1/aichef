// server/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getRecipeRecommendation(ingredients) {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `
    당신은 요리 초보자를 위한 친절한 'AI 셰프'입니다.
    사용자가 가진 냉장고 재료는 다음과 같습니다: [${ingredients}]

    이 재료를 활용해서 만들 수 있는 최적의 레시피 1개를 추천해주세요.
    
    [필수 요구사항]
    1. 요리 이름과 간단한 설명을 먼저 적어주세요.
    2. '쉬운 용어'를 사용하세요 (예: '소테' 대신 '볶기').
    3. 계량은 반드시 '숟가락', '종이컵' 등 직관적인 단위를 사용하세요 (g, ml 사용 지양).
    4. 사용자가 가진 재료 외에 필수적인 양념이 없다면 '대체 재료'를 알려주세요.
    5. 조리 과정은 번호를 매겨서 순서대로 아주 쉽게 설명해주세요.
    6. 말투는 친절하고 격려하는 톤으로 작성해주세요.
    
    반드시 다음 JSON 형식으로 응답해주세요:
    {
      "title": "요리 이름",
      "description": "요리에 대한 간단한 설명",
      "ingredients": ["재료1", "재료2", "재료3"],
      "steps": [
        {"step": 1, "instruction": "첫 번째 단계 설명"},
        {"step": 2, "instruction": "두 번째 단계 설명"}
      ]
    }
    
    JSON 형식만 반환하고 다른 텍스트는 포함하지 마세요.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON 파싱 시도
    try {
      // JSON 코드 블록이 있는 경우 제거
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      // 파싱 실패 시 기존 텍스트 반환 (하위 호환성)
      return { 
        title: "레시피",
        description: "",
        ingredients: [],
        steps: [{ step: 1, instruction: text }]
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("레시피를 가져오는 데 실패했습니다.");
  }
}

module.exports = { getRecipeRecommendation };
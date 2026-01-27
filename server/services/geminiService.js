const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getRecipeRecommendation(ingredients) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    당신은 요리 초보자를 위한 친절한 'AI 셰프'입니다.
    사용자가 가진 냉장고 재료는 다음과 같습니다: [${ingredients}]

    이 재료를 활용해서 만들 수 있는 최적의 레시피 1개를 추천해주세요.
    
    [필수 요구사항]
    1. 요리 이름과 간단한 설명을 먼저 적어주세요.
    2. '쉬운 용어'를 사용하세요 (예: '소테' 대신 '볶기').
    3. 계량은 g, ml 단위를 기본으로 사용하되, 괄호() 안에 '숟가락', '티스푼', '종이컵' 등의 직관적인 단위를 병기해주세요. (예: '설탕 10g (1큰술)')
    4. '개', '대' 등의 단위를 쓸 때는 괄호()로 부가 설명을 추가하지 마세요. (예: '계란 2개' O, '계란 2개(100g)' X)
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
  }
}

async function getIngredientSubstitute(ingredient, recipeTitle) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    사용자가 '${recipeTitle}' 요리를 하려고 하는데, 재료 중 '${ingredient}'가 없다고 합니다.
    
    '${ingredient}' 대신 사용할 수 있는 재료를 1~2가지만 추천해주고, 없으면 생략 가능한지 알려주세요.
    설명은 50자 이내로 아주 짧고 친절하게 해주세요.
    
    예시 답변:
    - "식초 1큰술로 대체 가능해요!"
    - "없으면 생략해도 괜찮아요."
    - "양파나 부추를 대신 넣어도 좋아요."
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Substitute Error:", error);
    return "대체 재료를 찾을 수 없습니다.";
  }
}

module.exports = { getRecipeRecommendation, getIngredientSubstitute };
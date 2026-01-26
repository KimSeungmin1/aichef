import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [serverMessage, setServerMessage] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then((res) => res.text())
      .then((data) => setServerMessage(data))
      .catch((err) => setServerMessage('서버 연결 실패'));
  }, []);

  const handleRecommendation = async () => {
    if (!ingredients) return alert('재료를 입력해주세요!');

    setLoading(true);
    setRecipe('');

    try {
      const response = await fetch('http://localhost:5000/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();
      if (data.recipe) {
        setRecipe(data.recipe);
      } else {
        alert('레시피를 가져오지 못했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('서버 통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>👨‍🍳 AI Chef</h1>
        <p className="server-status">서버 상태: {serverMessage}</p>
      </header>

      <main className="main-content">
        <section className="input-section">
          <h2>냉장고에 있는 재료를 알려주세요!</h2>
          <textarea
            placeholder="예: 계란 2개, 대파 조금, 양파 반 개..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows="4"
          />
          <button onClick={handleRecommendation} className="action-btn" disabled={loading}>
            {loading ? '요리 중...' : '👩‍🍳 레시피 추천받기'}
          </button>
        </section>

        <section className="result-section">
          {loading ? (
            <div className="loading">👨‍🍳 셰프가 레시피를 고민 중입니다...</div>
          ) : recipe ? (
            <div className="recipe-content">
              <div className="recipe-header">
                <h2 className="recipe-title">{recipe.title || '레시피'}</h2>
                {recipe.description && (
                  <p className="recipe-description">{recipe.description}</p>
                )}
              </div>
              
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="recipe-ingredients">
                  <h3>📋 필요한 재료</h3>
                  <ul>
                    {recipe.ingredients.map((ingredient, idx) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {recipe.steps && recipe.steps.length > 0 && (
                <div className="recipe-steps">
                  <h3>👨‍🍳 조리 방법</h3>
                  <div className="steps-container">
                    {recipe.steps.map((step, idx) => (
                      <div key={idx} className="step-item">
                        <div className="step-number">{step.step || idx + 1}</div>
                        <div className="step-content">{step.instruction}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="recipe-placeholder">아직 추천된 레시피가 없습니다.</div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
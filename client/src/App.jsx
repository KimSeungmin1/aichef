import { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';
const USER_ID = 1;

const extractIngredientName = (text) => {
  const match = text.match(/([가-힣]+(?:\s+[가-힣]+)?)/);
  return match ? match[1].trim() : text.split(/[로을를]/)[0].trim();
};

function SubstituteResult({ substitute, ingredient, onSubstitute, loadingSubstitute, substitutes, usedIngredients }) {
  const substituteText = typeof substitute === 'string' ? substitute : substitute.text;
  const parentIngredient = typeof substitute === 'object' ? substitute.parentIngredient : null;
  const key = parentIngredient ? `${parentIngredient}_${ingredient}` : ingredient;
  const extracted = extractIngredientName(substituteText);
  const nestedKey = `${key}_${extracted}`;
  const nestedSubstitute = substitutes[nestedKey];

  return (
    <div className="substitute-result">
      <div className="substitute-text">💡 {substituteText}</div>
      {!parentIngredient && (
        <button
          className="substitute-btn substitute-btn-nested"
          onClick={() => onSubstitute(extracted, ingredient, usedIngredients)}
          disabled={loadingSubstitute[nestedKey]}
        >
          {loadingSubstitute[nestedKey] ? '찾는 중...' : '이것도 없어요 🙅‍♂️'}
        </button>
      )}
      {nestedSubstitute && (
        <SubstituteResult
          substitute={nestedSubstitute}
          ingredient={extracted}
          onSubstitute={onSubstitute}
          loadingSubstitute={loadingSubstitute}
          substitutes={substitutes}
          usedIngredients={[...usedIngredients, extracted]}
        />
      )}
    </div>
  );
}

function App() {
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [substitutes, setSubstitutes] = useState({});
  const [loadingSubstitute, setLoadingSubstitute] = useState({});
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showSavedRecipes, setShowSavedRecipes] = useState(false);
  const [isFromSavedRecipes, setIsFromSavedRecipes] = useState(false);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const resetRecipeState = () => {
    setRecipe(null);
    setIsFromSavedRecipes(false);
    setShowSavedRecipes(false);
  };

  const handleRecommendation = async () => {
    if (!ingredients.trim()) return alert('재료를 입력해주세요!');
    setLoading(true);
    resetRecipeState();
    setSubstitutes({});
    try {
      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
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

  const getUsedIngredients = (ingredient, parentIngredient, substitutes) => {
    const used = new Set();
    recipe?.ingredients?.forEach((ing) => used.add(extractIngredientName(ing)));
    Object.values(substitutes).forEach((s) => {
      const t = typeof s === 'string' ? s : s.text;
      const name = extractIngredientName(t);
      if (name) used.add(name);
    });
    used.add(extractIngredientName(ingredient));
    if (parentIngredient) used.add(extractIngredientName(parentIngredient));
    return [...used];
  };

  const handleSubstitute = async (ingredient, parentIngredient = null, providedUsed = null) => {
    const key = parentIngredient ? `${parentIngredient}_${ingredient}` : ingredient;
    if (loadingSubstitute[key]) return;
    const usedIngredients = providedUsed ?? getUsedIngredients(ingredient, parentIngredient, substitutes);
    setLoadingSubstitute((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/substitute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ingredient, 
          recipeTitle: recipe.title,
          excludedIngredients: usedIngredients
        }),
      });
      const data = await res.json();
      setSubstitutes((prev) => ({ 
        ...prev, 
        [key]: { text: data.substitute, parentIngredient: parentIngredient || null } 
      }));
    } catch (error) {
      console.error(error);
      alert('대체 재료를 찾는 중 오류가 발생했습니다.');
    } finally {
      setLoadingSubstitute((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveToDB = async () => {
    if (!recipe) return;
    try {
      const res = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          recipe_title: recipe.title || '레시피',
          recipe_content: JSON.stringify(recipe, null, 2),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('냉장고에 저장되었습니다!');
        if (showSavedRecipes) handleLoadSavedRecipes();
      } else {
        alert('저장 실패: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveToFile = () => {
    if (!recipe) return;
    const title = recipe.title || '레시피';
    const parts = [`레시피: ${title}\n`];
    if (recipe.description) parts.push(`설명: ${recipe.description}\n`);
    if (recipe.ingredients?.length) {
      parts.push('필요한 재료:\n', ...recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}\n`), '\n');
    }
    if (recipe.steps?.length) {
      parts.push('조리 방법:\n', ...recipe.steps.map(step => `${step.step || ''}. ${step.instruction}\n`));
    }
    const blob = new Blob([parts.join('')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9가-힣]/gi, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    alert('컴퓨터에 저장되었습니다!');
  };

  const handleLoadSavedRecipes = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const res = await fetch(`${API_BASE}/api/saved-recipes?user_id=${USER_ID}`);
      const data = await res.json();
      if (data.success) {
        setSavedRecipes(data.recipes);
        setShowSavedRecipes(true);
        setRecipe(null);
        setIsFromSavedRecipes(false);
      } else {
        alert('레시피를 불러오지 못했습니다: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('레시피 불러오기 중 오류가 발생했습니다.');
    }
  };

  const handleLoadRecipe = (recipeContent) => {
    try {
      setRecipe(JSON.parse(recipeContent));
      setShowSavedRecipes(false);
      setIsFromSavedRecipes(true);
      document.querySelector('.result-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('레시피 파싱 오류:', error);
      alert('레시피를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleBackToSavedRecipes = () => {
    setRecipe(null);
    setIsFromSavedRecipes(false);
    setShowSavedRecipes(true);
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm('정말 이 레시피를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/saved-recipes/${recipeId}?user_id=${USER_ID}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('레시피가 삭제되었습니다.');
        handleLoadSavedRecipes();
      } else {
        alert('삭제 실패: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI Chef</h1>
        <button onClick={handleLoadSavedRecipes} className="view-saved-btn">
          내 레시피북 보기
        </button>
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
              {isFromSavedRecipes && (
                <button onClick={handleBackToSavedRecipes} className="back-to-saved-btn">
                  ← 내 레시피 북으로 돌아가기
                </button>
              )}
              <div className="recipe-header">
                <div className="recipe-title-row">
                  <h2 className="recipe-title">{recipe.title || '레시피'}</h2>
                  <div className="title-save-buttons">
                    <button onClick={handleSaveToDB} className="title-save-btn title-save-btn-db" title="DB에 저장">
                      💾
                    </button>
                    <button onClick={handleSaveToFile} className="title-save-btn title-save-btn-file" title="파일로 저장">
                      📁
                    </button>
                  </div>
                </div>
                {recipe.description && (
                  <p className="recipe-description">{recipe.description}</p>
                )}
              </div>
              
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="recipe-ingredients">
                  <h3>📋 필요한 재료</h3>
                  <ul>
                    {recipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="ingredient-item">
                        <span className="ingredient-text">{ingredient}</span>
                        <button 
                          className="substitute-btn"
                          onClick={() => handleSubstitute(ingredient)}
                          disabled={loadingSubstitute[ingredient]}
                        >
                          {loadingSubstitute[ingredient] ? '찾는 중...' : '없어요 🙅‍♂️'}
                        </button>
                        {substitutes[ingredient] && (
                          <SubstituteResult 
                            substitute={substitutes[ingredient]} 
                            ingredient={ingredient}
                            onSubstitute={handleSubstitute}
                            loadingSubstitute={loadingSubstitute}
                            substitutes={substitutes}
                            usedIngredients={getUsedIngredients(ingredient, null, substitutes)}
                          />
                        )}
                      </li>
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
          ) : showSavedRecipes ? (
            <div className="saved-recipes-section">
              <div className="saved-recipes-header">
                <h2>내 레시피북</h2>
                <button onClick={() => setShowSavedRecipes(false)} className="close-saved-btn">
                  ✕ 닫기
                </button>
              </div>
              {savedRecipes.length === 0 ? (
                <div className="no-saved-recipes">저장된 레시피가 없습니다.</div>
              ) : (
                <div className="saved-recipes-list">
                  {savedRecipes.map((saved) => (
                    <div key={saved.id} className="saved-recipe-item">
                      <div className="saved-recipe-info">
                        <h3>{saved.recipe_title}</h3>
                        <p className="saved-recipe-date">{formatDate(saved.created_at)}</p>
                      </div>
                      <div className="saved-recipe-actions">
                        <button 
                          onClick={() => handleLoadRecipe(saved.recipe_content)} 
                          className="load-recipe-btn"
                        >
                          보기
                        </button>
                        <button 
                          onClick={() => handleDeleteRecipe(saved.id)} 
                          className="delete-recipe-btn"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
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
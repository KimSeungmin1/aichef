const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'aichef_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('PostgreSQL 연결 오류:', err);
});

app.use(cors());
app.use(express.json());

const { getRecipeRecommendation, getIngredientSubstitute } = require('./services/geminiService');

app.get('/', (req, res) => res.send('AI Chef Server is running!'));
app.post('/api/recommend', async (req, res) => {
  const { ingredients } = req.body;
  if (!ingredients) return res.status(400).json({ error: '재료를 입력해주세요.' });
  try {
    const recipe = await getRecipeRecommendation(ingredients);
    res.json({ recipe });
  } catch (error) {
    res.status(500).json({ error: '레시피 생성 중 오류가 발생했습니다.' });
  }
});
app.post('/api/substitute', async (req, res) => {
  const { ingredient, recipeTitle, excludedIngredients } = req.body;
  if (!ingredient) return res.status(400).json({ error: '재료명이 필요합니다.' });
  try {
    const substitute = await getIngredientSubstitute(ingredient, recipeTitle || '요리', excludedIngredients || []);
    res.json({ substitute });
  } catch (error) {
    res.status(500).json({ error: '대체 재료 찾기 실패' });
  }
});
app.post('/api/save', async (req, res) => {
  const { user_id, recipe_title, recipe_content } = req.body;
  if (!user_id || !recipe_title || !recipe_content) {
    return res.status(400).json({ 
      success: false, 
      message: 'user_id, recipe_title, recipe_content는 필수입니다.' 
    });
  }
  try {
    const result = await pool.query(
      'INSERT INTO saved_recipes (user_id, recipe_title, recipe_content) VALUES ($1, $2, $3) RETURNING *',
      [user_id, recipe_title, recipe_content]
    );
    res.json({ success: true, message: '저장 완료', data: result.rows[0] });
  } catch (error) {
    console.error('DB 저장 에러:', error);
    res.status(500).json({ success: false, message: 'DB 저장 실패', error: error.message });
  }
});

app.get('/api/saved-recipes', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id는 필수입니다.' });
  }
  try {
    const result = await pool.query(
      'SELECT id, recipe_title, recipe_content, created_at FROM saved_recipes WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ success: true, recipes: result.rows });
  } catch (error) {
    console.error('레시피 조회 에러:', error);
    res.status(500).json({ success: false, message: '레시피 조회 실패', error: error.message });
  }
});

app.delete('/api/saved-recipes/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id는 필수입니다.' });
  }
  try {
    const result = await pool.query(
      'DELETE FROM saved_recipes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '레시피를 찾을 수 없거나 삭제 권한이 없습니다.' 
      });
    }
    res.json({ success: true, message: '삭제 완료' });
  } catch (error) {
    console.error('레시피 삭제 에러:', error);
    res.status(500).json({ success: false, message: '레시피 삭제 실패', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
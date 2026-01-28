# 👨‍🍳 AI Chef

**AI Chef**는 요리에 흥미는 있지만 기초 지식이 없는 사용자를 위해 만들어졌습니다!

냉장고에 있는 재료를 입력하면, AI가 최고의 레시피를 추천해주는 웹 애플리케이션입니다.

재료가 부족할 때 적절한 대체 재료를 찾아주고, 마음에 드는 레시피를 나만의 레시피 북에 저장하여 관리할 수 있습니다.

---

## ✨ 주요 기능

### 1. 🥘 스마트 레시피 추천

- 냉장고 속 재료를 입력하면 AI가 **요리 이름, 필요한 재료, 상세 조리 과정**을 만들어줍니다.
- 예: "계란, 대파, 스팸" 입력 -> "스팸 계란 덮밥" 레시피 추천

### 2. 🔄 똑똑한 대체 재료 찾기

- 레시피 재료 중 없는 것이 있나요? "없어요 🙅‍♂️" 버튼을 누르세요.
- AI가 맛을 해치지 않는 최적의 **대체 재료**를 추천해줍니다.

### 3. 💾 나만의 레시피 북 (회원 전용)

- **회원가입/로그인**을 통해 나만의 계정을 만들 수 있습니다.
- 마음에 드는 레시피는 **DB에 저장**하거나, **텍스트 파일(.txt)로 다운로드**할 수 있습니다.
- 저장된 레시피는 언제든 다시 꺼내보고 관리(삭제)할 수 있습니다.

---

## 🛠️ 기술 스택

### Frontend

- **React**: 사용자 인터페이스 구현
- **Vite**: 빠른 개발 환경 및 빌드

### Backend

- **Node.js & Express**: API 서버 구축

### DB

- **PostgreSQL**: 사용자 정보 및 레시피 데이터 저장

### AI

- **Google Gemini API**: 레시피 생성 및 재료 추천 AI 모델

---

## 🚀 설치 및 실행 방법

### 1. 프로젝트 다운로드

```bash
git clone https://github.com/KimSeungmin1/aichef.git
cd aichef
```

### 2. 데이터베이스 설정 (PostgreSQL)

`psql` 또는 PGAdmin을 사용하여 데이터베이스와 테이블을 생성

```sql
CREATE DATABASE aichef_db;

\c aichef_db

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE saved_recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    recipe_title VARCHAR(255),
    recipe_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 환경 변수 설정 (.env)

`server` 폴더 안에 `.env` 파일을 생성하고 다음 내용을 채워주세요.

**경로: `server/.env`**

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD= # your password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aichef_db
GEMINI_API_KEY= # your GEMINI API Key
```

### 4. 의존성 설치 및 실행

**서버 (Backend)**

```bash
cd server
npm install
npm run dev
```

**클라이언트 (Frontend)**
새 터미널을 열고 실행

```bash
cd client
npm install
npm run dev
```

이제 브라우저에서 `http://localhost:5173` 으로 접속하면 AI Chef를 만날 수 있습니다! 👨‍🍳

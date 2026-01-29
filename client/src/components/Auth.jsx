import { useState } from 'react';

// 인증 컴포넌트
const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true); // 로그인/회원가입 상태 관리
  const [username, setUsername] = useState(''); // 사용자 이름
  const [password, setPassword] = useState(''); // 사용자 비밀번호
  const [error, setError] = useState(''); // 에러 메시지

  const API_BASE = 'http://localhost:5000'; // API 기본 URL

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 방지
    setError(''); // 에러 초기화

    const endpoint = isLogin ? '/api/login' : '/api/register'; // 로그인/회원가입 API 엔드포인트
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, { // API 호출
        method: 'POST', // HTTP 메소드
        headers: {
          'Content-Type': 'application/json', // Content-Type 헤더
        },
        body: JSON.stringify({ username, password }), // 요청 본문
      });

      const data = await response.json(); // 응답 데이터

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      setError('서버 연결 실패');
    }
  };

  // 인증 UI
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? '로그인' : '회원가입'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />
          <button type="submit" className="auth-btn">
            {isLogin ? '로그인 시작하기' : '회원가입 완료'}
          </button>
        </form>
        
        {error && <p className="auth-error">{error}</p>}

        <p className="auth-switch">
          {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <button onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}>
            {isLogin ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;

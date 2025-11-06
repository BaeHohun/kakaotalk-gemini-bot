const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/genai');

// Express 앱 초기화
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.json());

// Gemini API 설정
const apiKey = process.env.gen-lang-client-0065008291
;
if (!apiKey) {
  console.error('에러: API_KEY 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: '너는 천재 기술자야. 모든 질문에 대해 기술적이고 논리적인 관점에서 명확하고 간결하게 답변해줘. 때로는 복잡한 개념을 간단한 비유로 설명해주기도 해.',
});

// 카카오톡 스킬 API 엔드포인트
app.post('/message', async (req, res) => {
  try {
    // 사용자 발화 내용 추출
    const userUtterance = req.body.userRequest?.utterance;

    if (!userUtterance) {
      console.log('수신된 발화가 없습니다.');
      return res.status(400).json({
        version: '2.0',
        template: {
          outputs: [{
            simpleText: { text: '메시지를 입력해주세요.' },
          }],
        },
      });
    }

    console.log(`사용자 발화: ${userUtterance}`);

    // Gemini API 호출
    const result = await model.generateContent(userUtterance);
    const response = await result.response;
    const botResponseText = response.text();

    console.log(`Gemini 응답: ${botResponseText}`);

    // 카카오톡 응답 형식 생성
    const kakaoResponse = {
      version: '2.0',
      template: {
        outputs: [{
          simpleText: { text: botResponseText },
        }],
      },
    };

    // JSON 형식으로 응답 전송
    res.json(kakaoResponse);

  } catch (error) {
    console.error('메시지 처리 중 오류 발생:', error);

    // 오류 발생 시 사용자에게 전송할 응답
    const errorResponse = {
      version: '2.0',
      template: {
        outputs: [{
          simpleText: { text: '죄송합니다. 내부 시스템에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        }],
      },
    };

    res.status(500).json(errorResponse);
  }
});

// 서버 상태 확인용 루트 엔드포인트
app.get('/', (req, res) => {
  res.send('카카오톡 챗봇 서버가 정상적으로 실행 중입니다.');
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

FROM node:18-slim

WORKDIR /app

# package.json 먼저 복사하여 의존성 캐싱
COPY package*.json ./

# 의존성 설치 (Linux 환경)
RUN npm install --legacy-peer-deps

# 소스 코드 복사
COPY . .

# 빌드 실행
CMD ["npm", "run", "build"]

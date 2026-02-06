# API Mimatour com Playwright (Chromium) para scraping real
# Imagem oficial já traz Node + Chromium
FROM mcr.microsoft.com/playwright/js:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
ENV PORT=3000

CMD ["node", "index.js"]

FROM node:18
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY tsconfig.json .
COPY src ./src
RUN npm run build

RUN useradd -ms /bin/bash discordbot
USER discordbot
CMD [ "node", "dist/app.js" ]
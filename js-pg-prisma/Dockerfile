FROM node:16-buster
# Create app directory
WORKDIR /usr/src/app
# Copy package.json & package-lock.json
COPY build/package*.json ./
# Only install the production dependencies
RUN npm install --production --quiet
# Bundle app source code
COPY build .
EXPOSE 3030
ENV NODE_ENV production
CMD ["node", "-r", "dotenv/config", "src/index.js", "dotenv_config_path=./secrets/.env"]
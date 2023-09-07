FROM node:18-alpine as build-stage

WORKDIR /app

COPY . .
RUN yarn install --frozen-lockfile && yarn build && yarn install --production

# Main
FROM node:18-alpine
ENV NODE_ENV='production'
ENV TZ='Asia/Ho_Chi_Minh'

WORKDIR /app
COPY --from=build-stage /app .

EXPOSE 3000
ENTRYPOINT ["node", "dist/main"]

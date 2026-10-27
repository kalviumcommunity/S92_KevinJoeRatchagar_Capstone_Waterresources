FROM node:24-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node server/ ./
RUN mkdir -p /app/uploads && chown node:node /app/uploads

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:5000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

USER node

CMD ["npm", "start"]

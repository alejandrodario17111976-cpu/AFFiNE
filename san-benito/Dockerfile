# Imagen para publicar San Benito en cualquier hosting con Docker (Railway, Render, Fly.io, un VPS…).
# Los datos que cambian (precios, pedidos, clientes, fotos) van a un disco persistente montado en /datos.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATOS_DIR=/datos \
    PORT=3000
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
# La primera vez, los datos iniciales de /app/data se copian solos a /datos
CMD ["npm", "start"]

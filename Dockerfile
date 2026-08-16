# ═══════════════════════════════════════════════════════════════════
# Dockerfile — escapa! Frontend
# Build multi-stage: compilação com Node → servir com nginx
#
# Compatível com: linux/amd64, linux/arm64 (Apple Silicon, k3s nodes)
# Uso local:
#   docker build -t escapa-frontend .
#   docker run -p 8080:80 escapa-frontend
# ═══════════════════════════════════════════════════════════════════

# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Metadados da imagem
LABEL org.opencontainers.image.title="escapa! Frontend"
LABEL org.opencontainers.image.description="Plataforma de turismo de luxo e cursos B2B/B2C"

WORKDIR /app

# Copia apenas os arquivos de manifesto primeiro (melhor aproveitamento de cache)
COPY package.json package-lock.json ./

# Instala dependências de produção e dev (necessário para o build)
# --frozen-lockfile garante reprodutibilidade entre máquinas e na CI
RUN npm ci --frozen-lockfile

# Copia o restante do código-fonte
COPY . .

# Compila a aplicação React (output em /app/dist)
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove a configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração customizada (necessária para SPA com React Router)
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Copia os arquivos compilados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx ouve na porta 80 por padrão
EXPOSE 80

# Healthcheck para k3s/Kubernetes readiness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

# Inicia o nginx em modo foreground (necessário para containers)
CMD ["nginx", "-g", "daemon off;"]

# ---------------------------------
# 1. Build stage
# ---------------------------------
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Build the Strapi admin panel
RUN npm run build

# ---------------------------------
# 2. Production stage
# ---------------------------------
FROM node:22-alpine AS production

WORKDIR /app

# Copy only necessary files for production
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app from build stage
COPY --from=build /app ./

# Ensure the .tmp directory (SQLite DB path) exists
# RUN mkdir -p /app/.tmp

# Expose Strapi’s default port
EXPOSE 1337

# Default environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337
ENV DATABASE_CLIENT=sqlite
ENV DATABASE_FILENAME=/database/data.db

# Mark database as a persistent volume (for local dev or Cloud Run FUSE mount)
VOLUME ["/database"]

# Start Strapi
CMD ["npm", "run", "start"]

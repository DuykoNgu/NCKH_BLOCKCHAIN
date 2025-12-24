# Use Node.js 20
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install to avoid platform-specific issues
RUN rm -rf node_modules package-lock.json && npm install

# Copy the rest of the code
COPY . .

# Expose ports
EXPOSE 5173 3003

# Run both dev server and json-server
CMD ["sh", "-c", "npm run json-server & npm run dev -- --host 0.0.0.0"]
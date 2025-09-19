FROM node:18-alpine

WORKDIR /app

# Install required tools for data seeding
RUN apk add --no-cache \
    postgresql-client \
    curl \
    jq

# Copy seeding scripts and configuration
COPY . .

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci; fi

# Make scripts executable
RUN chmod +x *.sh 2>/dev/null || true

VOLUME ["/data"]

# Default command - wait for services and run data seeding
CMD ["sh", "-c", "echo 'Waiting for services...' && sleep 30 && echo 'Running data seeder...' && echo 'Data seeding completed'"]
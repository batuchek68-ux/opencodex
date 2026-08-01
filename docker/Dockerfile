FROM node:20-bullseye

# Install curl and ca-certificates (for bun installer)
RUN apt-get update && apt-get install -y curl ca-certificates bash

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL_DIR="/root/.bun"
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /workspace

# Copy files (use a shallow copy to speed up build if necessary)
COPY . /workspace

# Install dependencies using bun
RUN /root/.bun/bin/bun install --no-check

# Default command: run tests
CMD ["/root/.bun/bin/bun", "test"]

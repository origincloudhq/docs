# --- builder ---
# Node 20 (not 22) because the site is pinned to Astro 5; see site/README.md.
FROM node:20-bookworm-slim AS builder

WORKDIR /src

COPY site/package.json site/package-lock.json ./site/
RUN cd site && npm ci

# Mermaid diagrams are rendered to SVG at build time, which needs a real
# browser. This is the one meaningful cost of build-time diagrams: ~150MB and
# a minute in the builder stage. The payoff is that the runtime image ships no
# diagram JS at all and the diagram text stays indexable.
RUN cd site && npx playwright install --with-deps chromium

# docs/ is the content tree the site renders: the Astro collection loads it
# from ../docs, outside site/.
COPY docs ./docs
COPY site ./site
# The commit of this repository, served in /version.json next to the source
# commit docs/ came from (cd.yml passes it).
ARG SITE_COMMIT=""
RUN cd site && SITE_COMMIT="${SITE_COMMIT}" npm run build

# --- runtime ---
FROM nginx:1.27-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*
COPY _build/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/site/dist /usr/share/nginx/html

EXPOSE 10080

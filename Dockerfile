# MathLab as a container: build the static site, then serve it with nginx. This is what Coolify builds.
#
#   docker build -t mathlab .
#   docker run --rm -p 8080:80 mathlab        # then open http://localhost:8080/
#
# To put an address in the social-sharing card, build with:
#   docker build --build-arg NEXT_PUBLIC_SITE_URL=https://mathlab.example.com -t mathlab .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_SITE_URL=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# The build writes the site to out/, and verify stops the image from being built if a page is missing in a language.
RUN npm run build && npm run verify

FROM nginx:1.27-alpine
RUN mkdir -p /etc/nginx/snippets
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

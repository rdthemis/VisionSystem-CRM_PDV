# backend/Dockerfile
# Imagem para rodar o backend PHP (API do VisionSystem-CRM_PDV / Cardápio
# Digital) no Railway. Reproduz o mesmo modelo usado localmente
# (README-DEPLOY-LOCAL.md): servidor embutido do PHP + router.php fazendo
# o roteamento manual, só que containerizado e ouvindo na porta que o
# Railway injeta via variável de ambiente $PORT.

FROM php:8.2-cli

# Dependências de sistema + extensões PHP usadas pelo backend:
#   pdo_mysql -> Database.php (PDO/MySQL)
#   mbstring  -> encoding (BematechPrinter, InputValidator etc.)
#   gd        -> upload/redimensionamento de imagens de produto (ImageUploader.php)
#   zip       -> composer / geração de backups
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libwebp-dev \
        libonig-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" pdo pdo_mysql mbstring gd zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . /app

RUN composer install --no-dev --no-interaction --optimize-autoloader --no-progress

# variables_order precisa incluir "E" para o PHP popular $_ENV a partir das
# variáveis de ambiente reais que o Railway injeta no processo. Sem isso,
# Database.php e environment.php (que leem $_ENV['DB_HOST'] etc.) não
# enxergam nada em produção, porque não existe um arquivo .env no container
# — as credenciais vêm como env vars de verdade.
RUN { \
        echo "variables_order = EGPCS"; \
        echo "upload_max_filesize = 10M"; \
        echo "post_max_size = 10M"; \
    } > /usr/local/etc/php/conf.d/railway.ini

RUN mkdir -p /app/logs /app/public/uploads/produtos /app/public/backups

EXPOSE 8000

# Shell form (não exec form) de propósito: precisa expandir $PORT em tempo
# de execução, já que o Railway só define essa variável quando o container
# sobe (não existe em build time).
CMD cd /app/public && php -S 0.0.0.0:${PORT:-8000} -t /app/public router.php

FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Skip apt-get to avoid network/captive-portal failures during builds in restricted networks.
# If you require system packages (libpq-dev, build-essential), install them on the host
# or enable network access for Docker builds.

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

EXPOSE 8011
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn core.wsgi:application --bind 0.0.0.0:8011"]

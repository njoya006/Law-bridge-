#!/bin/bash
# Creates all LawBridge service databases in the shared PostgreSQL instance.
# This script runs automatically on first container start (docker-entrypoint-initdb.d/).
# auth_db is already created by POSTGRES_DB in docker-compose — only create the rest.

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE client_db;
    GRANT ALL PRIVILEGES ON DATABASE client_db TO $POSTGRES_USER;

    CREATE DATABASE lawyer_db;
    GRANT ALL PRIVILEGES ON DATABASE lawyer_db TO $POSTGRES_USER;

    CREATE DATABASE case_db;
    GRANT ALL PRIVILEGES ON DATABASE case_db TO $POSTGRES_USER;

    CREATE DATABASE document_db;
    GRANT ALL PRIVILEGES ON DATABASE document_db TO $POSTGRES_USER;

    CREATE DATABASE notification_db;
    GRANT ALL PRIVILEGES ON DATABASE notification_db TO $POSTGRES_USER;

    CREATE DATABASE payment_db;
    GRANT ALL PRIVILEGES ON DATABASE payment_db TO $POSTGRES_USER;

    CREATE DATABASE calendar_db;
    GRANT ALL PRIVILEGES ON DATABASE calendar_db TO $POSTGRES_USER;

    CREATE DATABASE monitoring_db;
    GRANT ALL PRIVILEGES ON DATABASE monitoring_db TO $POSTGRES_USER;

    CREATE DATABASE search_db;
    GRANT ALL PRIVILEGES ON DATABASE search_db TO $POSTGRES_USER;

    CREATE DATABASE ai_db;
    GRANT ALL PRIVILEGES ON DATABASE ai_db TO $POSTGRES_USER;

    CREATE DATABASE messaging_db;
    GRANT ALL PRIVILEGES ON DATABASE messaging_db TO $POSTGRES_USER;

    CREATE DATABASE library_db;
    GRANT ALL PRIVILEGES ON DATABASE library_db TO $POSTGRES_USER;

    CREATE DATABASE outreach_db;
    GRANT ALL PRIVILEGES ON DATABASE outreach_db TO $POSTGRES_USER;

    CREATE DATABASE network_db;
    GRANT ALL PRIVILEGES ON DATABASE network_db TO $POSTGRES_USER;
EOSQL

echo "All LawBridge databases created."

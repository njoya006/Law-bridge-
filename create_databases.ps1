SET PGPASSWORD=LawBridgePass2024
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_auth;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_client;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_lawyer;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_case;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_document;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_notification;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_payment;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_calendar;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_monitoring;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_search;"
psql -h lawbridge-postgres.cvn0ogw1uqg0.us-east-1.rds.amazonaws.com -U postgres -p 5432 -c "CREATE DATABASE lawbridge_ai_assistant;"


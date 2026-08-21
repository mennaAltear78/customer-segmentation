import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

# Database configuration
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")


# Create database URL
DATABASE_URL = (
    f"postgresql+psycopg2://"
    f"{DB_USER}:{DB_PASSWORD}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


# Create connection
engine = create_engine(DATABASE_URL)


# Test connection
try:

    with engine.connect() as connection:

        print("✅ Database connected successfully!")

        # Test query
        result = connection.execute(
            text("SELECT * FROM customer_transactions;")
        )

        rows = result.fetchall()

        print(f"✅ Number of rows: {len(rows)}")

        for row in rows:
            print(row)


except Exception as e:

    print("❌ Database connection failed!")
    print(e)
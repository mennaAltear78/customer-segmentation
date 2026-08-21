import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# 1. تحميل متغيرات البيئة من ملف .env
load_dotenv()
from app.database.db import Base
from app.models.models import Customer, CustomerTransaction, CustomerRFM
target_metadata = Base.metadata
# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# 2. قراءة الـ DATABASE_URL من ملف .env وتعيينها لـ Alembic
database_url = os.getenv("DATABASE_URL")
if database_url:
    # التعامل مع اختلالات روابط asyncpg أو postgres:// لو وجدت
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. استيراد Base من ملف db الخاص بمشروعك
# (تأكدي من صحة اسم المجلد والملف الذي يحتوي على Base لديك)
from app.database.db import Base 

# 4. ربط target_metadata بـ Base.metadata لتشغيل الـ autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
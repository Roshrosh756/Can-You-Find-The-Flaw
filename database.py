import os
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# PostgreSQL only. Set DATABASE_URL in your environment, e.g.:
#   postgresql://user:password@host:5432/dbname
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. This app requires a PostgreSQL connection "
        "string, e.g. postgresql://user:password@host:5432/dbname"
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ----- Models used by the Part 3 SQLi challenge -----
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    price = Column(Integer)

class FlagTable(Base):
    __tablename__ = "flag_table"
    id = Column(Integer, primary_key=True)
    flag = Column(String)

# Create all tables
Base.metadata.create_all(bind=engine)

# ----- Insert sample data if missing -----
def init_challenge_data():
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            db.add_all([
                Product(id=1, name='Laptop', price=1000),
                Product(id=2, name='Phone', price=500),
            ])
            db.add(FlagTable(flag='flag{sqli_union_injection}'))
            db.commit()
    finally:
        db.close()

init_challenge_data()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""Creates one demo user per role. Run once: python seed_db.py"""
from database import Base, engine, SessionLocal
import models
import auth

Base.metadata.create_all(bind=engine)
db = SessionLocal()

demo_users = [
    ("Dr. Alice Carter", "doctor@healthforecast.ai", "doctor123", models.RoleEnum.doctor),
    ("Hospital Admin Bob", "admin@healthforecast.ai", "admin123", models.RoleEnum.hospital_admin),
    ("Researcher Carla Diaz", "researcher@healthforecast.ai", "research123", models.RoleEnum.researcher),
    ("System Admin Dev", "sysadmin@healthforecast.ai", "sysadmin123", models.RoleEnum.system_admin),
]

for name, email, pw, role in demo_users:
    if not db.query(models.User).filter(models.User.email == email).first():
        db.add(models.User(
            full_name=name, email=email,
            hashed_password=auth.hash_password(pw), role=role,
        ))
        print(f"Created {role.value}: {email} / {pw}")
    else:
        print(f"Already exists: {email}")

db.commit()
db.close()

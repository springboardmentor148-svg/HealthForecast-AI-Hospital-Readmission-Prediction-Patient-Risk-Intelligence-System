from security import hash_password
from security import verify_password

password = "Admin123"

hashed = hash_password(password)

print("Original :", password)
print("Hashed :", hashed)

print(
    verify_password(
        "Admin123",
        hashed
    )
)
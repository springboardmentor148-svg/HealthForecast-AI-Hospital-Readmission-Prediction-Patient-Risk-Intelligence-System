import hashlib
import hmac
import secrets

from sqlalchemy.orm import Session

from app.models.user import User


# ============================================================
# ALLOWED ROLES
# ============================================================

ALLOWED_ROLES = [

    "doctor",

    "hospital_admin",

    "researcher",

    "system_admin"

]


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(

    password: str

) -> str:

    if not password:

        raise ValueError(

            "Password cannot be empty."

        )


    # Generate random salt
    salt = secrets.token_bytes(

        16

    )


    # Number of PBKDF2 iterations
    iterations = 600_000


    # Generate password hash
    password_hash = hashlib.pbkdf2_hmac(

        "sha256",

        password.encode(

            "utf-8"

        ),

        salt,

        iterations

    )


    # Store algorithm, iterations, salt and hash
    return (

        "pbkdf2_sha256$"

        + str(

            iterations

        )

        + "$"

        + salt.hex()

        + "$"

        + password_hash.hex()

    )


# ============================================================
# PASSWORD VERIFICATION
# ============================================================

def verify_password(

    plain_password: str,

    stored_password: str

) -> bool:

    try:

        (

            algorithm,

            iterations,

            salt_hex,

            hash_hex

        ) = stored_password.split(

            "$"

        )


        # Verify algorithm
        if algorithm != "pbkdf2_sha256":

            return False


        iterations = int(

            iterations

        )


        salt = bytes.fromhex(

            salt_hex

        )


        stored_hash = bytes.fromhex(

            hash_hex

        )


        # Hash entered password
        calculated_hash = hashlib.pbkdf2_hmac(

            "sha256",

            plain_password.encode(

                "utf-8"

            ),

            salt,

            iterations

        )


        # Secure comparison
        return hmac.compare_digest(

            calculated_hash,

            stored_hash

        )


    except Exception:

        return False


# ============================================================
# GET USER BY EMAIL
# ============================================================

def get_user_by_email(

    db: Session,

    email: str

):

    """
    Find a user by email.
    """

    email = email.strip().lower()


    user = (

        db.query(

            User

        )

        .filter(

            User.email == email

        )

        .first()

    )


    return user


# ============================================================
# CREATE USER
# ============================================================

def create_user(

    db: Session,

    full_name: str,

    email: str,

    password: str,

    role: str

):

    """
    Create a new user.
    """

    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    full_name = full_name.strip()

    email = email.strip().lower()

    role = role.strip().lower()


    # --------------------------------------------------------
    # VALIDATE FULL NAME
    # --------------------------------------------------------

    if not full_name:

        raise ValueError(

            "Full name is required."

        )


    # --------------------------------------------------------
    # VALIDATE EMAIL
    # --------------------------------------------------------

    if not email:

        raise ValueError(

            "Email is required."

        )


    # --------------------------------------------------------
    # VALIDATE PASSWORD
    # --------------------------------------------------------

    if not password:

        raise ValueError(

            "Password is required."

        )


    # --------------------------------------------------------
    # VALIDATE ROLE
    # --------------------------------------------------------

    if role not in ALLOWED_ROLES:

        raise ValueError(

            "Invalid role. "

            "Allowed roles are: "

            + ", ".join(

                ALLOWED_ROLES

            )

        )


    # --------------------------------------------------------
    # CHECK EXISTING USER
    # --------------------------------------------------------

    existing_user = get_user_by_email(

        db,

        email

    )


    if existing_user:

        raise ValueError(

            "A user with this email already exists."

        )


    # --------------------------------------------------------
    # HASH PASSWORD
    # --------------------------------------------------------

    hashed_password = hash_password(

        password

    )


    # --------------------------------------------------------
    # CREATE USER OBJECT
    # --------------------------------------------------------

    user = User(

        full_name=full_name,

        email=email,

        hashed_password=hashed_password,

        role=role

    )


    # --------------------------------------------------------
    # SAVE TO DATABASE
    # --------------------------------------------------------

    try:

        db.add(

            user

        )

        db.commit()

        db.refresh(

            user

        )

    except Exception:

        db.rollback()

        raise


    return user


# ============================================================
# AUTHENTICATE USER
# ============================================================

# ============================================================
# AUTHENTICATE USER
# ============================================================

def authenticate_user(
    db: Session,
    email: str,
    password: str,
    role: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        return None

    # Check selected login role
    if user.role != role.strip().lower():
        return None

    # Verify password
    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    return user
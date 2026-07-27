"""
models/user.py
Encapsulates data access patterns and cryptographic validation rules for 
User data structures.
"""

from database.db import get_db
from flask_bcrypt import generate_password_hash, check_password_hash

class User:
    """Business logic and utility wrapper for managing user identities."""

    @staticmethod
    def create(name, email, plain_password):
        """
        Creates a new user record with a safely hashed password.
        
        Args:
            name (str): Full name of the clinician/user.
            email (str): Unique email address.
            plain_password (str): Raw text password to be hashed.
            
        Returns:
            int: The unique identifier (id) of the newly created user record.
        """
        db = get_db()
        cursor = db.cursor()
        
        # Enforce clean lowercase storage for standard email matching
        clean_email = email.strip().lower()
        
        # Generate secure cryptographic salt and password hash
        hashed_password = generate_password_hash(plain_password).decode('utf-8')
        
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?);",
            (name.strip(), clean_email, hashed_password)
        )
        db.commit()
        return cursor.lastrowid

    @staticmethod
    def find_by_email(email):
        """
        Retrieves a user profile by email address.
        
        Args:
            email (str): Target email query parameter.
            
        Returns:
            sqlite3.Row: The database row object if matched, otherwise None.
        """
        db = get_db()
        clean_email = email.strip().lower()
        
        row = db.execute(
            "SELECT * FROM users WHERE email = ?;", 
            (clean_email,)
        ).fetchone()
        
        return row

    @staticmethod
    def find_by_id(user_id):
        """
        Retrieves a user profile by its unique primary key ID.
        
        Args:
            user_id (int): Target primary key user query identifier.
            
        Returns:
            dict: Structured user data excluding password hash, or None.
        """
        db = get_db()
        row = db.execute(
            "SELECT id, name, email, created_at FROM users WHERE id = ?;", 
            (user_id,)
        ).fetchone()
        
        if row:
            return dict(row)
        return None

    @staticmethod
    def verify_password(stored_hash, plain_password):
        """
        Validates an incoming plain-text password against a stored cryptographic hash.
        
        Args:
            stored_hash (str): The hashed string fetched from the database layer.
            plain_password (str): The raw text password input by the user.
            
        Returns:
            bool: True if the password matches the hash, False otherwise.
        """
        return check_password_hash(stored_hash, plain_password)
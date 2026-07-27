"""
database/db.py
Handles foundational raw SQLite initializations, database connection pools, 
and database schema synchronization.
"""

import sqlite3
import os
from flask import current_app, g

def get_db():
    """
    Establishes or pulls a thread-safe database connection for the current request context.
    Ensures column row factories are utilized for clean key-value access.
    """
    if 'db' not in g:
        db_path = current_app.config['DATABASE_PATH']
        
        # Verify target folder path exists prior to initialization
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        g.db = sqlite3.connect(
            db_path,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        # Enable accessing fields by string keys instead of index tuples
        g.db.row_factory = sqlite3.Row
        
        # Enforce foreign key constraint checks within SQLite runtime instances
        g.db.execute("PRAGMA foreign_keys = ON;")
        
    return g.db

def close_db(e=None):
    """Closes the current thread database connection if it exists."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """
    Performs transactional structural table setups for both system profiles 
    and historical telemetry predictions.
    """
    db = get_db()
    cursor = db.cursor()
    
    # 1. Structural schema layout for User Profiles
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    
    # 2. Structural schema layout for Patient Inference Audits
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prediction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            prediction TEXT NOT NULL,
            probability REAL NOT NULL,
            input_data TEXT NOT NULL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    ''')
    
    db.commit()

def init_app(app):
    """Registers application teardown and CLI structural context methods."""
    app.teardown_appcontext(close_db)
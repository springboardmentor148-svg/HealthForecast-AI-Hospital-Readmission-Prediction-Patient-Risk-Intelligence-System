"""
models/prediction.py
Handles data persistence patterns and retrieval matrices for patient risk evaluation audits.
"""

import json
from database.db import get_db

class PredictionHistory:
    """Encapsulates transactional interactions for the prediction telemetry database layer."""

    @staticmethod
    def create(user_id, prediction_label, probability, input_features):
        """
        Persists a completed readmission evaluation audit trace to the database.
        
        Args:
            user_id (int): Foreign key identifier of the clinician logging the transaction.
            prediction_label (str): Result classification label (e.g., "High Risk").
            probability (float): Confident probability value score from the model.
            input_features (dict): Structural dictionary payload containing raw patient metrics.
            
        Returns:
            int: The primary key identifier of the logged audit trace row.
        """
        db = get_db()
        cursor = db.cursor()
        
        # Serialize the raw feature tracking dictionary into a compact JSON string string
        serialized_inputs = json.dumps(input_features)
        
        cursor.execute(
            """
            INSERT INTO prediction_history (user_id, prediction, probability, input_data)
            VALUES (?, ?, ?, ?);
            """,
            (user_id, prediction_label, float(probability), serialized_inputs)
        )
        db.commit()
        return cursor.lastrowid

    @staticmethod
    def get_by_user_id(user_id):
        """
        Retrieves historical prediction logs for a specific user to populate dashboards.
        
        Args:
            user_id (int): Target tracking user identity query parameter.
            
        Returns:
            list: A chronologically sorted array list of dictionary row records.
        """
        db = get_db()
        
        rows = db.execute(
            """
            SELECT id, prediction, probability, input_data, date 
            FROM prediction_history 
            WHERE user_id = ? 
            ORDER BY date DESC;
            """,
            (user_id,)
        ).fetchall()
        
        history_records = []
        for row in rows:
            record = dict(row)
            # Deserialize the stored string back into an interactive dictionary object
            try:
                record['input_data'] = json.loads(record['input_data'])
            except (json.JSONDecodeError, TypeError):
                record['input_data'] = {}
            history_records.append(record)
            
        return history_records
"""Quick script to verify database structure"""
import sqlite3
from pathlib import Path

db_path = Path("data/feedback.db")

if not db_path.exists():
    print(f"❌ Database not found at {db_path}")
else:
    print(f"✅ Database found at {db_path}")
    print(f"   Size: {db_path.stat().st_size / 1024:.2f} KB")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"\n📊 Tables: {', '.join(tables)}")
    
    # Check predictions table
    cursor.execute("SELECT COUNT(*) FROM predictions")
    pred_count = cursor.fetchone()[0]
    print(f"   predictions: {pred_count} rows")
    
    # Check feedback table
    cursor.execute("SELECT COUNT(*) FROM feedback")
    feedback_count = cursor.fetchone()[0]
    print(f"   feedback: {feedback_count} rows")
    
    # Show sample prediction
    if pred_count > 0:
        cursor.execute("""
            SELECT request_id, predicted_disease_name, predicted_probability, 
                   confidence_status, timestamp
            FROM predictions 
            ORDER BY timestamp DESC 
            LIMIT 1
        """)
        row = cursor.fetchone()
        print(f"\n📝 Latest prediction:")
        print(f"   Request ID: {row[0]}")
        print(f"   Disease: {row[1]}")
        print(f"   Probability: {row[2]:.2%}")
        print(f"   Confidence: {row[3]}")
        print(f"   Timestamp: {row[4]}")
    
    conn.close()
    print("\n✅ Database structure verified!")

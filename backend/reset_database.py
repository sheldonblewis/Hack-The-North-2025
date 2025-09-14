#!/usr/bin/env python3
"""
Script to reset/clear the database collections for fresh start
"""
import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def reset_database():
    """Reset all collections in the database"""

    # Get MongoDB connection string
    mongodb_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME", "ai-redteam")

    if not mongodb_uri:
        print("❌ MONGODB_URI not found in environment variables")
        return False

    try:
        # Connect to MongoDB
        print("🔄 Connecting to MongoDB...")
        client = MongoClient(mongodb_uri)
        db = client[db_name]

        # Collections to reset
        collections = ["agents", "attack_results", "simulation_runs"]

        print(f"📊 Database: {db_name}")

        for collection_name in collections:
            collection = db[collection_name]

            # Count documents before deletion
            count_before = collection.count_documents({})

            if count_before > 0:
                # Delete all documents
                result = collection.delete_many({})
                print(f"🗑️  Cleared {collection_name}: {result.deleted_count} documents deleted")
            else:
                print(f"✅ {collection_name}: Already empty")

        print("\n✅ Database reset completed successfully!")
        print("🔄 You can now restart your backend server for a clean slate.")

        return True

    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 AI Red-Team Database Reset Tool")
    print("=" * 40)

    # Ask for confirmation
    confirm = input("⚠️  This will DELETE ALL DATA in the database. Continue? (yes/no): ")

    if confirm.lower() in ['yes', 'y']:
        success = reset_database()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        print("❌ Operation cancelled by user")
        sys.exit(1)
#!/usr/bin/env python3

import json
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# ── Configuration ──────────────────────────────────────────────
MONGO_URI = "mongodb+srv://nikola:nikolaminchev@foodmanagement.ylemseu.mongodb.net/?appName=foodmanagement"
DATABASE_NAME = "test"
OUTPUT_DIR = "./mongo_exports"
# ───────────────────────────────────────────────────────────────


class MongoEncoder(json.JSONEncoder):
    """Handle MongoDB-specific types like ObjectId and datetime."""

    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def export_database():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI)
    client.admin.command("ping")
    print("Connection successful!\n")

    db = client[DATABASE_NAME]

    COLLECTIONS = ["daydeliveries", "topmeals", "unpaids", "users", "weeklymenu"]

    full_export = {}

    for collection_name in COLLECTIONS:
        documents = list(db[collection_name].find())
        full_export[collection_name] = documents
        print(f"  ✔ {collection_name}: {len(documents)} document(s)")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(OUTPUT_DIR, f"foodmanagement_{timestamp}.json")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(full_export, f, cls=MongoEncoder, indent=2, ensure_ascii=False)

    print(f"\nExport complete → {output_file}")
    client.close()


if __name__ == "__main__":
    export_database()

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
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def export_unpaids():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI)
    client.admin.command("ping")
    print("Connection successful!\n")

    db = client[DATABASE_NAME]
    documents = list(db["unpaids"].find())

    print(f"  ✔ unpaids: {len(documents)} document(s) found")

    export_data = {"unpaids": documents}

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(OUTPUT_DIR, f"unpaids_{timestamp}.json")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(export_data, f, cls=MongoEncoder, indent=2, ensure_ascii=False)

    print(f"\nExport complete → {output_file}")
    client.close()


if __name__ == "__main__":
    export_unpaids()

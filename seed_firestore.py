
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

def load_json(filepath):
    import json
    # Explicit UTF-8 — Windows defaults to cp1252 which mangles ↔ and other unicode.
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def seed_collection(db, collection_name, data_list):
    collection_ref = db.collection(collection_name)
    batch = db.batch()
    count = 0
    for item in data_list:
        doc_id = item.get('id')
        if doc_id:
            doc_ref = collection_ref.document(doc_id)
            # Remove the 'id' field if you want, but keeping it is fine
            batch.set(doc_ref, item)
            count += 1
            if count % 500 == 0:
                batch.commit()
                batch = db.batch()
    
    if count % 500 != 0:
        batch.commit()
    print(f"Seeded {count} documents into collection '{collection_name}'.")

def main():
    from dotenv import load_dotenv
    load_dotenv()
    
    FIREBASE_KEY_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-key.json')
    DB_ID = os.getenv('FIRESTORE_DATABASE', '(default)')

    # Initialize Firebase Admin SDK
    cred = credentials.Certificate(FIREBASE_KEY_PATH)
    app = firebase_admin.initialize_app(cred)
    db = firestore.client(database_id=DB_ID)
    print(f"Targeting Firestore database: {DB_ID}")

    print("Firebase initialized. Starting seeding process...")

    data_dir = 'seed_data'

    # biggerset.json is the expanded actor set (mentors/startups/partners). It
    # replaces actors.json when USE_BIGGERSET=1 is set so we can demo the system
    # under a larger ecosystem.
    use_bigger = os.getenv('USE_BIGGERSET') == '1'
    actor_file = 'biggerset.json' if use_bigger else 'actors.json'
    print(f"Actor source: {actor_file}")
    collections_to_seed = [
        ('actors', actor_file),
        ('programmes', 'programmes.json'),
        ('linkages', 'linkages.json'),
        ('actions', 'actions.json'),
    ]

    # Reset to a clean demo state: nuke every collection we're about to re-seed.
    # This wipes runtime-created docs (auto-generated match/carryover linkages,
    # engine-run actions, etc.) so the seed file is the single source of truth.
    print("Wiping collections for a clean reseed…")
    for col, _ in collections_to_seed:
        batch = db.batch()
        n = 0
        for doc in db.collection(col).stream():
            batch.delete(doc.reference)
            n += 1
            if n % 400 == 0:
                batch.commit()
                batch = db.batch()
        if n % 400 != 0:
            batch.commit()
        print(f"  cleared {n} from {col}")

    for collection_name, filename in collections_to_seed:
        filepath = os.path.join(data_dir, filename)
        if os.path.exists(filepath):
            try:
                data = load_json(filepath)
                seed_collection(db, collection_name, data)
            except Exception as e:
                print(f"Error seeding {collection_name} from {filepath}: {e}")
        else:
            print(f"File not found: {filepath}")

    print("Seeding completed.")

if __name__ == '__main__':
    main()

import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

def load_json(filepath):
    with open(filepath, 'r') as f:
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
    # Initialize Firebase Admin SDK
    cred = credentials.Certificate('firebase-key.json')
    app = firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("Firebase initialized. Starting seeding process...")

    data_dir = os.path.join('venv', 'data')

    collections_to_seed = [
        ('actors', 'actors.json'),
        ('programmes', 'programmes.json'),
        ('linkages', 'linkages.json'),
        ('actions', 'actions.json')
    ]

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

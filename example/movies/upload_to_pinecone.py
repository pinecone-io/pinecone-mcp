import pandas as pd
import json
from mcp.pinecone import upsert

# Read the CSV file
df = pd.read_csv('example/movies/IMDb Movies Dataset.csv')

# Take the first 100 records
df = df.head(100)

# Prepare the data for Pinecone
records = []
for idx, row in df.iterrows():
    # Create a meaningful text representation of the movie
    text = f"Title: {row['title']} ({row['year']})\n"
    text += f"Genre: {row['genre']}\n"
    if isinstance(row['description'], str):
        text += f"Description: {row['description']}\n"
    if isinstance(row['director'], str):
        text += f"Director: {row['director']}\n"
    if isinstance(row['actors'], str):
        text += f"Actors: {row['actors']}\n"

    # Create metadata
    metadata = {
        "title": str(row['title']),
        "year": str(row['year']),
        "genre": str(row['genre']),
        "imdb_id": str(row['imdb_title_id'])
    }

    # Create record
    record = {
        "id": str(row['imdb_title_id']),
        "text": text,
        "metadata": metadata
    }
    records.append(record)

print(f"Prepared {len(records)} records for upload")

# Upload records in batches
BATCH_SIZE = 50
for i in range(0, len(records), BATCH_SIZE):
    batch = records[i:i + BATCH_SIZE]
    print(f"\nUploading batch {i//BATCH_SIZE + 1} ({len(batch)} records)...")

    # Create the upsert data
    upsert_data = {
        "indexName": "imdb-movies",
        "namespace": "movies",
        "data": batch
    }

    # Call mcp_pinecone_upsert
    response = upsert(upsert_data)
    print(f"Batch {i//BATCH_SIZE + 1} upload response:", response)
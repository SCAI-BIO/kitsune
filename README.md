# <img src="client/src/assets/logo_white.svg" alt="Logo" width="100"/> Kitsune ![GitHub Release](https://img.shields.io/github/v/release/SCAI-BIO/kitsune)

_Kitsune_ is a next-generation data steward and harmonization tool. Building on the legacy of systems like Usagi, Kitsune leverages LLM embeddings to intelligently map semantically similar terms even when their string representations differ substantially. This results in more robust data harmonization and improved performance in real-world scenarios.

(Formerly: INDEX – the Intelligent Data Steward Toolbox)

## Features

- **LLM Embeddings:** Uses state-of-the-art language models to capture semantic similarity.
- **Intelligent Mapping:** Improves over traditional string matching with context-aware comparisons.
- **Extensible:** Designed for integration into modern data harmonization pipelines.

## Installation

Run the frontend client, API, vector database and local embedding model using the local `docker-compose` file:

```bash
docker-compose -f docker-compose.local.yaml up
```

Once running, you can access the frontend on [localhost:4200](localhost:4200)

## Ontology Import via API

The API supports multiple methods for importing ontology (terminology) data into the system. Depending on your source and requirements, you can choose from the following options:

1. Importing from OLS (Pre-integrated):

   The API is integrated with the [Ontology Lookup Service (OLS)](https://www.ebi.ac.uk/ols4/ontologies), allowing you to import any ontology from their catalog.

   ```bash
   curl -X 'PUT' \
   '{api_url}/imports/terminology?terminology_id={terminology_id}&model={vectorizer_model}' \
   -H 'accept: application/json'
   ```

   - `terminology_id` (**required**): The ID of the ontology you want to import (e.g., `hp`, `efo`, `chebi`).
   - `vectorizer_model` (_optional_): The vectorizer model to use for generating embeddings.

   Example:

   ```bash
   curl -X 'PUT' \
    '{api_url}/imports/terminology?terminology_id=hp' \
    -H 'accept: application/json'
   ```

1. Importing SNOMED CT:

   - SNOMED CT can be imported using a shortcut endpoint. This is equivalent to using the OLS integration with `terminology_id=snomed`, but provides a cleaner interface.

   ```bash
   curl -X 'PUT' \
    '{api_url}/imports/terminology/snomed?model={vectorizer_model}' \
    -H 'accept: application/json'
   ```

   Parameters:

   - `vectorizer_model` (_optional_): The vectorizer model to be used for generating embeddings.

1. Importing Your Own Ontology (JSONL Files):

   For full flexibility, you can upload your own ontology using `.jsonl` (JSON Lines) files. This allows you to import:

   - Terminologies (namespaces)
   - Concepts (terms within the terminology)
   - Mappings (links between embeddings and existing concepts)

   > ⚠️ The objects should be imported in the following order:
   >
   > 1. "Terminology"
   > 2. "Concepts"
   > 3. "Mappings"

   ```bash
   curl -X 'PUT' \
   '{api_url}/imports/jsonl?object_type={object_type}' \
   -H 'accept: application/json' \
   -H 'Content-Type: multipart/form-data' \
   -F 'file=@{your_file}.jsonl'
   ```

   - `object_type`(**required**): One of `terminology`, `concept`, or `mapping`
   - `file` (**required**): The `.jsonl` file to be uploaded (multipart/from-data)

## JSONL File Structure

Each line in your `.jsonl` file must represent a single object. The structures for Terminology, Concept, and Mapping are described below.

### Terminology

Represents an ontology namescape.

Attributes:

- `id`: Abbreviation of the terminology.
- `name`: Full name of the terminology.

```json
{
  "id": "OHDSI",
  "name": "Observational Health Data Sciences and Informatics"
}
```

### Concept

Represents an individual entry within a terminology.

Attributes:

- `concept_identifier`: Concept entry ID within the terminology.
- `pref_label`: Preferred label for the entry.
- `terminology_id`: Reference to the terminology it belongs to.

```json
{
  "concept_identifier": "OHDSI:45756805",
  "pref_label": "Pediatric Cardiology",
  "terminology_id": "OHDSI"
}
```

### Mapping

Links a textual description to a concept.

Attributes:

- `text`: Description of the associated concept, or `pref_label` if the description is missing.
- `concept_identifier`: Reference to the associated concept.

```json
{
  "text": "Pediatric Cardiology",
  "concept_identifier": "OHDSI:45756805"
}
```

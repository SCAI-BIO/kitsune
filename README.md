# <img src="client/public/logo_white.svg" alt="Logo" width="100"/> Kitsune

[![DOI](https://zenodo.org/badge/722907753.svg)](https://doi.org/10.5281/zenodo.16881095) ![tests](https://github.com/SCAI-BIO/kitsune/actions/workflows/python-tests.yml/badge.svg) ![tests](https://github.com/SCAI-BIO/kitsune/actions/workflows/frontend-tests.yml/badge.svg) ![GitHub Release](https://img.shields.io/github/v/release/SCAI-BIO/kitsune)

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
   curl -X 'POST' \
   '{api_url}/imports/ols/{ontology_id}' \
   -H 'accept: application/json'
   ```

   - `ontology_id` (**required**): The ID of the ontology you want to import (e.g., `hp`, `efo`, `chebi`).

   Example:

   ```bash
   curl -X 'POST' \
    '{api_url}/imports/ols/snomed' \
    -H 'accept: application/json'
   ```

2. Importing Your Own Ontology (JSONL Files):

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
   curl -X 'POST' \
   '{api_url}/imports/jsonl?object_type={object_type}&generate_embedding=false' \
   -H 'accept: application/json' \
   -H 'Content-Type: multipart/form-data' \
   -F 'file=@{your_file}.jsonl'
   ```

   - `object_type` (**required**): One of `terminology`, `concept`, or `mapping`
   - `generate_embeddings` (_optional_): Boolean flag (`true` or `false`). If `true`, the API will automatically compute embeddings for mappings on the fly using the configured vectorizer. Defaults to `false`.
   - `file` (**required**): The `.jsonl` file to be uploaded (multipart/from-data)

## JSONL File Structure

Each line in your `.jsonl` file must represent a single object. The structures for Terminology, Concept, and Mapping are described below.

### Terminology

Represents an ontology namescape.

Attributes:

- `short_name`: Abbreviation of the terminology.
- `name`: Full name of the terminology.

```json
{
  "short_name": "OHDSI",
  "name": "Observational Health Data Sciences and Informatics"
}
```

### Concept

Represents an individual entry within a terminology.

Attributes:

- `concept_identifier`: Concept entry ID within the terminology.
- `pref_label`: Preferred label for the entry.
- `terminology_short_name`: Reference to the terminology it belongs to.

```json
{
  "concept_identifier": "OHDSI:45756805",
  "pref_label": "Pediatric Cardiology",
  "terminology_short_name": "OHDSI"
}
```

### Mapping

Links a textual description to a concept.

**Note on Embeddings**: If you call the import endpoint with `generate_embeddings=true`, the `embedding` and `vectorizer` fields can be omitted. If `generate_embeddings=false` (the default), both fields are strictly required.

Attributes:

- `text`: Description of the associated concept, or `pref_label` if the description is missing.
- `concept_identifier`: Reference to the associated concept.
- `embedding` (_conditionally required_): The pre-calculated vector array for the text.
- `vectorizer` (_conditionally required_): The name of the model used to generate the embedding.

```json
{
  "text": "Pediatric Cardiology",
  "concept_identifier": "OHDSI:45756805",
  "embedding": [0.012, -0.045, 0.887, ...],
  "vectorizer": "nomic-embed-text"
}
```

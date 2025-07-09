# Client

- [Client](#client)
  - [Introduction](#introduction)
  - [Tutorial](#tutorial)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Starting the Frontend Locally](#starting-the-frontend-locally)
      - [via Angular CLI](#via-angular-cli)
      - [via Docker](#via-docker)
    - [Adjusting API](#adjusting-api)

## Introduction

This repository contains the frontend code for the Kitsune web application. It allows users to find the closest semantic match in various ontologies via query search or cohort dictionary upload. Users can aslo visualize the Common Data Model of Healthy Living in a table view or as a chord diagram.

## Tutorial

For a detailed guide on using Angular, refer to the official [Angular Tutorial](https://angular.dev/tutorial).

## Requirements

- Angular 20.x.x ([Installation Guide](https://angular.dev/installation))
- Node.js ≥ 20.11.1 ([Download](https://nodejs.org/en/download/package-manager))
- TypeScript ≥ 5.8.0

## Installation

Install the project dependencies:

```bash
npm install
```

## Usage

### Starting the Frontend Locally

#### via Angular CLI

You can start a local development server using the Angular CLI. You can access the web application on [localhost:4200](http://localhost:4200):

```bash
ng serve
```

#### via Docker

You can deploy a local version of the web application via docker. To build the Docker container locally:

```bash
docker build -t ghcr.io/scai-bio/kitsune/client:latest .
```

After building the image, you can start the container and access the Kitsune web application at [localhost:8080](http://localhost:8080/):

```bash
docker run -p 8080:80 ghcr.io/scai-bio/kitsune/client:latest
```

### Adjusting API

By default, Kitsune expects an application programming interface (API) running at http://localhost:5000. The API requires a Weaviate database, which also needs to be running locally or hosted via Docker. We provide a hosted API instance for our deployed database at [https://api.kitsune.scai.fraunhofer.de](https://api.kitsune.scai.fraunhofer.de).

To use the public API, you need to replace the API URL in the appropriate environment file based on your deployment method.

- **Angular CLI**: Edit [environment.ts](./src/environments/environment.ts) and replace `'http://localhost:5000'` with `'https://api.kitsune.scai.fraunhofer.de'`.
- **Docker**: Edit [environment.development.ts](./src/environments/environment.development.ts) and replace `'http://localhost:5000'` with `'https://api.kitsune.scai.fraunhofer.de'`.

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExternalLinkService {
  private athenaBaseLink = 'https://athena.ohdsi.org/search-terms/terms';
  private efoBaseIri = 'http://www.ebi.ac.uk/efo';
  private olsBaseIri = 'http://purl.obolibrary.org/obo';
  private olsBaseLink = 'https://www.ebi.ac.uk/ols/ontologies';
  private sioBaseIri = 'http://semanticscience.org/resource';
  private snomedBaseIri = 'http://snomed.info/id';

  getAthenaLink(termId: string) {
    if (!termId) return '';
    return `${this.athenaBaseLink}/${termId}`;
  }

  getOlsLink(termId: string) {
    if (!termId || !termId.includes(':')) return '';

    const [ontology, id] = termId.split(':');
    const ontologyLower = ontology.toLowerCase();
    let iri: string;

    switch (ontology.toUpperCase()) {
      case 'EFO':
        iri = `${this.efoBaseIri}/${ontology}_${id}`;
        break;
      case 'SNOMED':
        iri = `${this.snomedBaseIri}/${id}`;
        break;
      case 'SIO':
        iri = `${this.sioBaseIri}/${ontology}_${id}`;
        break;
      default:
        iri = `${this.olsBaseIri}/${ontology}_${id}`;
    }
    const encodedUri = encodeURIComponent(iri);
    return `${this.olsBaseLink}/${ontologyLower}/terms?iri=${encodedUri}`;
  }
}

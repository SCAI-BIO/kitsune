import { Injectable } from '@angular/core';

type IriBuilder = (prefix: string, id: string) => string;

@Injectable({
  providedIn: 'root',
})
export class ExternalLinkService {
  private readonly athenaBaseLink = 'https://athena.ohdsi.org/search-terms/terms';
  private readonly olsBaseLink = 'https://www.ebi.ac.uk/ols/ontologies';
  private readonly iriBuilders: Record<string, IriBuilder> = {
    EFO: (prefix, id) => `http://www.ebi.ac.uk/efo/${prefix}_${id}`,
    SNOMED: (_, id) => `http://snomed.info/id/${id}`,
    SIO: (prefix, id) => `http://semanticscience.org/resource/${prefix}_${id}`,
  };
  private readonly defaultIriBuilder: IriBuilder = (prefix, id) =>
    `http://purl.obolibrary.org/obo/${prefix}_${id}`;

  getAthenaLink(termId: string) {
    if (!termId) return '';
    const cleanId = termId.replace(/^OHDSI:/, '');
    return `${this.athenaBaseLink}/${cleanId}`;
  }

  getOlsLink(termId: string) {
    if (!termId) return '';

    const colonIndex = termId.indexOf(':');
    if (colonIndex === -1) return '';

    const ontology = termId.substring(0, colonIndex);
    const id = termId.substring(colonIndex + 1);

    const prefixUpper = ontology.toUpperCase();
    const builder = this.iriBuilders[prefixUpper] ?? this.defaultIriBuilder;

    const iri = builder(prefixUpper, id);
    const encodedUri = encodeURIComponent(iri);

    return `${this.olsBaseLink}/${ontology.toLowerCase()}/terms?iri=${encodedUri}`;
  }
}

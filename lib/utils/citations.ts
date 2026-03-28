export interface CitationMeta {
  type: string;
  label: string;
  externalUrl: string | null;
  internalRoute: string;
}

export function getExternalUrl(
  sourceType: string,
  record: Record<string, unknown>
): string | null {
  const str = (val: unknown): string | null =>
    typeof val === "string" ? val : null;

  switch (sourceType) {
    case "fcc_filing": {
      const url = str(record.source_url);
      if (url) return url;
      const fileNum = str(record.file_number);
      if (fileNum) {
        return `https://apps.fcc.gov/oetcf/ibfs/query/detail.cfm?id=${encodeURIComponent(fileNum)}`;
      }
      return null;
    }
    case "patent": {
      const patNum = str(record.patent_number);
      if (patNum) {
        const digits = patNum.replace(/[^0-9A-Za-z]/g, "");
        return `https://patents.google.com/patent/US${digits}`;
      }
      return null;
    }
    case "contract": {
      const contractNum = str(record.contract_number);
      if (contractNum) {
        return `https://www.usaspending.gov/search/?hash=${encodeURIComponent(contractNum)}`;
      }
      return "https://www.usaspending.gov/search/";
    }
    case "news": {
      return str(record.url);
    }
    case "company": {
      const name = str(record.name);
      if (name) {
        return `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(name)}&action=getcompany`;
      }
      return null;
    }
    case "orbital": {
      return "https://www.space-track.org/";
    }
    case "sec": {
      const docUrl = str(record.document_url);
      if (docUrl) return docUrl;
      const accession = str(record.accession_number);
      if (accession) {
        return `https://www.sec.gov/Archives/edgar/data/${accession.replace(/-/g, "/")}`;
      }
      return null;
    }
    default:
      return null;
  }
}

export function getInternalRoute(
  sourceType: string,
  sourceId: string
): string {
  switch (sourceType) {
    case "fcc_filing":
      return `/fcc?highlight=${sourceId}`;
    case "patent":
      return `/patents?highlight=${sourceId}`;
    case "contract":
      return `/contracts?highlight=${sourceId}`;
    case "news":
      return `/news?highlight=${sourceId}`;
    case "company":
      return `/entities`;
    case "orbital":
      return `/orbital?highlight=${sourceId}`;
    case "sec":
      return `/entities`;
    default:
      return "#";
  }
}

export function getCitationLabel(
  sourceType: string,
  record: Record<string, unknown>,
  companyName: string | null
): string {
  const str = (val: unknown): string =>
    typeof val === "string" ? val : "";

  switch (sourceType) {
    case "fcc_filing": {
      const name = str(record.applicant_name) || companyName;
      if (name) return `FCC: ${name}`;
      const fileNum = str(record.file_number);
      return fileNum ? `FCC Filing ${fileNum}` : "FCC Filing";
    }
    case "patent": {
      const title = str(record.title);
      if (title) {
        return title.length > 50
          ? `Patent: ${title.slice(0, 47)}...`
          : `Patent: ${title}`;
      }
      const patNum = str(record.patent_number);
      return patNum ? `Patent ${patNum}` : "Patent";
    }
    case "contract": {
      const title = str(record.contract_title);
      if (title && !/^\d/.test(title)) {
        const clean =
          title.length > 50 ? `${title.slice(0, 47)}...` : title;
        return `Contract: ${clean}`;
      }
      const agency = str(record.awarding_agency);
      if (companyName)
        return `${agency || "Gov"} Contract — ${companyName}`;
      return agency ? `Contract: ${agency}` : "Gov Contract";
    }
    case "news": {
      const title = str(record.title);
      if (title) {
        return title.length > 60
          ? `${title.slice(0, 57)}...`
          : title;
      }
      const source = str(record.source);
      return source ? `News: ${source}` : "News Article";
    }
    case "company": {
      return str(record.name) || companyName || "Company";
    }
    case "orbital": {
      const objName = str(record.object_name);
      if (objName) return `Orbital: ${objName}`;
      const norad = str(record.norad_cat_id);
      return norad ? `Orbital: NORAD ${norad}` : "Orbital Object";
    }
    case "sec": {
      const filingType = str(record.filing_type);
      return filingType
        ? `SEC ${filingType} — ${companyName || ""}`
        : `SEC Filing — ${companyName || ""}`;
    }
    default:
      return companyName || sourceType;
  }
}

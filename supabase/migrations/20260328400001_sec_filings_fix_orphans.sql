-- Fix 30 orphan records: extract CIK from description field and build EDGAR company page links
-- These records have CIK in description like "(CIK 0001816017)" but no real accession numbers

-- Extract CIK from description for records that have it
UPDATE sec_filings
SET cik = ltrim((regexp_match(description, '\(CIK (\d+)\)'))[1], '0')
WHERE cik IS NULL
  AND description ~ '\(CIK \d+\)';

-- Build EDGAR company search URL for records with CIK but malformed accession_number
UPDATE sec_filings
SET document_url = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=' || cik || '&type=' || coalesce(filing_type, '') || '&dateb=&owner=include&count=40'
WHERE cik IS NOT NULL
  AND document_url IS NULL
  AND (accession_number IS NULL OR accession_number LIKE '[%');

-- Clean up malformed accession_number values (JSON-wrapped file numbers)
UPDATE sec_filings
SET accession_number = NULL
WHERE accession_number LIKE '[%';

-- Purge 60K garbage records with no filing_type (bad ingestion data)
DELETE FROM sec_filings
WHERE filing_type IS NULL;

-- Add cik column to sec_filings for direct EDGAR deep links
ALTER TABLE sec_filings ADD COLUMN IF NOT EXISTS cik TEXT;

-- Extract CIK from existing document_url (pattern: CIK=DIGITS)
UPDATE sec_filings
SET cik = (regexp_match(document_url, 'CIK=(\d+)'))[1]
WHERE document_url LIKE '%CIK=%'
  AND (cik IS NULL OR cik = '');

-- Rebuild document_url as EDGAR deep link using CIK + accession_number
-- Format: https://www.sec.gov/Archives/edgar/data/{CIK}/{accession_no_dashes}/
UPDATE sec_filings
SET document_url = 'https://www.sec.gov/Archives/edgar/data/' || cik || '/' || replace(accession_number, '-', '') || '/'
WHERE cik IS NOT NULL
  AND accession_number IS NOT NULL
  AND document_url LIKE '%cgi-bin/browse-edgar%';

-- Index on cik for future lookups
CREATE INDEX IF NOT EXISTS idx_sec_filings_cik ON sec_filings(cik);

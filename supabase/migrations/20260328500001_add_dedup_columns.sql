-- Add dedup columns for refresh endpoints

-- SEC: accession_number for EDGAR dedup
ALTER TABLE sec_filings ADD COLUMN IF NOT EXISTS accession_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sec_filings_accession ON sec_filings(accession_number) WHERE accession_number IS NOT NULL;

-- FCC: file_number for ECFS dedup
ALTER TABLE fcc_filings ADD COLUMN IF NOT EXISTS file_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fcc_filings_file_number ON fcc_filings(file_number) WHERE file_number IS NOT NULL;

-- Patents: unique index on patent_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_patents_number ON patents(patent_number) WHERE patent_number IS NOT NULL;

-- Federal Register: unique index on document_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_federal_register_doc ON federal_register(document_number) WHERE document_number IS NOT NULL;

-- SBIR: solicitation_number for dedup
ALTER TABLE sbir_awards ADD COLUMN IF NOT EXISTS solicitation_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sbir_solicitation ON sbir_awards(solicitation_number) WHERE solicitation_number IS NOT NULL;

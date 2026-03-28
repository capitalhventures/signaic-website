-- Purge all records from the bloated news table (198K+ duplicate records from repeated NewsAPI calls)
TRUNCATE TABLE news;

-- =============================================================================
-- Session C: Rename Amazon Kuiper → Amazon Leo
-- =============================================================================

UPDATE public.entities
SET name = 'Amazon Leo',
    slug = 'amazon-leo',
    description = REPLACE(description, 'Kuiper', 'Leo')
WHERE slug = 'amazon-kuiper' OR name ILIKE '%kuiper%';

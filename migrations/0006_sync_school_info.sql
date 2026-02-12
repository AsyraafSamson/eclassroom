-- Sync school info from local to remote database

UPDATE school_info 
SET site_title = 'ILKKM Johor Bahru',
    updated_at = datetime('now')
WHERE id = 1;

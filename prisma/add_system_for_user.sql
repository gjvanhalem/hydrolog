INSERT INTO System (name, rows, positionsPerRow, createdAt, updatedAt)
VALUES ('Default System', 3, '[3,4,5]', datetime('now'), datetime('now'));

UPDATE User
SET systemId = (SELECT id FROM System WHERE name = 'Default System')
WHERE id = 1;

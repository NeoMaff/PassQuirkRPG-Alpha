-- Actualizar IDs de Emojis en la tabla game_rarities
UPDATE game_rarities SET emoji_id = '1442244916788072558' WHERE name = 'Cosmico';
UPDATE game_rarities SET emoji_id = '1442244904779649044' WHERE name = 'Caos';
UPDATE game_rarities SET emoji_id = '1442244884688797787' WHERE name = 'Dragon';
UPDATE game_rarities SET emoji_id = '1442244865810235412' WHERE name = 'Celestial';
UPDATE game_rarities SET emoji_id = '1442244846348927158' WHERE name = 'Trascendente';
UPDATE game_rarities SET emoji_id = '1442244825041600624' WHERE name = 'Supremo';
UPDATE game_rarities SET emoji_id = '1442244789553856673' WHERE name = 'Sublime';
UPDATE game_rarities SET emoji_id = '1442244738244673707' WHERE name = 'Refinado';
UPDATE game_rarities SET emoji_id = '1442244704703090719' WHERE name = 'Mundano';

-- Eliminar rarezas antiguas/no usadas si existen
DELETE FROM game_rarities WHERE name NOT IN (
    'Cosmico', 'Caos', 'Dragon', 'Celestial', 'Trascendente', 
    'Supremo', 'Sublime', 'Refinado', 'Mundano'
);

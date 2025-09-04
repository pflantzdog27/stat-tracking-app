-- Complete Database Setup Script for Hockey Stats Tracking
-- Execute this file to create the full database schema with sample data

-- Run all setup scripts in order
\i 01_schema.sql
\i 02_indexes_constraints.sql  
\i 03_sample_data.sql
\i 04_functions_views.sql

-- Verify setup with some test queries
SELECT 'Database setup complete!' as status;

-- Show basic stats
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM teams) as total_teams,
    (SELECT COUNT(*) FROM players WHERE active = true) as active_players,
    (SELECT COUNT(*) FROM games) as total_games,
    (SELECT COUNT(*) FROM game_events) as total_events;

-- Show sample team roster
SELECT 
    jersey_number,
    first_name || ' ' || last_name as player_name,
    position
FROM players 
WHERE team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND active = true
ORDER BY position, jersey_number;

-- Show top scorers
SELECT * FROM get_top_performers(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    '2024-25', 
    'points', 
    5
);
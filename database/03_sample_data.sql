-- Sample Data for Hockey Stats Tracking Database
-- Insert realistic test data for development and testing

-- Sample Users
INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'coach.smith@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'John', 'Smith', 'admin'),
('22222222-2222-2222-2222-222222222222', 'assistant.coach@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Sarah', 'Johnson', 'coach'),
('33333333-3333-3333-3333-333333333333', 'manager@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Mike', 'Davis', 'coach'),
('44444444-4444-4444-4444-444444444444', 'parent1@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Jennifer', 'Wilson', 'viewer'),
('55555555-5555-5555-5555-555555555555', 'parent2@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Robert', 'Brown', 'viewer');

-- Sample Teams
INSERT INTO teams (id, name, season, division, created_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Thunder Hawks', '2024-25', 'Bantam AA', '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lightning Bolts', '2024-25', 'Bantam AA', '11111111-1111-1111-1111-111111111111');

-- Team Members
INSERT INTO team_members (team_id, user_id, role) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'coach'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'coach'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'viewer'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'viewer');

-- Sample Players for Thunder Hawks
INSERT INTO players (id, team_id, jersey_number, first_name, last_name, position, birth_date, active) VALUES
-- Forwards
('f1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 9, 'Connor', 'Wilson', 'F', '2010-03-15', true),
('f2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 11, 'Jake', 'Thompson', 'F', '2010-07-22', true),
('f3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 17, 'Ethan', 'Brown', 'F', '2010-01-08', true),
('f4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 19, 'Lucas', 'Davis', 'F', '2010-05-12', true),
('f5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 21, 'Noah', 'Garcia', 'F', '2010-09-30', true),
('f6666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 23, 'Mason', 'Miller', 'F', '2010-02-18', true),
('f7777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 27, 'Oliver', 'Anderson', 'F', '2010-11-25', true),
('f8888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 88, 'Liam', 'Taylor', 'F', '2010-04-03', true),
-- Defense
('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Alex', 'Johnson', 'D', '2010-06-14', true),
('d2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Ryan', 'Williams', 'D', '2010-08-09', true),
('d3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Tyler', 'Jones', 'D', '2010-12-01', true),
('d4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7, 'Dylan', 'Wilson', 'D', '2010-10-17', true),
-- Goalies
('g1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 30, 'Cameron', 'Smith', 'G', '2010-03-28', true),
('g2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 35, 'Hunter', 'Martin', 'G', '2010-07-11', true);

-- Sample Games
INSERT INTO games (id, team_id, opponent, game_date, location, game_type, status, final_score_us, final_score_opponent) VALUES
-- Completed Game
('game1111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ice Wolves', '2024-10-15 19:00:00-05', 'Home Arena', 'regular', 'completed', 4, 2),
-- In Progress Game
('game2222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Storm Eagles', '2024-10-22 19:30:00-05', 'Away Arena', 'regular', 'in_progress', 2, 1),
-- Upcoming Games
('game3333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fire Birds', '2024-10-29 18:00:00-05', 'Home Arena', 'regular', 'scheduled', 0, 0),
('game4444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Steel Sharks', '2024-11-05 19:15:00-05', 'Away Arena', 'regular', 'scheduled', 0, 0);

-- Sample Game Events for Completed Game (game1111)
INSERT INTO game_events (game_id, player_id, event_type, period, time_in_period, description, created_by) VALUES
-- Period 1
('game1111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'goal', 1, '05:23', 'Wrist shot from slot', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'assist', 1, '05:23', 'Primary assist', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'shot', 1, '08:45', 'Shot on goal', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'hit', 1, '12:30', 'Clean body check', '11111111-1111-1111-1111-111111111111'),
-- Period 2
('game1111-1111-1111-1111-111111111111', 'f4444444-4444-4444-4444-444444444444', 'goal', 2, '03:12', 'Power play goal', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'assist', 2, '03:12', 'Primary assist', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'f5555555-5555-5555-5555-555555555555', 'goal', 2, '14:56', 'Breakaway goal', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'penalty', 2, '17:22', 'Tripping - 2 minutes', '11111111-1111-1111-1111-111111111111'),
-- Period 3
('game1111-1111-1111-1111-111111111111', 'f6666666-6666-6666-6666-666666666666', 'goal', 3, '09:41', 'Deflection in front', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'f7777777-7777-7777-7777-777777777777', 'assist', 3, '09:41', 'Primary assist', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'save', 3, '15:30', 'Glove save', '11111111-1111-1111-1111-111111111111'),
('game1111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'save', 3, '18:45', 'Pad save', '11111111-1111-1111-1111-111111111111');

-- Sample Game Events for In Progress Game (game2222) 
INSERT INTO game_events (game_id, player_id, event_type, period, time_in_period, description, created_by) VALUES
-- Period 1
('game2222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222', 'goal', 1, '07:15', 'Snap shot top corner', '11111111-1111-1111-1111-111111111111'),
('game2222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333', 'assist', 1, '07:15', 'Primary assist', '11111111-1111-1111-1111-111111111111'),
-- Period 2  
('game2222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'goal', 2, '11:28', 'Rebound goal', '11111111-1111-1111-1111-111111111111'),
('game2222-2222-2222-2222-222222222222', 'f4444444-4444-4444-4444-444444444444', 'shot', 2, '15:33', 'Shot on goal', '11111111-1111-1111-1111-111111111111');

-- Sample Player Game Stats for Completed Game
INSERT INTO player_game_stats (game_id, player_id, goals, assists, shots, hits, penalty_minutes, saves) VALUES
-- Game 1 stats
('game1111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 1, 1, 3, 0, 0, 0),
('game1111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 0, 1, 2, 1, 0, 0),
('game1111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 0, 0, 1, 0, 0, 0),
('game1111-1111-1111-1111-111111111111', 'f4444444-4444-4444-4444-444444444444', 1, 0, 2, 0, 0, 0),
('game1111-1111-1111-1111-111111111111', 'f5555555-5555-5555-5555-555555555555', 1, 0, 1, 0, 0, 0),
('game1111-1111-1111-1111-111111111111', 'f6666666-6666-6666-6666-666666666666', 1, 0, 1, 2, 0, 0),
('game1111-1111-1111-1111-111111111111', 'f7777777-7777-7777-7777-777777777777', 0, 1, 0, 1, 0, 0),
('game1111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 0, 0, 0, 3, 0, 0),
('game1111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 0, 0, 0, 1, 2, 0),
('game1111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 0, 0, 0, 0, 0, 25);

-- Sample Player Season Stats
INSERT INTO player_season_stats (player_id, season, games_played, goals, assists, shots, hits, penalty_minutes, saves, goals_against) VALUES
-- Forward stats
('f1111111-1111-1111-1111-111111111111', '2024-25', 5, 4, 6, 15, 2, 0, 0, 0),
('f2222222-2222-2222-2222-222222222222', '2024-25', 5, 2, 5, 12, 8, 2, 0, 0),
('f3333333-3333-3333-3333-333333333333', '2024-25', 5, 3, 2, 10, 3, 0, 0, 0),
('f4444444-4444-4444-4444-444444444444', '2024-25', 5, 5, 1, 18, 1, 0, 0, 0),
('f5555555-5555-5555-5555-555555555555', '2024-25', 5, 2, 3, 8, 4, 4, 0, 0),
('f6666666-6666-6666-6666-666666666666', '2024-25', 5, 3, 4, 14, 12, 0, 0, 0),
('f7777777-7777-7777-7777-777777777777', '2024-25', 5, 1, 8, 6, 5, 2, 0, 0),
('f8888888-8888-8888-8888-888888888888', '2024-25', 4, 1, 2, 7, 2, 0, 0, 0),
-- Defense stats
('d1111111-1111-1111-1111-111111111111', '2024-25', 5, 0, 3, 5, 15, 2, 0, 0),
('d2222222-2222-2222-2222-222222222222', '2024-25', 5, 1, 2, 8, 18, 6, 0, 0),
('d3333333-3333-3333-3333-333333333333', '2024-25', 5, 0, 1, 3, 12, 0, 0, 0),
('d4444444-4444-4444-4444-444444444444', '2024-25', 4, 0, 4, 6, 10, 4, 0, 0),
-- Goalie stats  
('g1111111-1111-1111-1111-111111111111', '2024-25', 3, 0, 0, 0, 0, 0, 78, 8),
('g2222222-2222-2222-2222-222222222222', '2024-25', 2, 0, 0, 0, 0, 0, 42, 6);
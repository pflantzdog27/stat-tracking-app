-- Additional Indexes and Constraints for Hockey Stats Database
-- Optimized for common query patterns

-- Performance indexes for frequent queries
CREATE INDEX idx_players_team_active ON players(team_id, active);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_games_team_date ON games(team_id, game_date DESC);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_game_events_game_type ON game_events(game_id, event_type);
CREATE INDEX idx_game_events_player_type ON game_events(player_id, event_type);
CREATE INDEX idx_game_events_created_at ON game_events(created_at DESC);
CREATE INDEX idx_player_game_stats_player ON player_game_stats(player_id);
CREATE INDEX idx_player_season_stats_season ON player_season_stats(season);

-- Composite indexes for common aggregation queries
CREATE INDEX idx_game_events_game_period_time ON game_events(game_id, period, time_in_period);
CREATE INDEX idx_player_season_points ON player_season_stats(season, points DESC);
CREATE INDEX idx_player_season_goals ON player_season_stats(season, goals DESC);

-- Full-text search index for player names
CREATE INDEX idx_players_name_search ON players USING gin(
    to_tsvector('english', first_name || ' ' || last_name)
);

-- Partial indexes for active players only
CREATE INDEX idx_active_players_team ON players(team_id) WHERE active = true;

-- Unique constraints for data integrity
ALTER TABLE users ADD CONSTRAINT unique_email_lowercase 
    EXCLUDE USING btree (lower(email) WITH =);

-- Check constraints for data validation
ALTER TABLE players ADD CONSTRAINT valid_jersey_number 
    CHECK (jersey_number > 0 AND jersey_number <= 99);

ALTER TABLE game_events ADD CONSTRAINT valid_time_format 
    CHECK (time_in_period ~ '^[0-5]?[0-9]:[0-5][0-9]$');

ALTER TABLE games ADD CONSTRAINT valid_time_remaining_format 
    CHECK (time_remaining IS NULL OR time_remaining ~ '^[0-5]?[0-9]:[0-5][0-9]$');

ALTER TABLE games ADD CONSTRAINT valid_scores 
    CHECK (final_score_us >= 0 AND final_score_opponent >= 0);

-- Foreign key indexes for better join performance
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_games_team ON games(team_id);
CREATE INDEX idx_game_events_game ON game_events(game_id);
CREATE INDEX idx_game_events_player ON game_events(player_id);
CREATE INDEX idx_game_events_created_by ON game_events(created_by);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_game_stats_updated_at BEFORE UPDATE ON player_game_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_season_stats_updated_at BEFORE UPDATE ON player_season_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
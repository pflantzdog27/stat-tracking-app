-- Database initialization script for Hockey Stats Tracking App
-- This script creates the database schema with performance optimizations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE game_status AS ENUM ('scheduled', 'live', 'finished', 'postponed', 'cancelled');
CREATE TYPE player_position AS ENUM ('C', 'LW', 'RW', 'D', 'G');
CREATE TYPE event_type AS ENUM ('goal', 'assist', 'penalty', 'hit', 'save', 'faceoff', 'period_start', 'period_end');

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(5) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    conference VARCHAR(50),
    division VARCHAR(50),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    logo_url TEXT,
    founded_year INTEGER,
    arena VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for teams
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);
CREATE INDEX idx_teams_conference ON teams(conference);
CREATE INDEX idx_teams_division ON teams(division);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    position player_position NOT NULL,
    jersey_number INTEGER,
    team_id UUID REFERENCES teams(id),
    birth_date DATE,
    birth_place VARCHAR(200),
    height INTEGER, -- in centimeters
    weight INTEGER, -- in pounds
    shoots VARCHAR(1) CHECK (shoots IN ('L', 'R')),
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for players
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_name_trgm ON players USING gin (name gin_trgm_ops);
CREATE INDEX idx_players_active ON players(is_active) WHERE is_active = true;

-- Seasons table
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year VARCHAR(7) NOT NULL UNIQUE, -- e.g., '2023-24'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for seasons
CREATE INDEX idx_seasons_year ON seasons(year);
CREATE INDEX idx_seasons_current ON seasons(is_current) WHERE is_current = true;

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID REFERENCES seasons(id),
    game_date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    venue VARCHAR(100),
    status game_status DEFAULT 'scheduled',
    period INTEGER DEFAULT 0,
    time_remaining VARCHAR(10),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    attendance INTEGER,
    game_type VARCHAR(20) DEFAULT 'regular', -- regular, playoff, preseason
    overtime BOOLEAN DEFAULT false,
    shootout BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for games
CREATE INDEX idx_games_season_id ON games(season_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_team_date ON games(home_team_id, away_team_id, game_date);

-- Player statistics table (aggregated by season)
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    season_id UUID REFERENCES seasons(id),
    team_id UUID REFERENCES teams(id),
    games_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    points INTEGER GENERATED ALWAYS AS (goals + assists) STORED,
    plus_minus INTEGER DEFAULT 0,
    penalty_minutes INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    shooting_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN shots > 0 THEN (goals::DECIMAL / shots * 100) ELSE 0 END
    ) STORED,
    hits INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_attempts INTEGER DEFAULT 0,
    faceoff_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN faceoff_attempts > 0 THEN (faceoff_wins::DECIMAL / faceoff_attempts * 100) ELSE 0 END
    ) STORED,
    time_on_ice_seconds INTEGER DEFAULT 0,
    powerplay_goals INTEGER DEFAULT 0,
    powerplay_assists INTEGER DEFAULT 0,
    powerplay_points INTEGER GENERATED ALWAYS AS (powerplay_goals + powerplay_assists) STORED,
    shorthanded_goals INTEGER DEFAULT 0,
    shorthanded_assists INTEGER DEFAULT 0,
    game_winning_goals INTEGER DEFAULT 0,
    -- Goalie specific stats
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    overtime_losses INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    shots_against INTEGER DEFAULT 0,
    save_percentage DECIMAL(5,3) GENERATED ALWAYS AS (
        CASE WHEN shots_against > 0 THEN (saves::DECIMAL / shots_against * 100) ELSE 0 END
    ) STORED,
    goals_against INTEGER DEFAULT 0,
    goals_against_average DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE WHEN time_on_ice_seconds > 0 THEN (goals_against::DECIMAL * 3600 / time_on_ice_seconds) ELSE 0 END
    ) STORED,
    shutouts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(player_id, season_id, team_id)
);

-- Create indexes for player_stats
CREATE INDEX idx_player_stats_player ON player_stats(player_id);
CREATE INDEX idx_player_stats_season ON player_stats(season_id);
CREATE INDEX idx_player_stats_team ON player_stats(team_id);
CREATE INDEX idx_player_stats_points ON player_stats(points DESC);
CREATE INDEX idx_player_stats_goals ON player_stats(goals DESC);
CREATE INDEX idx_player_stats_assists ON player_stats(assists DESC);
CREATE INDEX idx_player_stats_save_pct ON player_stats(save_percentage DESC) WHERE save_percentage > 0;

-- Game statistics table
CREATE TABLE game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id),
    player_id UUID REFERENCES players(id),
    team_id UUID REFERENCES teams(id),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    points INTEGER GENERATED ALWAYS AS (goals + assists) STORED,
    plus_minus INTEGER DEFAULT 0,
    penalty_minutes INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_attempts INTEGER DEFAULT 0,
    time_on_ice_seconds INTEGER DEFAULT 0,
    powerplay_goals INTEGER DEFAULT 0,
    powerplay_assists INTEGER DEFAULT 0,
    shorthanded_goals INTEGER DEFAULT 0,
    shorthanded_assists INTEGER DEFAULT 0,
    -- Goalie specific stats
    saves INTEGER DEFAULT 0,
    shots_against INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    decision VARCHAR(1) CHECK (decision IN ('W', 'L', 'O')), -- Win, Loss, Overtime Loss
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(game_id, player_id)
);

-- Create indexes for game_stats
CREATE INDEX idx_game_stats_game ON game_stats(game_id);
CREATE INDEX idx_game_stats_player ON game_stats(player_id);
CREATE INDEX idx_game_stats_team ON game_stats(team_id);
CREATE INDEX idx_game_stats_points ON game_stats(points DESC);

-- Game events table
CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id),
    event_type event_type NOT NULL,
    period INTEGER NOT NULL,
    time_in_period VARCHAR(10) NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id),
    player1_id UUID REFERENCES players(id), -- Primary player (scorer, penalty taker, etc.)
    player2_id UUID REFERENCES players(id), -- Secondary player (assist, etc.)
    player3_id UUID REFERENCES players(id), -- Tertiary player (second assist, etc.)
    x_coordinate INTEGER, -- Ice coordinates for advanced analytics
    y_coordinate INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for game_events
CREATE INDEX idx_game_events_game ON game_events(game_id);
CREATE INDEX idx_game_events_type ON game_events(event_type);
CREATE INDEX idx_game_events_period_time ON game_events(period, time_in_period);
CREATE INDEX idx_game_events_player1 ON game_events(player1_id);

-- Team statistics table (aggregated by season)
CREATE TABLE team_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id),
    season_id UUID REFERENCES seasons(id),
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    overtime_losses INTEGER DEFAULT 0,
    points INTEGER GENERATED ALWAYS AS (wins * 2 + overtime_losses) STORED,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_differential INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    shots_for INTEGER DEFAULT 0,
    shots_against INTEGER DEFAULT 0,
    powerplay_goals INTEGER DEFAULT 0,
    powerplay_opportunities INTEGER DEFAULT 0,
    powerplay_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN powerplay_opportunities > 0 THEN (powerplay_goals::DECIMAL / powerplay_opportunities * 100) ELSE 0 END
    ) STORED,
    penalty_kill_goals_against INTEGER DEFAULT 0,
    penalty_kill_opportunities INTEGER DEFAULT 0,
    penalty_kill_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN penalty_kill_opportunities > 0 THEN ((penalty_kill_opportunities - penalty_kill_goals_against)::DECIMAL / penalty_kill_opportunities * 100) ELSE 0 END
    ) STORED,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_attempts INTEGER DEFAULT 0,
    faceoff_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN faceoff_attempts > 0 THEN (faceoff_wins::DECIMAL / faceoff_attempts * 100) ELSE 0 END
    ) STORED,
    hits INTEGER DEFAULT 0,
    blocked_shots INTEGER DEFAULT 0,
    penalty_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(team_id, season_id)
);

-- Create indexes for team_stats
CREATE INDEX idx_team_stats_team ON team_stats(team_id);
CREATE INDEX idx_team_stats_season ON team_stats(season_id);
CREATE INDEX idx_team_stats_points ON team_stats(points DESC);
CREATE INDEX idx_team_stats_wins ON team_stats(wins DESC);

-- Create functions for updating statistics
CREATE OR REPLACE FUNCTION update_player_season_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_stats (
        player_id, season_id, team_id, games_played, goals, assists, 
        plus_minus, penalty_minutes, shots, hits, blocks, faceoff_wins, 
        faceoff_attempts, time_on_ice_seconds, powerplay_goals, powerplay_assists,
        shorthanded_goals, shorthanded_assists, saves, shots_against, goals_against
    )
    SELECT 
        NEW.player_id,
        g.season_id,
        NEW.team_id,
        1,
        NEW.goals,
        NEW.assists,
        NEW.plus_minus,
        NEW.penalty_minutes,
        NEW.shots,
        NEW.hits,
        NEW.blocks,
        NEW.faceoff_wins,
        NEW.faceoff_attempts,
        NEW.time_on_ice_seconds,
        NEW.powerplay_goals,
        NEW.powerplay_assists,
        NEW.shorthanded_goals,
        NEW.shorthanded_assists,
        NEW.saves,
        NEW.shots_against,
        NEW.goals_against
    FROM games g
    WHERE g.id = NEW.game_id
    ON CONFLICT (player_id, season_id, team_id)
    DO UPDATE SET
        games_played = player_stats.games_played + 1,
        goals = player_stats.goals + NEW.goals,
        assists = player_stats.assists + NEW.assists,
        plus_minus = player_stats.plus_minus + NEW.plus_minus,
        penalty_minutes = player_stats.penalty_minutes + NEW.penalty_minutes,
        shots = player_stats.shots + NEW.shots,
        hits = player_stats.hits + NEW.hits,
        blocks = player_stats.blocks + NEW.blocks,
        faceoff_wins = player_stats.faceoff_wins + NEW.faceoff_wins,
        faceoff_attempts = player_stats.faceoff_attempts + NEW.faceoff_attempts,
        time_on_ice_seconds = player_stats.time_on_ice_seconds + NEW.time_on_ice_seconds,
        powerplay_goals = player_stats.powerplay_goals + NEW.powerplay_goals,
        powerplay_assists = player_stats.powerplay_assists + NEW.powerplay_assists,
        shorthanded_goals = player_stats.shorthanded_goals + NEW.shorthanded_goals,
        shorthanded_assists = player_stats.shorthanded_assists + NEW.shorthanded_assists,
        saves = player_stats.saves + NEW.saves,
        shots_against = player_stats.shots_against + NEW.shots_against,
        goals_against = player_stats.goals_against + NEW.goals_against,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_player_season_stats
    AFTER INSERT ON game_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_player_season_stats();

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update timestamp triggers
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_stats_updated_at BEFORE UPDATE ON team_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW current_season_player_stats AS
SELECT 
    ps.*,
    p.name,
    p.position,
    p.jersey_number,
    t.abbreviation as team_abbreviation,
    s.year as season_year
FROM player_stats ps
JOIN players p ON ps.player_id = p.id
JOIN teams t ON ps.team_id = t.id
JOIN seasons s ON ps.season_id = s.id
WHERE s.is_current = true;

CREATE VIEW current_season_team_standings AS
SELECT 
    ts.*,
    t.name,
    t.abbreviation,
    t.conference,
    t.division,
    RANK() OVER (ORDER BY ts.points DESC, ts.wins DESC, ts.goal_differential DESC) as league_rank,
    RANK() OVER (PARTITION BY t.conference ORDER BY ts.points DESC, ts.wins DESC, ts.goal_differential DESC) as conference_rank,
    RANK() OVER (PARTITION BY t.division ORDER BY ts.points DESC, ts.wins DESC, ts.goal_differential DESC) as division_rank
FROM team_stats ts
JOIN teams t ON ts.team_id = t.id
JOIN seasons s ON ts.season_id = s.id
WHERE s.is_current = true;

-- Performance monitoring table
CREATE TABLE query_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_name VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    parameters JSONB,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_query_performance_name ON query_performance(query_name);
CREATE INDEX idx_query_performance_time ON query_performance(executed_at);

-- Add some constraints for data integrity
ALTER TABLE games ADD CONSTRAINT chk_scores_non_negative CHECK (home_score >= 0 AND away_score >= 0);
ALTER TABLE games ADD CONSTRAINT chk_different_teams CHECK (home_team_id != away_team_id);
ALTER TABLE player_stats ADD CONSTRAINT chk_games_played_positive CHECK (games_played >= 0);
ALTER TABLE team_stats ADD CONSTRAINT chk_team_games_played_positive CHECK (games_played >= 0);

-- Create partial indexes for performance
CREATE INDEX idx_active_players_team_position ON players(team_id, position) WHERE is_active = true;
CREATE INDEX idx_finished_games_date ON games(game_date) WHERE status = 'finished';
CREATE INDEX idx_live_games ON games(id) WHERE status = 'live';
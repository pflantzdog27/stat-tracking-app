-- Hockey Stats Tracking Database Schema
-- PostgreSQL with proper relationships, indexes, and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication and role management)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'coach', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL, -- e.g., "2024-25"
    division VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, season)
);

-- Team members (coaches, managers who can edit stats)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'coach', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    jersey_number INTEGER NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(20) CHECK (position IN ('F', 'D', 'G')), -- Forward, Defense, Goalie
    birth_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, jersey_number)
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    opponent VARCHAR(100) NOT NULL,
    game_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_home BOOLEAN NOT NULL DEFAULT true,
    location VARCHAR(200),
    game_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (game_type IN ('regular', 'playoff', 'tournament', 'scrimmage')),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    period INTEGER DEFAULT 1 CHECK (period >= 1 AND period <= 10), -- Current period (1-3 regular, 4+ overtime/shootout)
    time_remaining VARCHAR(10), -- MM:SS format
    final_score_us INTEGER DEFAULT 0,
    final_score_opponent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game events (flexible event system for all stats)
CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE, -- NULL for team events
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
        'goal', 'assist', 'shot', 'shot_blocked', 'hit', 'takeaway', 'giveaway',
        'faceoff_win', 'faceoff_loss', 'penalty', 'penalty_shot', 'save', 'goal_against'
    )),
    period INTEGER NOT NULL CHECK (period >= 1 AND period <= 10),
    time_in_period VARCHAR(10) NOT NULL, -- MM:SS format
    description TEXT, -- Optional description
    metadata JSONB, -- Flexible data for event-specific information
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Index for efficient querying
    INDEX idx_game_events_game_player (game_id, player_id),
    INDEX idx_game_events_type (event_type),
    INDEX idx_game_events_period (period)
);

-- Pre-computed player game stats (for performance)
CREATE TABLE player_game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    shots_blocked INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    takeaways INTEGER DEFAULT 0,
    giveaways INTEGER DEFAULT 0,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_losses INTEGER DEFAULT 0,
    penalty_minutes INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0, -- For goalies
    goals_against INTEGER DEFAULT 0, -- For goalies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, player_id)
);

-- Season stats (aggregated from game stats)
CREATE TABLE player_season_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season VARCHAR(20) NOT NULL,
    games_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    points INTEGER GENERATED ALWAYS AS (goals + assists) STORED,
    shots INTEGER DEFAULT 0,
    shots_blocked INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    takeaways INTEGER DEFAULT 0,
    giveaways INTEGER DEFAULT 0,
    faceoff_wins INTEGER DEFAULT 0,
    faceoff_losses INTEGER DEFAULT 0,
    faceoff_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN (faceoff_wins + faceoff_losses) > 0 
        THEN ROUND((faceoff_wins::DECIMAL / (faceoff_wins + faceoff_losses)) * 100, 2)
        ELSE 0 END
    ) STORED,
    penalty_minutes INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    save_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN (saves + goals_against) > 0 
        THEN ROUND((saves::DECIMAL / (saves + goals_against)) * 100, 2)
        ELSE 0 END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, season)
);
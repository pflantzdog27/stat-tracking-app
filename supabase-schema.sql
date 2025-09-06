-- Hockey Stats Tracking Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL, -- e.g., "2024-25"
    division VARCHAR(50),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, season)
);

-- Team members (coaches, managers who can edit stats)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'coach', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    opponent VARCHAR(100) NOT NULL,
    game_date DATE NOT NULL,
    is_home BOOLEAN NOT NULL DEFAULT TRUE,
    final_score_us INTEGER DEFAULT 0,
    final_score_them INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player game stats
CREATE TABLE player_game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    penalty_minutes INTEGER NOT NULL DEFAULT 0,
    plus_minus INTEGER NOT NULL DEFAULT 0,
    shots INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, player_id)
);

-- Player season stats (aggregated)
CREATE TABLE player_season_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season VARCHAR(20) NOT NULL,
    games_played INTEGER NOT NULL DEFAULT 0,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    points INTEGER GENERATED ALWAYS AS (goals + assists) STORED,
    penalty_minutes INTEGER NOT NULL DEFAULT 0,
    plus_minus INTEGER NOT NULL DEFAULT 0,
    shots INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- Create indexes for better performance
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_season ON teams(season);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_active ON players(active);
CREATE INDEX idx_games_team_id ON games(team_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_player_game_stats_game_id ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player_id ON player_game_stats(player_id);
CREATE INDEX idx_player_season_stats_player_id ON player_season_stats(player_id);
CREATE INDEX idx_player_season_stats_season ON player_season_stats(season);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_season_stats_updated_at BEFORE UPDATE ON player_season_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_season_stats ENABLE ROW LEVEL SECURITY;

-- Teams: Users can only see/edit teams they created
CREATE POLICY "Users can view their teams" ON teams FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Team creators can update teams" ON teams FOR UPDATE USING (created_by = auth.uid());

-- Team members: Users can view all team members (they can only see teams they belong to anyway)
CREATE POLICY "Users can view team members" ON team_members FOR SELECT USING (true);

CREATE POLICY "Users can insert team members" ON team_members FOR INSERT WITH CHECK (
    team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
    )
);

-- Players: Users can view/edit players on teams they created or are admins/coaches of
CREATE POLICY "Users can view players on their teams" ON players FOR SELECT USING (
    team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Team creators can manage players" ON players FOR ALL USING (
    team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
    )
);

-- Games: Similar permissions as players
CREATE POLICY "Users can view games for their teams" ON games FOR SELECT USING (
    team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Team creators can manage games" ON games FOR ALL USING (
    team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
    )
);

-- Player stats: Same as games
CREATE POLICY "Users can view stats for their teams" ON player_game_stats FOR SELECT USING (
    game_id IN (
        SELECT id FROM games WHERE team_id IN (
            SELECT id FROM teams WHERE created_by = auth.uid()
        )
    )
);

CREATE POLICY "Team creators can manage stats" ON player_game_stats FOR ALL USING (
    game_id IN (
        SELECT id FROM games WHERE team_id IN (
            SELECT id FROM teams WHERE created_by = auth.uid()
        )
    )
);

-- Season stats: Same permissions
CREATE POLICY "Users can view season stats for their teams" ON player_season_stats FOR SELECT USING (
    player_id IN (
        SELECT id FROM players WHERE team_id IN (
            SELECT id FROM teams WHERE created_by = auth.uid()
        )
    )
);

CREATE POLICY "Team creators can manage season stats" ON player_season_stats FOR ALL USING (
    player_id IN (
        SELECT id FROM players WHERE team_id IN (
            SELECT id FROM teams WHERE created_by = auth.uid()
        )
    )
);

-- Sample data will be created through the app when users register and create teams
-- No initial data needed - users will create their own teams after authentication
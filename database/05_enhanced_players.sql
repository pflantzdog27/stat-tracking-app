-- Enhanced Player Management Schema
-- Add additional fields for comprehensive player management

-- Add contact information and extended player details
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS height_inches INTEGER,
ADD COLUMN IF NOT EXISTS weight_lbs INTEGER,
ADD COLUMN IF NOT EXISTS shoots VARCHAR(1) CHECK (shoots IN ('L', 'R')), -- Left or Right handed
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS previous_jersey_numbers INTEGER[],
ADD COLUMN IF NOT EXISTS player_status VARCHAR(20) DEFAULT 'active' CHECK (player_status IN ('active', 'inactive', 'injured', 'suspended')),
ADD COLUMN IF NOT EXISTS parent_guardian_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS parent_guardian_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_guardian_phone VARCHAR(20);

-- Player history log for tracking changes
CREATE TABLE IF NOT EXISTS player_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'activated', 'deactivated', 'jersey_changed', etc.
    old_values JSONB,
    new_values JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for player history
CREATE INDEX IF NOT EXISTS idx_player_history_player ON player_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_history_date ON player_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_history_type ON player_history(change_type);

-- Jersey number availability tracking
CREATE TABLE IF NOT EXISTS jersey_number_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    jersey_number INTEGER NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_date TIMESTAMP WITH TIME ZONE,
    season VARCHAR(20) NOT NULL,
    notes TEXT
);

-- Indexes for jersey tracking
CREATE INDEX IF NOT EXISTS idx_jersey_history_team_season ON jersey_number_history(team_id, season);
CREATE INDEX IF NOT EXISTS idx_jersey_history_number ON jersey_number_history(jersey_number);
CREATE INDEX IF NOT EXISTS idx_jersey_history_player ON jersey_number_history(player_id);

-- Function to log player changes
CREATE OR REPLACE FUNCTION log_player_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO player_history (player_id, changed_by, change_type, new_values)
        VALUES (
            NEW.id,
            COALESCE(current_setting('app.current_user_id', true)::UUID, NEW.id), -- Fallback if not set
            'created',
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log the change with old and new values
        INSERT INTO player_history (player_id, changed_by, change_type, old_values, new_values, notes)
        VALUES (
            NEW.id,
            COALESCE(current_setting('app.current_user_id', true)::UUID, NEW.id),
            CASE 
                WHEN OLD.active != NEW.active THEN 
                    CASE WHEN NEW.active THEN 'activated' ELSE 'deactivated' END
                WHEN OLD.jersey_number != NEW.jersey_number THEN 'jersey_changed'
                ELSE 'updated'
            END,
            to_jsonb(OLD),
            to_jsonb(NEW),
            CASE 
                WHEN OLD.jersey_number != NEW.jersey_number THEN 
                    'Jersey number changed from ' || OLD.jersey_number || ' to ' || NEW.jersey_number
                ELSE NULL
            END
        );
        
        -- Track jersey number changes
        IF OLD.jersey_number != NEW.jersey_number THEN
            -- Release old jersey number
            UPDATE jersey_number_history 
            SET released_date = NOW()
            WHERE player_id = NEW.id AND jersey_number = OLD.jersey_number AND released_date IS NULL;
            
            -- Assign new jersey number
            INSERT INTO jersey_number_history (team_id, jersey_number, player_id, season)
            SELECT NEW.team_id, NEW.jersey_number, NEW.id, t.season
            FROM teams t WHERE t.id = NEW.team_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO player_history (player_id, changed_by, change_type, old_values)
        VALUES (
            OLD.id,
            COALESCE(current_setting('app.current_user_id', true)::UUID, OLD.id),
            'deleted',
            to_jsonb(OLD)
        );
        
        -- Release jersey number
        UPDATE jersey_number_history 
        SET released_date = NOW()
        WHERE player_id = OLD.id AND released_date IS NULL;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for player history logging
DROP TRIGGER IF EXISTS player_history_trigger ON players;
CREATE TRIGGER player_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON players
    FOR EACH ROW EXECUTE FUNCTION log_player_change();

-- View for player details with stats
CREATE OR REPLACE VIEW player_details_view AS
SELECT 
    p.*,
    t.name as team_name,
    t.season,
    pss.games_played,
    pss.goals,
    pss.assists,
    pss.points,
    pss.shots,
    pss.penalty_minutes,
    pss.saves,
    pss.goals_against,
    pss.save_percentage,
    -- Calculate age from birth_date
    CASE WHEN p.birth_date IS NOT NULL 
         THEN EXTRACT(YEAR FROM AGE(p.birth_date::DATE))
         ELSE NULL 
    END as age,
    -- Get latest status change
    (SELECT ph.created_at FROM player_history ph 
     WHERE ph.player_id = p.id AND ph.change_type IN ('activated', 'deactivated', 'created')
     ORDER BY ph.created_at DESC LIMIT 1) as status_changed_at
FROM players p
JOIN teams t ON p.team_id = t.id
LEFT JOIN player_season_stats pss ON p.id = pss.player_id AND pss.season = t.season;

-- Function to get available jersey numbers with history
CREATE OR REPLACE FUNCTION get_available_jersey_numbers(p_team_id UUID, p_season VARCHAR(20))
RETURNS TABLE (
    jersey_number INTEGER,
    is_retired BOOLEAN,
    last_player_name TEXT,
    last_used_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH all_numbers AS (
        SELECT generate_series(1, 99) as num
    ),
    used_numbers AS (
        SELECT DISTINCT p.jersey_number
        FROM players p
        WHERE p.team_id = p_team_id AND p.active = true
    ),
    history_info AS (
        SELECT 
            jnh.jersey_number,
            p.first_name || ' ' || p.last_name as player_name,
            jnh.assigned_date,
            ROW_NUMBER() OVER (PARTITION BY jnh.jersey_number ORDER BY jnh.assigned_date DESC) as rn
        FROM jersey_number_history jnh
        LEFT JOIN players p ON jnh.player_id = p.id
        WHERE jnh.team_id = p_team_id AND jnh.season = p_season
    )
    SELECT 
        an.num as jersey_number,
        false as is_retired, -- TODO: Add retired number functionality
        hi.player_name as last_player_name,
        hi.assigned_date as last_used_date
    FROM all_numbers an
    LEFT JOIN used_numbers un ON an.num = un.jersey_number
    LEFT JOIN history_info hi ON an.num = hi.jersey_number AND hi.rn = 1
    WHERE un.jersey_number IS NULL
    ORDER BY an.num;
END;
$$ LANGUAGE plpgsql;

-- Sample data for enhanced players (update existing Thunder Hawks players)
UPDATE players 
SET 
    height_inches = CASE jersey_number
        WHEN 9 THEN 66   -- Connor Wilson - 5'6"
        WHEN 11 THEN 68  -- Jake Thompson - 5'8"
        WHEN 17 THEN 70  -- Ethan Brown - 5'10"
        WHEN 30 THEN 72  -- Cameron Smith - 6'0"
        ELSE 68
    END,
    weight_lbs = CASE jersey_number
        WHEN 9 THEN 140  -- Connor Wilson
        WHEN 11 THEN 150 -- Jake Thompson
        WHEN 17 THEN 160 -- Ethan Brown
        WHEN 30 THEN 170 -- Cameron Smith
        ELSE 155
    END,
    shoots = CASE jersey_number % 2 
        WHEN 0 THEN 'R' 
        ELSE 'L' 
    END,
    player_status = 'active'
WHERE team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
-- Useful Functions and Views for Hockey Stats Database
-- Common queries and computed statistics

-- View: Player stats with computed fields
CREATE VIEW player_stats_view AS
SELECT 
    p.id,
    p.jersey_number,
    p.first_name,
    p.last_name,
    p.position,
    t.name as team_name,
    pss.season,
    pss.games_played,
    pss.goals,
    pss.assists,
    pss.points,
    pss.shots,
    CASE WHEN pss.shots > 0 
         THEN ROUND((pss.goals::DECIMAL / pss.shots) * 100, 1)
         ELSE 0 
    END as shooting_percentage,
    pss.penalty_minutes,
    pss.saves,
    pss.goals_against,
    pss.save_percentage
FROM players p
JOIN teams t ON p.team_id = t.id
LEFT JOIN player_season_stats pss ON p.id = pss.player_id
WHERE p.active = true;

-- View: Team leaderboard
CREATE VIEW team_leaderboard AS
SELECT 
    p.team_id,
    t.name as team_name,
    pss.season,
    p.first_name || ' ' || p.last_name as player_name,
    p.jersey_number,
    p.position,
    pss.points,
    pss.goals,
    pss.assists,
    ROW_NUMBER() OVER (PARTITION BY p.team_id, pss.season ORDER BY pss.points DESC, pss.goals DESC) as rank_points,
    ROW_NUMBER() OVER (PARTITION BY p.team_id, pss.season ORDER BY pss.goals DESC) as rank_goals
FROM players p
JOIN teams t ON p.team_id = t.id
JOIN player_season_stats pss ON p.id = pss.player_id
WHERE p.active = true;

-- View: Game summary with stats
CREATE VIEW game_summary AS
SELECT 
    g.id,
    g.team_id,
    t.name as team_name,
    g.opponent,
    g.game_date,
    g.status,
    g.final_score_us,
    g.final_score_opponent,
    CASE WHEN g.final_score_us > g.final_score_opponent THEN 'W'
         WHEN g.final_score_us < g.final_score_opponent THEN 'L'
         ELSE 'T'
    END as result,
    COUNT(DISTINCT pgs.player_id) as players_with_stats,
    SUM(pgs.goals) as total_goals,
    SUM(pgs.assists) as total_assists,
    SUM(pgs.shots) as total_shots
FROM games g
JOIN teams t ON g.team_id = t.id
LEFT JOIN player_game_stats pgs ON g.id = pgs.game_id
WHERE g.status = 'completed'
GROUP BY g.id, t.name;

-- Function: Update player game stats from events
CREATE OR REPLACE FUNCTION update_player_game_stats(p_game_id UUID, p_player_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO player_game_stats (game_id, player_id, goals, assists, shots, shots_blocked, hits, takeaways, giveaways, faceoff_wins, faceoff_losses, penalty_minutes, saves, goals_against)
    SELECT 
        p_game_id,
        p_player_id,
        COALESCE(SUM(CASE WHEN event_type = 'goal' THEN 1 ELSE 0 END), 0) as goals,
        COALESCE(SUM(CASE WHEN event_type = 'assist' THEN 1 ELSE 0 END), 0) as assists,
        COALESCE(SUM(CASE WHEN event_type = 'shot' THEN 1 ELSE 0 END), 0) as shots,
        COALESCE(SUM(CASE WHEN event_type = 'shot_blocked' THEN 1 ELSE 0 END), 0) as shots_blocked,
        COALESCE(SUM(CASE WHEN event_type = 'hit' THEN 1 ELSE 0 END), 0) as hits,
        COALESCE(SUM(CASE WHEN event_type = 'takeaway' THEN 1 ELSE 0 END), 0) as takeaways,
        COALESCE(SUM(CASE WHEN event_type = 'giveaway' THEN 1 ELSE 0 END), 0) as giveaways,
        COALESCE(SUM(CASE WHEN event_type = 'faceoff_win' THEN 1 ELSE 0 END), 0) as faceoff_wins,
        COALESCE(SUM(CASE WHEN event_type = 'faceoff_loss' THEN 1 ELSE 0 END), 0) as faceoff_losses,
        COALESCE(SUM(CASE WHEN event_type = 'penalty' THEN COALESCE((metadata->>'minutes')::INTEGER, 2) ELSE 0 END), 0) as penalty_minutes,
        COALESCE(SUM(CASE WHEN event_type = 'save' THEN 1 ELSE 0 END), 0) as saves,
        COALESCE(SUM(CASE WHEN event_type = 'goal_against' THEN 1 ELSE 0 END), 0) as goals_against
    FROM game_events 
    WHERE game_id = p_game_id AND player_id = p_player_id
    ON CONFLICT (game_id, player_id) 
    DO UPDATE SET
        goals = EXCLUDED.goals,
        assists = EXCLUDED.assists,
        shots = EXCLUDED.shots,
        shots_blocked = EXCLUDED.shots_blocked,
        hits = EXCLUDED.hits,
        takeaways = EXCLUDED.takeaways,
        giveaways = EXCLUDED.giveaways,
        faceoff_wins = EXCLUDED.faceoff_wins,
        faceoff_losses = EXCLUDED.faceoff_losses,
        penalty_minutes = EXCLUDED.penalty_minutes,
        saves = EXCLUDED.saves,
        goals_against = EXCLUDED.goals_against,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Update season stats for a player
CREATE OR REPLACE FUNCTION update_player_season_stats(p_player_id UUID, p_season VARCHAR(20))
RETURNS VOID AS $$
BEGIN
    INSERT INTO player_season_stats (
        player_id, season, games_played, goals, assists, shots, shots_blocked, hits, 
        takeaways, giveaways, faceoff_wins, faceoff_losses, penalty_minutes, saves, goals_against
    )
    SELECT 
        p_player_id,
        p_season,
        COUNT(DISTINCT pgs.game_id) as games_played,
        SUM(pgs.goals) as goals,
        SUM(pgs.assists) as assists,
        SUM(pgs.shots) as shots,
        SUM(pgs.shots_blocked) as shots_blocked,
        SUM(pgs.hits) as hits,
        SUM(pgs.takeaways) as takeaways,
        SUM(pgs.giveaways) as giveaways,
        SUM(pgs.faceoff_wins) as faceoff_wins,
        SUM(pgs.faceoff_losses) as faceoff_losses,
        SUM(pgs.penalty_minutes) as penalty_minutes,
        SUM(pgs.saves) as saves,
        SUM(pgs.goals_against) as goals_against
    FROM player_game_stats pgs
    JOIN games g ON pgs.game_id = g.id
    JOIN teams t ON g.team_id = t.id
    WHERE pgs.player_id = p_player_id 
      AND t.season = p_season
      AND g.status = 'completed'
    GROUP BY pgs.player_id
    ON CONFLICT (player_id, season)
    DO UPDATE SET
        games_played = EXCLUDED.games_played,
        goals = EXCLUDED.goals,
        assists = EXCLUDED.assists,
        shots = EXCLUDED.shots,
        shots_blocked = EXCLUDED.shots_blocked,
        hits = EXCLUDED.hits,
        takeaways = EXCLUDED.takeaways,
        giveaways = EXCLUDED.giveaways,
        faceoff_wins = EXCLUDED.faceoff_wins,
        faceoff_losses = EXCLUDED.faceoff_losses,
        penalty_minutes = EXCLUDED.penalty_minutes,
        saves = EXCLUDED.saves,
        goals_against = EXCLUDED.goals_against,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update stats when game events are added
CREATE OR REPLACE FUNCTION trigger_update_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update player game stats
    PERFORM update_player_game_stats(NEW.game_id, NEW.player_id);
    
    -- Get season from game and update season stats
    PERFORM update_player_season_stats(
        NEW.player_id, 
        (SELECT t.season FROM games g JOIN teams t ON g.team_id = t.id WHERE g.id = NEW.game_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_event_stats_update
    AFTER INSERT OR UPDATE ON game_events
    FOR EACH ROW
    WHEN (NEW.player_id IS NOT NULL)
    EXECUTE FUNCTION trigger_update_stats();

-- Function: Get top performers for a team/season
CREATE OR REPLACE FUNCTION get_top_performers(p_team_id UUID, p_season VARCHAR(20), p_stat_type VARCHAR(20), p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    player_name TEXT,
    jersey_number INTEGER,
    position VARCHAR(20),
    stat_value INTEGER,
    games_played INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (pl.first_name || ' ' || pl.last_name)::TEXT,
        pl.jersey_number,
        pl.position,
        CASE 
            WHEN p_stat_type = 'points' THEN pss.points
            WHEN p_stat_type = 'goals' THEN pss.goals
            WHEN p_stat_type = 'assists' THEN pss.assists
            WHEN p_stat_type = 'shots' THEN pss.shots
            WHEN p_stat_type = 'hits' THEN pss.hits
            WHEN p_stat_type = 'penalty_minutes' THEN pss.penalty_minutes
            ELSE 0
        END as stat_value,
        pss.games_played
    FROM players pl
    JOIN player_season_stats pss ON pl.id = pss.player_id
    WHERE pl.team_id = p_team_id 
      AND pss.season = p_season
      AND pl.active = true
    ORDER BY stat_value DESC, pl.last_name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
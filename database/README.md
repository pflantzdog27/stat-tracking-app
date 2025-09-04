# Hockey Stats Database Schema

Complete PostgreSQL database schema for hockey team statistics tracking with real-time capabilities and comprehensive stat management.

## Files

- `01_schema.sql` - Core database tables and structure
- `02_indexes_constraints.sql` - Performance indexes, constraints, and triggers
- `03_sample_data.sql` - Realistic sample data for testing
- `04_functions_views.sql` - Utility functions and views for common queries
- `setup.sql` - Master setup script that runs all files in order

## Quick Setup

```bash
# Create database
createdb hockey_stats

# Run complete setup
psql hockey_stats -f setup.sql
```

## Database Structure

### Core Tables

**users** - Authentication and user management
- Supports admin, coach, and viewer roles
- Password hashing for security

**teams** - Team information by season
- Tracks division, season, and creation metadata

**team_members** - User access control per team
- Role-based permissions (admin, coach, viewer)

**players** - Player roster management
- Jersey numbers, positions, active status
- Unique constraints prevent number conflicts

**games** - Game scheduling and results
- Status tracking (scheduled, in_progress, completed)
- Real-time period and score tracking

**game_events** - Flexible event logging system
- All stat types (goals, assists, shots, penalties, etc.)
- JSONB metadata for event-specific data
- Real-time stat entry capabilities

**player_game_stats** - Pre-computed game statistics
- Performance optimization for queries
- Auto-updated via triggers

**player_season_stats** - Aggregated season statistics  
- Computed fields (points, percentages)
- Auto-updated from game stats

### Key Features

**Real-time Updates**
- Triggers automatically update stats when events are added
- Optimized for live stat entry during games

**Flexible Event System**
- Single table handles all stat types
- JSONB metadata allows custom event data
- Easy to extend for new stat types

**Performance Optimized**
- Comprehensive indexing strategy
- Pre-computed aggregations
- Efficient queries for common operations

**Data Integrity**
- Foreign key constraints
- Check constraints for valid data
- Unique constraints prevent duplicates

## Common Queries

### Get team leaderboard
```sql
SELECT * FROM team_leaderboard 
WHERE team_id = 'your-team-id' AND season = '2024-25'
ORDER BY rank_points;
```

### Get player season stats
```sql
SELECT * FROM player_stats_view 
WHERE team_name = 'Thunder Hawks' AND season = '2024-25';
```

### Get top performers
```sql
SELECT * FROM get_top_performers('team-id', '2024-25', 'points', 10);
```

### Real-time game events
```sql
SELECT * FROM game_events 
WHERE game_id = 'game-id' 
ORDER BY period, time_in_period DESC;
```

## Sample Data

The schema includes realistic sample data:
- 2 teams with full rosters
- Multiple completed and in-progress games  
- Comprehensive game events and statistics
- User accounts with different roles

## Functions & Views

**Views:**
- `player_stats_view` - Player stats with computed fields
- `team_leaderboard` - Ranked player performance
- `game_summary` - Game results with team stats

**Functions:**
- `update_player_game_stats()` - Recompute game stats from events
- `update_player_season_stats()` - Aggregate season totals
- `get_top_performers()` - Flexible stat rankings

## Integration Notes

Designed for use with:
- **Supabase** - Real-time subscriptions on events
- **Next.js** - Server-side rendering and API routes
- **Mobile apps** - Optimized for touch-based stat entry

The flexible event system and pre-computed stats make this ideal for real-time applications where coaches enter stats during games while parents and players view live updates.
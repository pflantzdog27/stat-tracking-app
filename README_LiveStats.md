# Live Stats Entry Interface

A comprehensive real-time statistics entry system optimized for mobile use during hockey games.

## Features

### 🏒 Real-Time Stat Entry
- **Instant Event Recording**: Goals, assists, shots, penalties, hits, saves, and more
- **Live Score Updates**: Automatic score tracking with manual adjustment capabilities
- **Period Management**: Track game periods, overtime, and shootouts
- **Time Tracking**: Real-time game clock with manual time adjustments

### 📱 Mobile-Optimized Interface
- **Touch-Friendly Buttons**: Large, clearly labeled buttons for quick stat entry
- **Quick Player Selection**: Grid view and search interface for rapid player lookup
- **Responsive Design**: Works seamlessly on phones, tablets, and desktop
- **Offline-Ready**: Local caching for network interruptions

### 👥 Player Management
- **Quick Player Grid**: Visual grid showing all players organized by position
- **Smart Search**: Search players by name, jersey number, or position
- **Player Context**: Clear display of selected player with position and number
- **Position-Based Layout**: Forwards, Defense, and Goalies clearly organized

### ⚡ Speed Optimizations
- **One-Tap Actions**: Single touch to record common events
- **Auto-Clear Selection**: Automatically clears player after certain events for quick re-entry  
- **Keyboard Shortcuts**: Quick access for power users
- **Batch Operations**: Record goals with assists in single action

### 🔄 Real-Time Sync
- **Live Updates**: Real-time synchronization across all connected devices
- **Event Broadcasting**: Instant updates to all viewers and coaches
- **Conflict Resolution**: Handles multiple simultaneous entries gracefully
- **Offline Queue**: Queues entries when offline, syncs when reconnected

### ↩️ Undo & Corrections
- **Smart Undo Stack**: Remember last 20 actions with player context
- **One-Tap Undo**: Quickly correct mistakes with single button
- **Visual Feedback**: Clear indication of what will be undone
- **Score Correction**: Automatically adjusts scores when undoing goals

## Interface Components

### GameScoreboard
- **Live Score Display**: Large, clear score display with team names
- **Period Indicator**: Current period with navigation controls
- **Game Clock**: Live time remaining with edit capabilities
- **Quick Score Actions**: +1/-1 buttons for rapid score adjustments
- **Game Status**: Visual indication of game state (scheduled, live, final)

### Player Selection
**QuickPlayerGrid**
- Grid layout showing all active players
- Color-coded by position (Forwards=Blue, Defense=Green, Goalies=Purple)
- Jersey numbers prominently displayed
- Touch-optimized for mobile use

**PlayerSelector**
- Search-based player selection
- Auto-complete with real-time filtering
- Supports search by name, number, or position
- Keyboard navigation support

### Stat Entry Buttons
- **Large Touch Targets**: Minimum 60px height for easy mobile use
- **Visual Feedback**: Clear pressed states and loading indicators
- **Icon + Text**: Clear identification of each stat type
- **Color Coding**: Consistent colors for different event types

### Event Management
**Recent Events Panel**
- Live feed of all game events
- Player context and timing for each event
- Visual indicators for different event types
- Time-stamped entries with "time ago" display

**Undo Panel**
- Visual undo stack with event descriptions
- Player names and timing context
- Batch clear functionality
- Confirmation prompts for safety

## Technical Implementation

### Real-Time Architecture
```typescript
// Real-time event subscription
liveStatsService.subscribeToGameEvents(gameId, (event) => {
  // Handle real-time event updates
  updateEventsList(event)
})

// Real-time game updates (score, period, time)
liveStatsService.subscribeToGameUpdates(gameId, (gameData) => {
  // Update scoreboard in real-time
  updateScoreboard(gameData)
})
```

### Optimized Stat Entry
```typescript
// Single event entry
await liveStatsService.addStatEvent(gameId, userId, {
  playerId: selectedPlayer.id,
  eventType: 'goal',
  period: currentPeriod,
  timeInPeriod: currentTime,
  description: 'Wrist shot from slot'
})

// Batch goal + assist entry
await liveStatsService.recordGoal(
  gameId, 
  userId,
  goalPlayerId,
  [primaryAssistId, secondaryAssistId],
  period,
  time
)
```

### Undo System
```typescript
// Undo last action
const undoneEvent = await liveStatsService.undoLastEvent()
if (undoneEvent.eventData.eventType === 'goal') {
  // Automatically adjust score
  await liveStatsService.updateGameScore(gameId, newScore)
}
```

## Mobile Optimizations

### Touch Interface
- **60px minimum button height** for reliable touch input
- **8px minimum spacing** between interactive elements
- **Visual press feedback** with scale animations
- **Haptic feedback** on supported devices

### Performance
- **Optimistic updates** for instant UI feedback
- **Background sync** for network operations
- **Local caching** of player and game data
- **Lazy loading** of historical events

### Accessibility
- **High contrast colors** for outdoor visibility
- **Large text sizes** for quick reading
- **Voice feedback** for critical actions
- **Screen reader support** for visually impaired users

## Usage Workflow

### Game Setup
1. Select team and game from dropdown menus
2. Verify player roster and game details
3. Start game or switch to in-progress game
4. Begin stat entry

### During Game
1. **Quick Entry**: Select player → tap stat button → done
2. **Complex Events**: Use quick actions for goals with assists
3. **Corrections**: Use undo panel to fix mistakes
4. **Score Updates**: Manual score adjustments as needed

### Common Workflows

**Recording a Goal:**
```
1. Tap goal scorer from player grid
2. Tap "Goal" button
3. Player auto-clears for next action
4. Score auto-increments
```

**Goal with Assists:**
```
1. Tap "Goal + Assists" in quick actions
2. Select goal scorer
3. Select primary assist (optional)
4. Select secondary assist (optional)
5. Tap "Record Goal" 
```

**Recording Penalty:**
```
1. Tap "Record Penalty" in quick actions
2. Select penalized player
3. Choose penalty type from dropdown
4. Confirm minutes and details
5. Submit penalty
```

### Error Handling
- **Network failures**: Queue events locally, sync when reconnected
- **Duplicate events**: Prevention through UI state management  
- **Invalid data**: Client-side validation before submission
- **Server errors**: Clear error messages with retry options

## Integration Points

### Database Events
All stat entries create `game_events` records that automatically:
- Update `player_game_stats` aggregations
- Trigger `player_season_stats` recalculation
- Broadcast real-time updates to subscribed clients
- Log audit trail for stat corrections

### Authentication
- **Role-based access**: Only coaches/admins can enter stats
- **Team isolation**: Users only see their team's games
- **Session management**: Automatic re-authentication
- **Audit logging**: Track who entered which stats

This live stats interface provides coaches with a professional-grade tool for real-time game statistics, optimized for the fast-paced nature of hockey games.
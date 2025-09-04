# Advanced Player Management System

A comprehensive CRUD interface for managing hockey players with detailed profiles, search capabilities, bulk operations, and complete audit trails.

## Features Overview

### 🏒 Enhanced Player Profiles
- **Complete Player Information**: Basic details, contact info, physical stats, emergency contacts
- **Parent/Guardian Management**: Contact information for minors
- **Jersey Number Tracking**: Historical assignment with availability checking
- **Player Status Management**: Active, inactive, injured, suspended states
- **Photo Management**: Player photo upload and display
- **Notes System**: Custom notes and observations for each player

### 📊 Advanced Search & Filtering
- **Multi-Field Search**: Search by name, jersey number, position, or any combination
- **Advanced Filters**: Position, status, age range, jersey range, shooting hand
- **Flexible Sorting**: Sort by name, jersey, position, age, stats, or performance
- **Real-Time Filtering**: Instant results as you type or change filters
- **Filter Persistence**: Remembers your preferred search settings

### 📈 Player Statistics Dashboard
- **Season Stats Overview**: Goals, assists, points, shots, penalties with team rankings
- **Performance Metrics**: Points per game, shooting percentage, save percentage
- **Team Comparisons**: See how players rank against teammates
- **Visual Statistics**: Color-coded stat cards with trend indicators
- **Position-Specific Stats**: Goalie-specific stats (saves, save %) when applicable

### 📋 Bulk Operations
- **Multi-Select Interface**: Choose multiple players for batch operations
- **Bulk Status Updates**: Activate, deactivate, or change status for multiple players
- **Bulk Delete**: Remove multiple players (with safety checks for existing stats)
- **Operation History**: Track bulk changes with audit trails
- **Error Handling**: Clear reporting of successful and failed operations

### 📂 Import/Export System
- **CSV Import**: Bulk import players from spreadsheet data
- **Template Download**: Get properly formatted CSV template with examples
- **Data Validation**: Real-time validation during import with error reporting
- **Export Functionality**: Download complete roster data as CSV
- **Import Preview**: Review and validate data before importing

### 🕐 Player History & Audit Trail
- **Complete History**: Track all changes made to player records
- **Change Timeline**: Visual timeline of player modifications
- **User Attribution**: See who made each change and when
- **Jersey History**: Track jersey number assignments and changes
- **Status Changes**: History of activation, deactivation, and status updates

## Database Schema Enhancements

### Enhanced Players Table
```sql
-- Extended player information
ALTER TABLE players ADD COLUMN 
  email VARCHAR(255),
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  address TEXT,
  height_inches INTEGER,
  weight_lbs INTEGER,
  shoots VARCHAR(1) CHECK (shoots IN ('L', 'R')),
  notes TEXT,
  photo_url TEXT,
  player_status VARCHAR(20) DEFAULT 'active',
  parent_guardian_name VARCHAR(100),
  parent_guardian_email VARCHAR(255),
  parent_guardian_phone VARCHAR(20);
```

### Audit & History Tables
```sql
-- Player change history
CREATE TABLE player_history (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  changed_by UUID REFERENCES users(id),
  change_type VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Jersey number tracking
CREATE TABLE jersey_number_history (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  jersey_number INTEGER,
  player_id UUID REFERENCES players(id),
  assigned_date TIMESTAMP DEFAULT NOW(),
  released_date TIMESTAMP,
  season VARCHAR(20),
  notes TEXT
);
```

## Component Architecture

### Core Components

**EnhancedPlayerForm**
- Tabbed interface: Basic Info, Contact, Physical, Additional
- Real-time validation with user-friendly error messages
- Jersey number availability checking
- Height/weight conversion helpers
- Parent/guardian and emergency contact sections

**PlayerSearch**
- Advanced filtering with collapsible sections
- Real-time search with debounced input
- Range filters for age and jersey numbers
- Active filter indicators and clear functionality
- Sort options with ascending/descending order

**PlayerHistoryTimeline**
- Visual timeline of all player changes
- Color-coded change types with icons
- Detailed before/after value comparisons
- User attribution and timestamps
- Expandable change details

**PlayerStatsDashboard**
- Comprehensive stat display with team context
- Position-specific statistics (goalie stats for goalies)
- Team rankings and comparisons
- Performance metrics and calculated stats
- Visual stat cards with color coding

**BulkPlayerActions**
- Multi-select interface with player name chips
- Bulk operation types: activate, deactivate, update status, delete
- Safety warnings for destructive operations
- Real-time progress and error reporting
- Success/failure summary with details

**PlayerImportExport**
- CSV template download with examples
- File upload with drag-and-drop interface
- Import preview with data validation
- Error reporting for invalid data
- Export functionality for current roster

## Technical Implementation

### Enhanced Player Service
```typescript
class EnhancedPlayerService {
  // Advanced search with filters
  async getPlayersWithDetails(teamId: string, filters?: PlayerSearchFilters)
  
  // Comprehensive player creation
  async createPlayerWithDetails(teamId: string, playerData: PlayerFormData, userId: string)
  
  // Full update capabilities
  async updatePlayerWithDetails(playerId: string, updates: Partial<PlayerFormData>, userId: string)
  
  // History and audit trail
  async getPlayerHistory(playerId: string): Promise<PlayerHistory[]>
  
  // Jersey number management
  async getAvailableJerseyNumbers(teamId: string, season: string)
  
  // Bulk operations
  async bulkImportPlayers(teamId: string, players: PlayerImportData[], userId: string)
  async bulkPlayerOperation(operation: BulkPlayerOperation, userId: string)
  
  // Import/export
  async exportPlayersToCSV(teamId: string): Promise<string>
}
```

### Data Validation & Types
```typescript
interface PlayerFormData {
  // Basic Information
  firstName: string
  lastName: string
  jerseyNumber: number
  position: 'F' | 'D' | 'G' | null
  birthDate?: string
  
  // Contact Information
  email?: string
  phone?: string
  address?: string
  
  // Physical Information
  heightInches?: number
  weightLbs?: number
  shoots?: 'L' | 'R' | null
  
  // Emergency & Guardian Info
  emergencyContactName?: string
  emergencyContactPhone?: string
  parentGuardianName?: string
  parentGuardianEmail?: string
  parentGuardianPhone?: string
  
  // Additional
  notes?: string
  photoUrl?: string
  playerStatus?: 'active' | 'inactive' | 'injured' | 'suspended'
}
```

### Search & Filter System
```typescript
interface PlayerSearchFilters {
  searchTerm?: string
  position?: 'F' | 'D' | 'G' | 'all'
  status?: 'active' | 'inactive' | 'injured' | 'suspended' | 'all'
  ageRange?: { min?: number; max?: number }
  jerseyRange?: { min?: number; max?: number }
  shoots?: 'L' | 'R' | 'all'
  sortBy?: 'name' | 'jersey' | 'position' | 'age' | 'points' | 'goals'
  sortOrder?: 'asc' | 'desc'
}
```

## Key Features in Detail

### Jersey Number Management
- **Availability Checking**: Real-time validation of jersey number conflicts
- **Historical Tracking**: See who previously wore each number
- **Smart Assignment**: Show recently available numbers with context
- **Conflict Prevention**: Cannot assign already-taken numbers

### Player Status Management
- **Four Status Types**: Active, Inactive, Injured, Suspended
- **Visual Indicators**: Color-coded status badges throughout the interface
- **Bulk Status Updates**: Change multiple players' status at once
- **History Tracking**: Complete audit trail of status changes

### Advanced Search Capabilities
- **Real-Time Search**: Instant filtering as you type
- **Multiple Search Fields**: Name, jersey number, position combinations
- **Range Filters**: Age ranges (5-25), jersey ranges (1-99)
- **Compound Filters**: Combine multiple criteria for precise results
- **Smart Sorting**: Sort by performance metrics or basic info

### Import/Export System
- **CSV Template**: Download pre-formatted spreadsheet with examples
- **Flexible Mapping**: Handles various column names and formats
- **Validation Engine**: Checks data integrity before import
- **Error Reporting**: Clear feedback on what went wrong and where
- **Preview Interface**: Review all data before final import

### Bulk Operations
- **Safe Delete**: Prevents deletion of players with existing game stats
- **Status Management**: Bulk activate/deactivate/update status
- **Progress Tracking**: Real-time feedback on operation progress
- **Error Handling**: Detailed success/failure reporting
- **Audit Trail**: All bulk operations logged in player history

## Usage Workflows

### Adding a New Player
1. Click "Add New Player" button
2. Fill out tabbed form (Basic → Contact → Physical → Additional)
3. System validates jersey number availability
4. Real-time validation prevents errors
5. Submit creates player and logs creation in history

### Bulk Import Process
1. Download CSV template with example data
2. Fill out spreadsheet with player information
3. Upload CSV file through import interface
4. Preview imported data with validation feedback
5. Fix any errors and confirm import
6. System creates all valid players and reports any issues

### Advanced Player Search
1. Use basic search box for quick name/number lookup
2. Click "Advanced" to expand filter options
3. Set position, status, age range, jersey range filters
4. Choose sorting preference (name, stats, jersey, etc.)
5. Results update in real-time
6. Export filtered results or perform bulk actions

### Player Management Workflow
1. Search and filter to find specific players
2. Select multiple players using checkboxes
3. Use "Bulk Actions" to activate, deactivate, or update status
4. Review operation results and handle any errors
5. Check player history for audit trail

This comprehensive player management system provides administrators with professional-grade tools for managing hockey team rosters, from individual player profiles to bulk operations, all with complete audit trails and data validation.
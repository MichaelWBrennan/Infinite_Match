-- Real-Time System Database Schema
-- This file contains the database schema for weather, calendar, and event systems

-- Weather Locations Table
CREATE TABLE IF NOT EXISTS weather_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255),
    country VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather Data Table
CREATE TABLE IF NOT EXISTS weather_data (
    id VARCHAR(255) PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    weather_type VARCHAR(50) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    humidity INTEGER NOT NULL,
    pressure DECIMAL(7, 2) NOT NULL,
    wind_speed DECIMAL(5, 2) DEFAULT 0,
    cloud_cover INTEGER DEFAULT 0,
    gameplay_effects JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Events Table
CREATE TABLE IF NOT EXISTS game_events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    requirements JSONB,
    rewards JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Progress Table
CREATE TABLE IF NOT EXISTS event_progress (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL REFERENCES game_events(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    progress_data JSONB NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, player_id)
);

-- Event Completions Table
CREATE TABLE IF NOT EXISTS event_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL REFERENCES game_events(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rewards_claimed BOOLEAN DEFAULT false,
    UNIQUE(event_id, player_id)
);

-- Player Locations Table
CREATE TABLE IF NOT EXISTS player_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255),
    country VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weather_locations_player_id ON weather_locations(player_id);
CREATE INDEX IF NOT EXISTS idx_weather_locations_active ON weather_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_weather_data_location ON weather_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp ON weather_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_weather_data_expires ON weather_data(expires_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_active ON calendar_events(is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_events_timezone ON calendar_events(timezone);

CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_start_time ON game_events(start_time);
CREATE INDEX IF NOT EXISTS idx_game_events_end_time ON game_events(end_time);
CREATE INDEX IF NOT EXISTS idx_game_events_active ON game_events(is_active);
CREATE INDEX IF NOT EXISTS idx_game_events_priority ON game_events(priority);

CREATE INDEX IF NOT EXISTS idx_event_progress_event_id ON event_progress(event_id);
CREATE INDEX IF NOT EXISTS idx_event_progress_player_id ON event_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_event_progress_completed ON event_progress(is_completed);

CREATE INDEX IF NOT EXISTS idx_event_completions_event_id ON event_completions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_completions_player_id ON event_completions(player_id);
CREATE INDEX IF NOT EXISTS idx_event_completions_completed_at ON event_completions(completed_at);

CREATE INDEX IF NOT EXISTS idx_player_locations_player_id ON player_locations(player_id);
CREATE INDEX IF NOT EXISTS idx_player_locations_active ON player_locations(is_active);

-- Functions for cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_weather_data()
RETURNS void AS $$
BEGIN
    DELETE FROM weather_data WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS void AS $$
BEGIN
    UPDATE calendar_events 
    SET is_active = false, updated_at = NOW() 
    WHERE end_time < NOW() AND is_active = true;
    
    UPDATE game_events 
    SET is_active = false, updated_at = NOW() 
    WHERE end_time < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weather_locations_updated_at
    BEFORE UPDATE ON weather_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_events_updated_at
    BEFORE UPDATE ON game_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_progress_updated_at
    BEFORE UPDATE ON event_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_locations_updated_at
    BEFORE UPDATE ON player_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE OR REPLACE VIEW active_weather_data AS
SELECT 
    wd.*,
    wl.player_id,
    wl.timezone as player_timezone
FROM weather_data wd
JOIN weather_locations wl ON wd.latitude = wl.latitude AND wd.longitude = wl.longitude
WHERE wd.expires_at > NOW() AND wl.is_active = true;

CREATE OR REPLACE VIEW active_calendar_events AS
SELECT 
    ce.*,
    CASE 
        WHEN ce.start_time <= NOW() AND ce.end_time >= NOW() THEN true
        ELSE false
    END as is_ongoing,
    CASE 
        WHEN ce.start_time > NOW() THEN true
        ELSE false
    END as is_upcoming,
    EXTRACT(EPOCH FROM (ce.end_time - ce.start_time))/60 as duration_minutes,
    EXTRACT(EPOCH FROM (ce.end_time - NOW()))/60 as time_remaining_minutes
FROM calendar_events ce
WHERE ce.is_active = true;

CREATE OR REPLACE VIEW active_game_events AS
SELECT 
    ge.*,
    CASE 
        WHEN ge.start_time <= NOW() AND ge.end_time >= NOW() THEN true
        ELSE false
    END as is_ongoing,
    CASE 
        WHEN ge.start_time > NOW() THEN true
        ELSE false
    END as is_upcoming,
    EXTRACT(EPOCH FROM (ge.end_time - ge.start_time))/60 as duration_minutes,
    EXTRACT(EPOCH FROM (ge.end_time - NOW()))/60 as time_remaining_minutes
FROM game_events ge
WHERE ge.is_active = true;

-- Sample data for testing
INSERT INTO weather_locations (player_id, latitude, longitude, location_name, country, timezone) VALUES
('test_player_1', 51.5074, -0.1278, 'London', 'GB', 'Europe/London'),
('test_player_2', 40.7128, -74.0060, 'New York', 'US', 'America/New_York'),
('test_player_3', 35.6762, 139.6503, 'Tokyo', 'JP', 'Asia/Tokyo')
ON CONFLICT DO NOTHING;

INSERT INTO calendar_events (id, title, description, event_type, start_time, end_time, timezone, priority) VALUES
('daily_reset_1', 'Daily Reset', 'Daily rewards and challenges have been reset', 'daily_reset', 
 NOW(), NOW() + INTERVAL '1 hour', 'UTC', 1),
('weekly_tournament_1', 'Weekly Tournament', 'Compete for the top spot and win amazing rewards!', 'tournament', 
 NOW() + INTERVAL '1 day', NOW() + INTERVAL '8 days', 'UTC', 2),
('seasonal_event_1', 'Spring Festival', 'Celebrate the spring season with special rewards!', 'seasonal', 
 NOW() + INTERVAL '2 days', NOW() + INTERVAL '32 days', 'UTC', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_events (id, title, description, event_type, start_time, end_time, timezone, priority, requirements, rewards) VALUES
('daily_challenge_1', 'Daily Challenge', 'Complete 5 levels to earn bonus rewards!', 'daily_challenge', 
 NOW(), NOW() + INTERVAL '24 hours', 'UTC', 1, 
 '{"levels_completed": 5}', '{"coins": 500, "gems": 50, "energy": 5}'),
('weather_event_1', 'Rainy Day Bonus', 'Earn extra coins during rainy weather!', 'weather_event', 
 NOW(), NOW() + INTERVAL '4 hours', 'UTC', 3, 
 '{"weather_matches": 1}', '{"coins": 800, "gems": 80, "energy": 3}'),
('special_offer_1', 'Double Coins Hour', 'Earn double coins for the next hour!', 'special_offer', 
 NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'UTC', 4, 
 '{"matches_made": 10}', '{"coins": 1000, "coin_multiplier": 2}')
ON CONFLICT (id) DO NOTHING;
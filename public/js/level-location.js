/* Device-local coarse preferences. GPS is used ONLY by the explicit button below;
   its coordinates are rounded on-device to a 1-degree grid before any transmission. */
(function (root) {
    'use strict';
    const storageKey = 'infinite_match_level_location_v1';
    let lastContext = null;
    let lastPreferencesKey = null;
    let clockOffsetMs = 0;
    let refreshTimer = null;
    let requestVersion = 0;
    let regionsVersion = 0;
    let saveVersion = 0;
    let refreshing = null;
    let retryAfterMs = 0;
    const el = (id) => document.getElementById(id);
    const correctedNow = () => Date.now() + clockOffsetMs;
    const missing = (value) => value === undefined || value === null || value === '';
    const roundCoordinate = (value) => missing(value) ? null : Math.round(Number(value));
    const canonicalZone = (zone) => new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;

    function preferences() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        } catch { return {}; }
    }

    function current() {
        const saved = preferences();
        const value = {
            timeZone: saved.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            country: saved.country || '', region: saved.region || '', hemisphere: saved.hemisphere || '',
            holidayThemes: saved.holidayThemes !== false,
            timeOfDayEnabled: saved.timeOfDayEnabled !== false, weatherEnabled: saved.weatherEnabled !== false,
        };
        if (value.weatherEnabled && (!missing(saved.weatherLatitude) || !missing(saved.weatherLongitude))) {
            value.weatherLatitude = roundCoordinate(saved.weatherLatitude);
            value.weatherLongitude = roundCoordinate(saved.weatherLongitude);
        }
        return value;
    }

    function query(location = current()) {
        const params = new URLSearchParams({ rulesVersion: String(root.InfiniteLevels.GENERATOR_VERSION) });
        for (const [key, value] of Object.entries(location)) {
            if (location.weatherEnabled === false && ['weatherLatitude', 'weatherLongitude'].includes(key)) continue;
            if (value !== '' && value != null) params.set(key, String(value));
        }
        return params.toString();
    }

    function preferenceKey(location) {
        return JSON.stringify([canonicalZone(location.timeZone), location.country || '', location.region || '', location.hemisphere || '',
            location.holidayThemes !== false, location.timeOfDayEnabled !== false, location.weatherEnabled !== false,
            location.weatherEnabled === false ? null : roundCoordinate(location.weatherLatitude),
            location.weatherEnabled === false ? null : roundCoordinate(location.weatherLongitude)]);
    }

    function rememberContext(context, location = current(), serverTime = null) {
        if (!context || context.clockSource !== 'server' || context.offline) return;
        lastContext = JSON.parse(JSON.stringify(context));
        lastPreferencesKey = preferenceKey(location);
        const instant = Date.parse(serverTime || context.evaluatedAt);
        if (context.clockSource === 'server' && Number.isFinite(instant)) clockOffsetMs = instant - Date.now();
    }

    // Offline weather is never invented. Reuse only an unexpired forecast for the
    // exact same preferences/rounded area; keep holidays only for their local day.
    function offlineContext(location = current(), now = new Date(correctedNow())) {
        const timeZone = canonicalZone(location.timeZone);
        const zones = root.InfiniteLevels.TIME_ZONE_REGIONS;
        const estimate = zones[location.timeZone] || zones[timeZone];
        const samePreferences = lastContext && lastPreferencesKey === preferenceKey(location);
        const country = location.country || estimate?.country || (samePreferences ? lastContext.country : null) || null;
        const hemisphere = location.hemisphere || (country && country !== estimate?.country
            ? Object.values(zones).find((entry) => entry.country === country)?.hemisphere : estimate?.hemisphere) || 'north';
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
            timeZone, year: 'numeric', month: '2-digit', day: '2-digit', calendar: 'gregory', numberingSystem: 'latn',
        }).formatToParts(now).map((part) => [part.type, part.value]));
        const month = Number(parts.month);
        const north = ['winter', 'spring', 'summer', 'autumn'][Math.floor((month % 12) / 3)];
        const south = { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' };
        const date = `${parts.year}-${parts.month}-${parts.day}`;
        const weatherEnabled = location.weatherEnabled !== false;
        const cachedWeather = samePreferences && weatherEnabled && lastContext.weather?.available
            && Date.parse(lastContext.weather.expiresAt) > now.getTime() ? lastContext.weather : null;
        const clock = root.InfiniteLevels.timeOfDayContext(now.getTime(), timeZone, location.timeOfDayEnabled !== false);
        const refreshDates = [clock.nextChangeAt, cachedWeather?.expiresAt].filter(Boolean).map(Date.parse);
        const environmentRefreshAt = refreshDates.length ? new Date(Math.min(...refreshDates)).toISOString() : null;
        return {
            timeZone, country, region: location.region || null, hemisphere,
            localDate: date, year: Number(parts.year), month, day: Number(parts.day),
            evaluatedAt: now.toISOString(), clockSource: 'device', timeOfDay: clock,
            season: hemisphere === 'south' ? south[north] : north,
            holidays: samePreferences && lastContext.localDate === date
                && location.holidayThemes !== false ? lastContext.holidays : [],
            holidayThemes: location.holidayThemes !== false, timeOfDayEnabled: location.timeOfDayEnabled !== false,
            weatherEnabled,
            ...(!missing(location.weatherLatitude) ? { weatherLatitude: roundCoordinate(location.weatherLatitude), weatherLongitude: roundCoordinate(location.weatherLongitude) } : {}),
            weather: cachedWeather ? JSON.parse(JSON.stringify(cachedWeather)) : {
                available: false, condition: weatherEnabled ? 'unknown' : 'disabled', source: weatherEnabled ? 'unavailable' : 'disabled',
                temperatureBand: 'unknown', windBand: 'calm', area: null, expiresAt: null, reason: 'offline',
            },
            locationSource: location.country ? 'player_setting' : estimate ? 'time_zone_estimate' : 'unknown',
            holidayCoverage: false, refreshAt: null, environmentRefreshAt, offline: true,
        };
    }

    // Endless never pauses or charges energy for an environment refresh. Use the
    // newest cached forecast/clock for the NEXT stage, and refresh in background.
    function contextForNewStage(location = current()) {
        const context = offlineContext(location);
        const stale = !lastContext || lastPreferencesKey !== preferenceKey(location)
            || lastContext.localDate !== context.localDate
            || Date.parse(lastContext.environmentRefreshAt || lastContext.refreshAt) <= correctedNow();
        if (stale && !refreshing && !document.hidden && correctedNow() >= retryAfterMs) refreshPreview();
        return context;
    }

    async function refreshPreview() {
        clearTimeout(refreshTimer);
        if (document.hidden) return;
        const version = ++requestVersion;
        const location = current();
        const task = (async () => {
            try {
                const response = await fetch(`/api/levels/daily?${query(location)}`, { signal: AbortSignal.timeout(10000) });
                const body = await response.json();
                if (version !== requestVersion || preferenceKey(location) !== preferenceKey(current())) return;
                if (!response.ok || !body.success) throw new Error(body.error || 'Unavailable');
                retryAfterMs = 0;
                const definition = body.level;
                rememberContext(definition.context, location, body.serverTime);
                if (el('daily-level-preview')) el('daily-level-preview').textContent =
                    `${definition.theme.name} · ${definition.theme.environmentLabel} · ${lastContext.localDate}. Time/weather variants; active boards stay fixed.`;
                if (el('level-location-summary')) el('level-location-summary').textContent =
                    `${lastContext.country || 'Global'}${lastContext.region ? ` / ${lastContext.region}` : ''} · ${lastContext.timeZone} · ${lastContext.season}`;
                if (el('level-weather-summary')) el('level-weather-summary').textContent = lastContext.weather?.available
                    ? `${lastContext.weather.attribution.name} forecast: ${lastContext.weather.condition.replaceAll('_', ' ')} · ${lastContext.weather.temperatureC}°C. Forecast time ${lastContext.weather.forecastAt}. ${lastContext.weather.area.label} (not exact town weather).`
                    : 'Weather unavailable or disabled; clock/season levels still work. No weather observations are invented.';
                const next = lastContext.environmentRefreshAt || lastContext.refreshAt;
                const delay = Math.max(1000, Date.parse(next) - Date.parse(body.serverTime) + 250);
                // Inactivity and long-suspended tabs are also handled by focus/visibility.
                refreshTimer = setTimeout(refreshPreview, Math.min(delay, 2147483647));
            } catch {
                if (version !== requestVersion) return;
                retryAfterMs = correctedNow() + 60000;
                if (el('daily-level-preview')) el('daily-level-preview').textContent = 'Offline clock/season variant available. Reconnect for fresh regional forecasts.';
                refreshTimer = setTimeout(refreshPreview, 60000);
            }
        })();
        refreshing = task;
        try { await task; } finally { if (refreshing === task) refreshing = null; }
    }

    function options(select, entries, automatic) {
        select.replaceChildren();
        const first = document.createElement('option');
        first.value = ''; first.textContent = automatic; select.append(first);
        for (const entry of entries) {
            const option = document.createElement('option');
            option.value = entry.code; option.textContent = entry.name; select.append(option);
        }
    }

    async function loadRegions() {
        const version = ++regionsVersion;
        const country = el('level-country')?.value || lastContext?.country || '';
        const select = el('level-region');
        if (!select) return;
        options(select, [], 'Country-wide holidays');
        try {
            const response = await fetch(`/api/levels/regions${country ? `?country=${encodeURIComponent(country)}` : ''}`);
            const body = await response.json();
            if (version !== regionsVersion || !response.ok) return;
            options(select, body.regions, 'Country-wide holidays');
            const saved = preferences();
            if (saved.country === country) select.value = saved.region || '';
        } catch { /* Country-wide seasonal play remains available. */ }
    }

    function useWeatherLocation() {
        const message = el('level-location-message');
        if (!root.navigator?.geolocation) { message.textContent = 'Device location is unavailable. Regional weather still works.'; return; }
        message.textContent = 'Only a rounded 1° area is kept. Your browser will ask for location permission.';
        root.navigator.geolocation.getCurrentPosition((position) => {
            el('level-weather-latitude').value = String(Math.round(position.coords.latitude));
            el('level-weather-longitude').value = String(Math.round(position.coords.longitude));
            message.textContent = 'Approximate area filled in; exact coordinates were not stored or sent. Apply settings to use it.';
        }, () => { message.textContent = 'Location permission denied or unavailable. Regional weather remains available.'; },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    }

    function clearWeatherLocation() {
        el('level-weather-latitude').value = ''; el('level-weather-longitude').value = '';
        el('level-location-message').textContent = 'Regional estimate selected. Apply settings to save.';
    }

    async function save() {
        const version = ++saveVersion;
        const message = el('level-location-message');
        const candidate = {
            timeZone: el('level-time-zone').value, country: el('level-country').value,
            region: el('level-region').value, hemisphere: el('level-hemisphere').value,
            holidayThemes: el('level-holiday-themes').checked,
            timeOfDayEnabled: el('level-time-effects').checked, weatherEnabled: el('level-weather-effects').checked,
        };
        const latitude = el('level-weather-latitude').value;
        const longitude = el('level-weather-longitude').value;
        if (!missing(latitude) || !missing(longitude)) {
            // Reject invalid ranges BEFORE rounding, never silently clamp them.
            if (missing(latitude) || missing(longitude) || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))
                || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) {
                message.textContent = 'Enter both valid coordinates, or clear the area to use the regional estimate.'; return;
            }
            candidate.weatherLatitude = Math.round(Number(latitude)); candidate.weatherLongitude = Math.round(Number(longitude));
        }
        if (candidate.region && !candidate.country) candidate.country = lastContext?.country || '';
        const location = { ...candidate, timeZone: candidate.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' };
        try {
            message.textContent = 'Checking region…';
            const response = await fetch(`/api/levels/context?${query(location)}`, { signal: AbortSignal.timeout(10000) });
            const body = await response.json();
            if (version !== saveVersion) return;
            if (!response.ok || !body.success) throw new Error(body.error || 'Region unavailable');
            localStorage.setItem(storageKey, JSON.stringify(candidate));
            el('level-country').value = candidate.country;
            rememberContext(body.context, location, body.serverTime);
            message.textContent = 'Saved on this device. Applies to the next board, never a board already in play.';
            await refreshPreview();
        } catch (error) {
            if (version === saveVersion) message.textContent = `Could not save region: ${error.message}. Existing settings are unchanged.`;
        }
    }

    async function init() {
        const country = el('level-country');
        if (!country) return;
        const saved = preferences();
        const timeZones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [current().timeZone];
        options(el('level-time-zone'), timeZones.map((zone) => ({ code: zone, name: zone })), 'Automatic (device time zone)');
        el('level-time-zone').value = saved.timeZone || ''; el('level-hemisphere').value = saved.hemisphere || '';
        el('level-holiday-themes').checked = saved.holidayThemes !== false;
        el('level-time-effects').checked = saved.timeOfDayEnabled !== false; el('level-weather-effects').checked = saved.weatherEnabled !== false;
        el('level-weather-latitude').value = missing(saved.weatherLatitude) ? '' : String(roundCoordinate(saved.weatherLatitude));
        el('level-weather-longitude').value = missing(saved.weatherLongitude) ? '' : String(roundCoordinate(saved.weatherLongitude));
        try {
            const response = await fetch('/api/levels/regions'); const body = await response.json();
            if (response.ok) options(country, body.countries, 'Automatic (coarse time-zone estimate)');
            country.value = saved.country || '';
        } catch { /* Defaults remain playable. */ }
        country.addEventListener('change', loadRegions);
        await refreshPreview(); await loadRegions();
        document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshPreview(); else clearTimeout(refreshTimer); });
        root.addEventListener('focus', refreshPreview);
    }

    root.InfiniteLevelLocation = Object.freeze({ current, query, offlineContext, rememberContext, contextForNewStage, refreshPreview });
    root.saveLevelLocation = save;
    root.useWeatherLocation = useWeatherLocation;
    root.clearWeatherLocation = clearWeatherLocation;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);

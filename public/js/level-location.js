/* Coarse, device-local preferences. No GPS prompt, coordinates or IP geolocation. */
(function (root) {
    'use strict';
    const storageKey = 'infinite_match_level_location_v1';
    let lastContext = null;
    let refreshTimer = null;
    let requestVersion = 0;
    let regionsVersion = 0;
    const el = (id) => document.getElementById(id);

    function preferences() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        } catch { return {}; }
    }

    function current() {
        const saved = preferences();
        return {
            timeZone: saved.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            country: saved.country || '',
            region: saved.region || '',
            hemisphere: saved.hemisphere || '',
            holidayThemes: saved.holidayThemes !== false,
        };
    }

    function query(location = current()) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(location)) if (value !== '' && value != null) params.set(key, String(value));
        return params.toString();
    }

    // When disconnected, keep local day/month and a coarse hemisphere estimate. The
    // full regional holiday calendar is server-side; do not reuse yesterday's holidays.
    function offlineContext(location = current(), now = new Date()) {
        const zones = root.InfiniteLevels.TIME_ZONE_REGIONS;
        const estimate = zones[location.timeZone];
        const country = location.country || estimate?.country || null;
        const hemisphere = location.hemisphere || (country && country !== estimate?.country
            ? Object.values(zones).find((entry) => entry.country === country)?.hemisphere : estimate?.hemisphere) || 'north';
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
            timeZone: location.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
            calendar: 'gregory', numberingSystem: 'latn',
        }).formatToParts(now).map((part) => [part.type, part.value]));
        const month = Number(parts.month);
        const north = ['winter', 'spring', 'summer', 'autumn'][Math.floor((month % 12) / 3)];
        const south = { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' };
        const date = `${parts.year}-${parts.month}-${parts.day}`;
        return {
            timeZone: location.timeZone, country, region: location.region || null, hemisphere,
            localDate: date, year: Number(parts.year), month, day: Number(parts.day),
            season: hemisphere === 'south' ? south[north] : north,
            holidays: lastContext?.localDate === date && lastContext?.timeZone === location.timeZone
                && lastContext?.country === country && lastContext?.region === (location.region || null)
                && lastContext?.holidayThemes === location.holidayThemes ? lastContext.holidays : [],
            holidayThemes: location.holidayThemes,
            locationSource: location.country ? 'player_setting' : estimate ? 'time_zone_estimate' : 'unknown',
            holidayCoverage: false,
            refreshAt: null,
            offline: true,
        };
    }

    async function refreshPreview() {
        const version = ++requestVersion;
        try {
            const response = await fetch(`/api/levels/daily?${query()}`, { signal: AbortSignal.timeout(10000) });
            const body = await response.json();
            if (version !== requestVersion) return;
            if (!response.ok || !body.success) throw new Error(body.error || 'Unavailable');
            const definition = body.level;
            lastContext = definition.context;
            if (el('daily-level-preview')) el('daily-level-preview').textContent =
                `${definition.theme.name} · ${lastContext.localDate}. New board at local midnight.`;
            if (el('level-location-summary')) el('level-location-summary').textContent =
                `${lastContext.country || 'Global'}${lastContext.region ? ` / ${lastContext.region}` : ''} · ${lastContext.timeZone} · ${lastContext.season}`
                + (lastContext.locationSource === 'time_zone_estimate' ? ' (coarse time-zone estimate)' : '');
            clearTimeout(refreshTimer);
            const delay = Math.max(1000, Date.parse(lastContext.refreshAt) - Date.parse(body.serverTime) + 250);
            refreshTimer = setTimeout(refreshPreview, Math.min(delay, 2147483647));
        } catch {
            if (version !== requestVersion) return;
            if (el('daily-level-preview')) el('daily-level-preview').textContent = 'Offline seasonal board available. Reconnect for regional holidays.';
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(refreshPreview, 60000);
        }
    }

    function options(select, entries, automatic) {
        select.replaceChildren();
        const first = document.createElement('option');
        first.value = '';
        first.textContent = automatic;
        select.append(first);
        for (const entry of entries) {
            const option = document.createElement('option');
            option.value = entry.code;
            option.textContent = entry.name;
            select.append(option);
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

    async function save() {
        const message = el('level-location-message');
        const candidate = {
            timeZone: el('level-time-zone').value,
            country: el('level-country').value,
            region: el('level-region').value,
            hemisphere: el('level-hemisphere').value,
            holidayThemes: el('level-holiday-themes').checked,
        };
        // A state override must remain paired with its country when the player travels.
        if (candidate.region && !candidate.country) candidate.country = lastContext?.country || '';
        const location = { ...candidate, timeZone: candidate.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' };
        try {
            message.textContent = 'Checking region…';
            const response = await fetch(`/api/levels/context?${query(location)}`, { signal: AbortSignal.timeout(10000) });
            const body = await response.json();
            if (!response.ok || !body.success) throw new Error(body.error || 'Region unavailable');
            localStorage.setItem(storageKey, JSON.stringify(candidate));
            el('level-country').value = candidate.country;
            lastContext = body.context;
            message.textContent = 'Saved on this device. Applies to your next attempt; an active run is unchanged.';
            await refreshPreview();
        } catch (error) {
            message.textContent = `Could not save region: ${error.message}. Existing settings are unchanged.`;
        }
    }

    async function init() {
        const country = el('level-country');
        if (!country) return;
        const saved = preferences();
        options(el('level-time-zone'), Intl.supportedValuesOf('timeZone').map((zone) => ({ code: zone, name: zone })), 'Automatic (device time zone)');
        el('level-time-zone').value = saved.timeZone || '';
        el('level-hemisphere').value = saved.hemisphere || '';
        el('level-holiday-themes').checked = saved.holidayThemes !== false;
        try {
            const response = await fetch('/api/levels/regions');
            const body = await response.json();
            if (response.ok) options(country, body.countries, 'Automatic (coarse time-zone estimate)');
            country.value = saved.country || '';
        } catch { /* Defaults are still playable without a catalog request. */ }
        country.addEventListener('change', loadRegions);
        await refreshPreview();
        await loadRegions();
        document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshPreview(); });
        root.addEventListener('focus', refreshPreview);
    }

    root.InfiniteLevelLocation = Object.freeze({ current, query, offlineContext, refreshPreview });
    root.saveLevelLocation = save;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);

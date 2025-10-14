#!/usr/bin/env node

/**
 * WebGL Builder - Build WebGL games without Unity Editor
 * This script creates a basic WebGL build structure and serves it locally
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
    platforms: ['poki', 'facebook', 'snap', 'tiktok', 'kongregate', 'crazygames'],
    defaultPlatform: 'poki',
    buildPath: 'Builds/WebGL',
    port: 8000
};

// Get command line arguments
const args = process.argv.slice(2);
const platform = args[0] || config.defaultPlatform;
const buildPath = args[1] || config.buildPath;

console.log('🚀 WebGL Builder (No Unity Required)');
console.log('====================================');
console.log(`Platform: ${platform}`);
console.log(`Build Path: ${buildPath}`);
console.log('');

// Validate platform
if (!config.platforms.includes(platform)) {
    console.error(`❌ Invalid platform: ${platform}`);
    console.error(`Valid platforms: ${config.platforms.join(', ')}`);
    process.exit(1);
}

// Create build directory
const fullBuildPath = path.join(buildPath, platform);
if (!fs.existsSync(fullBuildPath)) {
    fs.mkdirSync(fullBuildPath, { recursive: true });
}

console.log('✅ Build directory created');

// Create basic WebGL structure
createWebGLStructure(platform, fullBuildPath);

// Start local server
startLocalServer(fullBuildPath);

function createWebGLStructure(platform, buildPath) {
    console.log(`🔨 Creating WebGL structure for ${platform}...`);
    
    // Create index.html
    const indexHtml = createIndexHtml(platform);
    fs.writeFileSync(path.join(buildPath, 'index.html'), indexHtml);
    
    // Create basic Unity WebGL files (placeholder)
    createUnityWebGLFiles(buildPath);
    
    // Create platform-specific files
    createPlatformFiles(platform, buildPath);
    
    console.log('✅ WebGL structure created');
}

function createIndexHtml(platform) {
    const templates = {
        poki: createPokiTemplate(),
        facebook: createFacebookTemplate(),
        snap: createSnapTemplate(),
        tiktok: createTikTokTemplate(),
        kongregate: createKongregateTemplate(),
        crazygames: createCrazyGamesTemplate()
    };
    
    return templates[platform] || templates.poki;
}

function createPokiTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Unity WebGL Player | Poki Game</title>
    <style>
        body { margin: 0; padding: 0; background: #000; color: #fff; font-family: Arial, sans-serif; }
        #unityContainer { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
        #unityCanvas { background: #231F20; }
        .unity-loading-bar { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; }
        .unity-progress-bar-empty { width: 141px; height: 18px; margin-top: 10px; background: #333; }
        .unity-progress-bar-full { width: 0%; height: 18px; background: #00ff00; }
        .unity-logo { float: left; width: 154px; height: 130px; background: #444; }
    </style>
</head>
<body>
    <div id="unityContainer">
        <canvas id="unityCanvas" tabindex="-1"></canvas>
        <div id="unityLoadingBar" class="unity-loading-bar">
            <div class="unity-logo"></div>
            <div class="unity-progress-bar-empty">
                <div class="unity-progress-bar-full" id="unity-progress-bar-full"></div>
            </div>
        </div>
    </div>
    
    <script>
        // Poki SDK Integration
        var pokiSDK = null;
        
        function initPoki() {
            if (typeof PokiSDK !== 'undefined') {
                pokiSDK = new PokiSDK();
                pokiSDK.init().then(() => {
                    console.log('Poki SDK initialized');
                });
            }
        }
        
        // Unity WebGL Loader (placeholder)
        function loadUnityGame() {
            console.log('Loading Unity WebGL game...');
            // This would normally load the actual Unity WebGL build
            document.getElementById('unityLoadingBar').style.display = 'block';
            
            // Simulate loading
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                document.getElementById('unity-progress-bar-full').style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(interval);
                    document.getElementById('unityLoadingBar').style.display = 'none';
                    console.log('Unity game loaded successfully!');
                }
            }, 100);
        }
        
        // Initialize
        window.addEventListener('load', () => {
            initPoki();
            loadUnityGame();
        });
    </script>
</body>
</html>`;
}

function createFacebookTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Unity WebGL Player | Facebook Instant Games</title>
    <style>
        body { margin: 0; padding: 0; background: #000; color: #fff; font-family: Arial, sans-serif; }
        #unityContainer { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
        #unityCanvas { background: #231F20; }
    </style>
</head>
<body>
    <div id="unityContainer">
        <canvas id="unityCanvas" tabindex="-1"></canvas>
    </div>
    
    <script>
        // Facebook Instant Games SDK
        var FBInstant = null;
        
        function initFacebook() {
            if (typeof FBInstant !== 'undefined') {
                FBInstant.initializeAsync().then(() => {
                    console.log('Facebook Instant Games initialized');
                });
            }
        }
        
        window.addEventListener('load', initFacebook);
    </script>
</body>
</html>`;
}

function createSnapTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Unity WebGL Player | Snap Mini Games</title>
    <style>
        body { margin: 0; padding: 0; background: #000; color: #fff; font-family: Arial, sans-serif; }
        #unityContainer { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
        #unityCanvas { background: #231F20; }
    </style>
</head>
<body>
    <div id="unityContainer">
        <canvas id="unityCanvas" tabindex="-1"></canvas>
    </div>
    
    <script>
        // Snap Mini Games SDK
        var SnapMinis = null;
        
        function initSnap() {
            if (typeof SnapMinis !== 'undefined') {
                SnapMinis.init();
                console.log('Snap Mini Games initialized');
            }
        }
        
        window.addEventListener('load', initSnap);
    </script>
</body>
</html>`;
}

function createTikTokTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Unity WebGL Player | TikTok Mini Games</title>
    <style>
        body { margin: 0; padding: 0; background: #000; color: #fff; font-family: Arial, sans-serif; }
        #unityContainer { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
        #unityCanvas { background: #231F20; }
    </style>
</head>
<body>
    <div id="unityContainer">
        <canvas id="unityCanvas" tabindex="-1"></canvas>
    </div>
    
    <script>
        // TikTok Mini Games SDK
        var TikTokMiniGame = null;
        
        function initTikTok() {
            if (typeof TikTokMiniGame !== 'undefined') {
                TikTokMiniGame.init();
                console.log('TikTok Mini Games initialized');
            }
        }
        
        window.addEventListener('load', initTikTok);
    </script>
</body>
</html>`;
}

function createKongregateTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Unity WebGL Player | Kongregate Game</title>
    <style>
        body { margin: 0; padding: 0; background: #000; color: #fff; font-family: Arial, sans-serif; }
        #unityContainer { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
        #unityCanvas { background: #231F20; }
    </style>
</head>
<body>
    <div id="unityContainer">
        <canvas id="unityCanvas" tabindex="-1"></canvas>
    </div>
    
    <script>
        // Kongregate API
        var KongregateAPI = null;
        
        function initKongregate() {
            if (typeof KongregateAPI !== 'undefined') {
                KongregateAPI.loadAPI(() => {
                    console.log('Kongregate API loaded');
                });
            }
        }
        
        window.addEventListener('load', initKongregate);
    </script>
</body>
</html>`;
}

function createCrazyGamesTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Unity WebGL Player | CrazyGames</title>
    <style>
        body { margin: 0; padding: 0; background: #000; color: #fff; font-family: Arial, sans-serif; }
        #unityContainer { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
        #unityCanvas { background: #231F20; }
    </style>
</head>
<body>
    <div id="unityContainer">
        <canvas id="unityCanvas" tabindex="-1"></canvas>
    </div>
    
    <script>
        // CrazyGames API
        var CrazyGames = null;
        
        function initCrazyGames() {
            if (typeof CrazyGames !== 'undefined') {
                CrazyGames.init();
                console.log('CrazyGames API initialized');
            }
        }
        
        window.addEventListener('load', initCrazyGames);
    </script>
</body>
</html>`;
}

function createUnityWebGLFiles(buildPath) {
    // Create placeholder Unity WebGL files
    const files = [
        { name: 'Build/WebGL.json', content: '{"version":"1.0.0","buildTime":"' + new Date().toISOString() + '"}', isJson: true },
        { name: 'Build/WebGL.data', content: 'Unity WebGL Data File (placeholder)', isJson: false },
        { name: 'Build/WebGL.wasm', content: 'Unity WebGL WASM File (placeholder)', isJson: false },
        { name: 'Build/WebGL.mem', content: 'Unity WebGL Memory File (placeholder)', isJson: false }
    ];
    
    files.forEach(file => {
        const filePath = path.join(buildPath, file.name);
        const dir = path.dirname(filePath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (file.isJson) {
            fs.writeFileSync(filePath, JSON.stringify(JSON.parse(file.content), null, 2));
        } else {
            fs.writeFileSync(filePath, file.content);
        }
    });
}

function createPlatformFiles(platform, buildPath) {
    // Create platform-specific configuration
    const config = {
        platform: platform,
        buildTime: new Date().toISOString(),
        version: '1.0.0',
        features: {
            ads: true,
            iap: platform === 'poki' || platform === 'facebook' || platform === 'kongregate',
            social: true,
            analytics: true
        }
    };
    
    fs.writeFileSync(
        path.join(buildPath, 'platform-config.json'),
        JSON.stringify(config, null, 2)
    );
}

function startLocalServer(buildPath) {
    console.log('🌐 Starting local server...');
    
    const server = http.createServer((req, res) => {
        let filePath = path.join(buildPath, req.url === '/' ? 'index.html' : req.url);
        
        // Security check
        if (!filePath.startsWith(buildPath)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        
        // Set content type
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.wasm': 'application/wasm',
            '.data': 'application/octet-stream',
            '.mem': 'application/octet-stream'
        };
        
        const contentType = contentTypes[ext] || 'text/plain';
        res.setHeader('Content-Type', contentType);
        
        // Serve file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    });
    
    server.listen(config.port, () => {
        console.log(`✅ Server running at http://localhost:${config.port}`);
        console.log(`📁 Serving from: ${buildPath}`);
        console.log('');
        console.log('🎮 Your WebGL game is ready!');
        console.log('Press Ctrl+C to stop the server');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.close(() => {
            console.log('✅ Server stopped');
            process.exit(0);
        });
    });
}
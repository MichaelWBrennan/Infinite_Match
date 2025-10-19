@echo off
echo Unity Ads Setup Script
echo =====================
echo.

REM Check if game executable exists
if not exist "YourGame.exe" (
    echo Error: YourGame.exe not found!
    echo Please make sure your game executable is in the same directory as this script.
    pause
    exit /b 1
)

echo Setting up Unity Ads...
echo.

REM Set environment variables
set UNITY_ADS_GAME_ID=1234567
set UNITY_ADS_GAME_NAME=My Unity Game
set UNITY_ADS_BUNDLE_ID=com.yourcompany.yourgame
set UNITY_ADS_TEST_MODE=true
set UNITY_ADS_DEBUG_MODE=true

echo Environment variables set:
echo   UNITY_ADS_GAME_ID=%UNITY_ADS_GAME_ID%
echo   UNITY_ADS_GAME_NAME=%UNITY_ADS_GAME_NAME%
echo   UNITY_ADS_BUNDLE_ID=%UNITY_ADS_BUNDLE_ID%
echo   UNITY_ADS_TEST_MODE=%UNITY_ADS_TEST_MODE%
echo   UNITY_ADS_DEBUG_MODE=%UNITY_ADS_DEBUG_MODE%
echo.

REM Run the game with Unity Ads setup
echo Starting game with Unity Ads setup...
YourGame.exe -gameid %UNITY_ADS_GAME_ID% -gamename "%UNITY_ADS_GAME_NAME%" -bundleid %UNITY_ADS_BUNDLE_ID% -testmode -debug -platforms android,ios

echo.
echo Unity Ads setup complete!
echo Check the game console for setup status.
pause
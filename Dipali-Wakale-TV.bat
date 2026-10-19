@echo off
:: ===================================================================
:: DIPALI WAKALE TV — ONE-CLICK FULLSCREEN LAUNCHER FOR CLIENT PC
:: Opens transformation page directly in 100% hardware full screen
:: with NO browser address bar, NO tabs, and NO window borders.
:: ===================================================================

echo Starting Dipali Wakale TV in Full Screen...

:: 1. Check Chrome in 64-bit Program Files
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:3000/tv"
    exit
)

:: 2. Check Chrome in 32-bit Program Files
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk "http://localhost:3000/tv"
    exit
)

:: 3. Check Edge in 32-bit Program Files
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "http://localhost:3000/tv" --edge-kiosk-type=fullscreen
    exit
)

:: 4. Check Edge in 64-bit Program Files
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --kiosk "http://localhost:3000/tv" --edge-kiosk-type=fullscreen
    exit
)

:: 5. Fallback via PATH
start "" chrome.exe --kiosk "http://localhost:3000/tv" 2>nul
if %ERRORLEVEL% EQU 0 exit

start "" msedge.exe --kiosk "http://localhost:3000/tv" --edge-kiosk-type=fullscreen 2>nul
if %ERRORLEVEL% EQU 0 exit

:: 6. Default browser fallback
start "" "http://localhost:3000/tv"
exit

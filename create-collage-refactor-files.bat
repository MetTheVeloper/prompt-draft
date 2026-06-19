@echo off
setlocal

echo Creating collage refactor folders and files...
echo.

call :touch "app\pages\collage.vue"

call :touch "app\composables\collage\useCollagePage.ts"
call :touch "app\composables\collage\useCollageImages.ts"
call :touch "app\composables\collage\useCollageOverlay.ts"
call :touch "app\composables\collage\useCollageRenderer.ts"
call :touch "app\composables\collage\useCollageVideo.ts"
call :touch "app\composables\collage\useCollageExport.ts"

call :touch "app\utils\collage\layout.ts"
call :touch "app\utils\collage\drawing.ts"
call :touch "app\utils\collage\file.ts"
call :touch "app\utils\collage\nativeShare.ts"

call :touch "app\constants\collage.ts"
call :touch "app\types\collage.ts"

echo.
echo Done.
pause
exit /b

:touch
set "FILE=%~1"

for %%D in ("%FILE%") do set "DIR=%%~dpD"

if not exist "%DIR%" (
  mkdir "%DIR%"
)

if exist "%FILE%" (
  echo SKIPPED  %FILE%
) else (
  type nul > "%FILE%"
  echo CREATED  %FILE%
)

exit /b
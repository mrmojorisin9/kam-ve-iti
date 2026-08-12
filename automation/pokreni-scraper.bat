@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Kam denes - scraper

rem Skripta radi bez obzira odakle je pokrenuta (dvoklik u Exploreru,
rem terminal, precica) - uvijek se prvo pozicionira u korijen repoa
rem (jedan direktorij iznad automation\).
cd /d "%~dp0.."

if exist "automation\.venv\Scripts\activate.bat" goto venv_ok
echo GRESKA: automation\.venv ne postoji.
echo Pogledaj automation\README.md za upute o postavljanju.
pause
exit /b 1

:venv_ok
call automation\.venv\Scripts\activate.bat

echo ===============================================
echo   Kam denes - rucno pokretanje scrapera
echo ===============================================
echo.
echo Izvor:
echo   1. emedjimurje  (emedjimurje.net.hr)
echo   2. mnovine      (mnovine.hr)
echo   3. prelog       (prelog.hr)
echo   4. evento       (evento.sh)
echo.
set /p IZVOR_ODABIR="Odaberi izvor (1-4): "

if "%IZVOR_ODABIR%"=="1" set "IZVOR=emedjimurje" & goto nacin
if "%IZVOR_ODABIR%"=="2" set "IZVOR=mnovine" & goto nacin
if "%IZVOR_ODABIR%"=="3" set "IZVOR=prelog" & goto nacin
if "%IZVOR_ODABIR%"=="4" set "IZVOR=evento" & goto nacin

echo.
echo Nepoznat odabir. Pokreni skriptu ponovno i upisi broj od 1 do 4.
pause
exit /b 1

:nacin
echo.
echo Nacin rada:
echo   1. Upis u Supabase bazu (stvaran upis - novi dogadaji idu na cekanje
echo      odobrenja u /admin/dogadjaji, postojeci se azuriraju)
echo   2. Izvoz u CSV (BEZ upisa u bazu - samo pregled sto bi se dogodilo,
echo      datoteka u automation\exports\)
echo.
set /p NACIN_ODABIR="Odaberi nacin (1-2): "

if "%NACIN_ODABIR%"=="1" goto supabase
if "%NACIN_ODABIR%"=="2" goto csv

echo.
echo Nepoznat odabir. Pokreni skriptu ponovno i upisi 1 ili 2.
pause
exit /b 1

:supabase
echo.
echo Pokrecem upis u Supabase bazu za izvor "%IZVOR%"...
echo.
python -m automation.pipeline --source %IZVOR%
goto kraj

:csv
echo.
echo Pokrecem CSV izvoz za izvor "%IZVOR%" (bez upisa u bazu)...
echo.
python -m automation.pipeline --source %IZVOR% --dry-run --export-csv
goto kraj

:kraj
echo.
echo ===============================================
echo Gotovo.
echo ===============================================
pause

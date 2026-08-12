@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Kam denes - scraper

rem Skripta radi bez obzira odakle je pokrenuta (dvoklik u Exploreru,
rem terminal, precica) - uvijek se prvo pozicionira u korijen repoa
rem (jedan direktorij iznad automation\).
cd /d "%~dp0.."

rem ---------------------------------------------------------------
rem UKLJUCI/ISKLJUCI POJEDINE IZVORE - samo za ovu .bat skriptu, ne
rem dira automatski n8n cron (to je odvojena, neovisna postavka).
rem Promijeni "1" u "0" da izvor nestane iz izbornika ispod.
rem ---------------------------------------------------------------
set "EMEDJIMURJE_OMOGUCEN=1"
set "MNOVINE_OMOGUCEN=1"
set "PRELOG_OMOGUCEN=1"
set "EVENTO_OMOGUCEN=1"

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
if "%EMEDJIMURJE_OMOGUCEN%"=="1" echo   1. emedjimurje  (emedjimurje.net.hr)
if not "%EMEDJIMURJE_OMOGUCEN%"=="1" echo   1. emedjimurje  - ISKLJUCENO
if "%MNOVINE_OMOGUCEN%"=="1" echo   2. mnovine      (mnovine.hr)
if not "%MNOVINE_OMOGUCEN%"=="1" echo   2. mnovine      - ISKLJUCENO
if "%PRELOG_OMOGUCEN%"=="1" echo   3. prelog       (prelog.hr)
if not "%PRELOG_OMOGUCEN%"=="1" echo   3. prelog       - ISKLJUCENO
if "%EVENTO_OMOGUCEN%"=="1" echo   4. evento       (evento.sh)
if not "%EVENTO_OMOGUCEN%"=="1" echo   4. evento       - ISKLJUCENO
echo.
set /p IZVOR_ODABIR="Odaberi izvor (1-4): "

if "%IZVOR_ODABIR%"=="1" if not "%EMEDJIMURJE_OMOGUCEN%"=="1" goto izvor_iskljucen
if "%IZVOR_ODABIR%"=="2" if not "%MNOVINE_OMOGUCEN%"=="1" goto izvor_iskljucen
if "%IZVOR_ODABIR%"=="3" if not "%PRELOG_OMOGUCEN%"=="1" goto izvor_iskljucen
if "%IZVOR_ODABIR%"=="4" if not "%EVENTO_OMOGUCEN%"=="1" goto izvor_iskljucen

if "%IZVOR_ODABIR%"=="1" set "IZVOR=emedjimurje" & goto nacin
if "%IZVOR_ODABIR%"=="2" set "IZVOR=mnovine" & goto nacin
if "%IZVOR_ODABIR%"=="3" set "IZVOR=prelog" & goto nacin
if "%IZVOR_ODABIR%"=="4" set "IZVOR=evento" & goto nacin

echo.
echo Nepoznat odabir. Pokreni skriptu ponovno i upisi broj od 1 do 4.
pause
exit /b 1

:izvor_iskljucen
echo.
echo Taj izvor je trenutno ISKLJUCEN (postavka na vrhu pokreni-scraper.bat).
echo Otvori datoteku desnim klikom - Uredi, promijeni "0" natrag u "1" za taj
echo izvor ako ga zelis ponovno ukljuciti u ovaj izbornik.
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

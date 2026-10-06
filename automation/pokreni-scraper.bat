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
set "EVENTINFO_OMOGUCEN=1"

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
if "%EVENTINFO_OMOGUCEN%"=="1" echo   5. eventinfo    (eventinfo.com.hr)
if not "%EVENTINFO_OMOGUCEN%"=="1" echo   5. eventinfo    - ISKLJUCENO
echo   6. Lokalna datoteka (.jsonl s pripremljenim dogadajima)
echo.
set /p IZVOR_ODABIR="Odaberi izvor (1-6): "

if "%IZVOR_ODABIR%"=="1" if not "%EMEDJIMURJE_OMOGUCEN%"=="1" goto izvor_iskljucen
if "%IZVOR_ODABIR%"=="2" if not "%MNOVINE_OMOGUCEN%"=="1" goto izvor_iskljucen
if "%IZVOR_ODABIR%"=="3" if not "%PRELOG_OMOGUCEN%"=="1" goto izvor_iskljucen
if "%IZVOR_ODABIR%"=="4" if not "%EVENTO_OMOGUCEN%"=="1" goto izvor_iskljucen
if "%IZVOR_ODABIR%"=="5" if not "%EVENTINFO_OMOGUCEN%"=="1" goto izvor_iskljucen

if "%IZVOR_ODABIR%"=="1" set "IZVOR=emedjimurje" & goto web_izvor
if "%IZVOR_ODABIR%"=="2" set "IZVOR=mnovine" & goto web_izvor
if "%IZVOR_ODABIR%"=="3" set "IZVOR=prelog" & goto web_izvor
if "%IZVOR_ODABIR%"=="4" set "IZVOR=evento" & goto web_izvor
if "%IZVOR_ODABIR%"=="5" set "IZVOR=eventinfo" & goto web_izvor
if "%IZVOR_ODABIR%"=="6" goto datoteka

echo.
echo Nepoznat odabir. Pokreni skriptu ponovno i upisi broj od 1 do 6.
pause
exit /b 1

:izvor_iskljucen
echo.
echo Taj izvor je trenutno ISKLJUCEN (postavka na vrhu pokreni-scraper.bat).
echo Otvori datoteku desnim klikom - Uredi, promijeni "0" natrag u "1" za taj
echo izvor ako ga zelis ponovno ukljuciti u ovaj izbornik.
pause
exit /b 1

:web_izvor
set "IZVOR_ARG=--source %IZVOR%"
set "IZVOR_OPIS=izvor "%IZVOR%""
goto nacin

:datoteka
echo.
echo Upisi putanju do .jsonl datoteke (ili je povuci misem u ovaj prozor)
echo i pritisni Enter. Format datoteke: automation\README.md, odjeljak
echo "Lokalna JSONL datoteka".
echo.
set "DATOTEKA="
set /p DATOTEKA="Datoteka: "
rem Povlacenje misem dodaje navodnike oko putanje s razmacima - makni ih.
if defined DATOTEKA set "DATOTEKA=!DATOTEKA:"=!"
if not defined DATOTEKA goto datoteka_nema
if not exist "!DATOTEKA!" goto datoteka_nema
set "IZVOR_ARG=--file "!DATOTEKA!""
set "IZVOR_OPIS=datoteku "!DATOTEKA!""
goto nacin

:datoteka_nema
echo.
echo GRESKA: datoteka ne postoji: "!DATOTEKA!"
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
echo Pokrecem upis u Supabase bazu za !IZVOR_OPIS!...
echo.
python -m automation.pipeline !IZVOR_ARG!
goto kraj

:csv
echo.
echo Pokrecem CSV izvoz za !IZVOR_OPIS! (bez upisa u bazu)...
echo.
python -m automation.pipeline !IZVOR_ARG! --dry-run --export-csv
goto kraj

:kraj
echo.
echo ===============================================
echo Gotovo.
echo ===============================================
pause

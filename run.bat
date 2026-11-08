@echo off
title Launcher Program Optimasi Komputasi Awan - Kelompok 1
cls
echo ===============================================================================
echo       MENU UTAMA PROGRAM PENJADWALAN CLOUD: AOA VS RANDOM SCHEDULING
echo       Dataset Minggu 3: 100 s.d 500 Cloudlets ^| 3 Datacenter ^| 10 VM
echo ===============================================================================
echo.
echo   [1] Jalankan Program Python (AOA vs Random Eksekusi Dataset Nyata)
echo   [2] Jalankan Program Java CloudSim 7.0.1 (AOASchedulingSim)
echo   [3] Buka Slide Presentasi Interaktif 3D Three.js di Browser
echo   [4] Keluar
echo.
echo ===============================================================================
set /p pilihan="Pilih menu [1-4]: "

if "%pilihan%"=="1" goto run_python
if "%pilihan%"=="2" goto run_java
if "%pilihan%"=="3" goto open_html
if "%pilihan%"=="4" goto selesai

:run_python
cls
cd /d "%~dp002_Implementasi_Real_World"
python program_aoa_vs_random.py
echo.
pause
goto selesai

:run_java
cls
cd /d "%~dp002_Implementasi_Real_World"
set "JAVA_HOME=C:\Users\FAQIH\.jdks\jbr-21.0.11"
set "PATH=%JAVA_HOME%\bin;%~dp0..\Proggram\apache-maven-3.9.6\bin;%PATH%"
call "%~dp0..\Proggram\apache-maven-3.9.6\bin\mvn.cmd" compile exec:java
echo.
pause
goto selesai

:open_html
cls
cd /d "%~dp002_Implementasi_Real_World"
start presentasi_implementasi.html
goto selesai

:selesai
echo.
echo Selesai.

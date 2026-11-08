@echo off
title Simulator CloudSim Java - AOASchedulingSim
cls
echo ===============================================================================
echo   MENJALANKAN SIMULATOR CLOUDSIM JAVA: AOASchedulingSim.java (Java 21)
echo ===============================================================================
set "JAVA_HOME=C:\Users\FAQIH\.jdks\jbr-21.0.11"
set "PATH=%JAVA_HOME%\bin;%~dp0..\..\Proggram\apache-maven-3.9.6\bin;%PATH%"
call "%~dp0..\..\Proggram\apache-maven-3.9.6\bin\mvn.cmd" compile exec:java
echo.
pause

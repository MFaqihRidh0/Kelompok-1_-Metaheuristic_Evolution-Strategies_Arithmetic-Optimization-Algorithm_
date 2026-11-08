# ==============================================================================
# Script Runner CloudSim Java (AOASchedulingSim) untuk PowerShell
# ==============================================================================

$JAVA_PATH = "C:\Users\FAQIH\.jdks\jbr-21.0.11"
$MAVEN_PATH = "$PSScriptRoot\..\..\Proggram\apache-maven-3.9.6\bin"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "   MENJALANKAN SIMULATOR CLOUDSIM: AOASchedulingSim.java (Java 21)" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Cyan

$env:JAVA_HOME = $JAVA_PATH
$env:PATH = "$JAVA_PATH\bin;$MAVEN_PATH;$env:PATH"

& "$MAVEN_PATH\mvn.cmd" compile exec:java

@ECHO OFF
@REM Apache Maven Wrapper startup script (simplified) — delegates all download/bootstrap
@REM logic to org.apache.maven.wrapper.MavenWrapperMain, packaged in
@REM .mvn/wrapper/maven-wrapper.jar. That class reads .mvn/wrapper/maven-wrapper.properties,
@REM downloads the Maven distribution referenced there on first run (cached afterwards
@REM under %USERPROFILE%\.m2\wrapper), and then runs it with the arguments below.

SETLOCAL

SET MAVEN_PROJECTBASEDIR=%~dp0
IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

SET WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar

IF NOT EXIST "%WRAPPER_JAR%" (
  ECHO Cannot find %WRAPPER_JAR% - run this from the project root. 1>&2
  EXIT /B 1
)

IF "%JAVA_HOME%"=="" (
  SET JAVA_EXE=java
) ELSE (
  SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
)

"%JAVA_EXE%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*

ENDLOCAL

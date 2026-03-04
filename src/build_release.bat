@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\kssms\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%PATH%"
set "GRADLE_OPTS=-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
set "JAVA_TOOL_OPTIONS=-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
cd /d c:\Users\kssms\Downloads\juz-amin-recite-main\android
call gradlew.bat bundleRelease
echo.
echo ===================================
echo AAB OUTPUT:
echo android\app\build\outputs\bundle\release\app-release.aab
echo ===================================

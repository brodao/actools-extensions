@echo off
setlocal

:: -- Splash
echo ----------------------------------------------------
echo .[====].[====].(----).(----).\___/.[___].]@!--Y\_  
echo   _o__o___o__o___o__o___o__o___o_o___o_o___O___oo_\
echo       AC Tools: Environment Configuration                
echo ----------------------------------------------------

echo . Checking arguments
echo - --------------------------------------------------

set "npm=cmd /c npm"
set "npm_args="
set "no_link="
set "no_global="
set "script=%~n0"

:loadarg
set "arg=%~1"
if not defined arg goto validate
if "%arg%"=="--dry-run" set "npm_args=%npm_args% %arg%" & goto next
if "%arg%"=="--no-link" set "no_link=%arg%" & goto next
if "%arg%"=="--no-global" set "no_global=%arg%" & goto next

goto error1

:next
shift
goto loadarg

:validate

:: -- General purpose NodeJS extensions
if "%no_global%" == "--no-global" goto install
echo - --------------------------------------------------
echo . General purpose NodeJS extensions
echo - --------------------------------------------------
%npm% i --global @zeit/ncc %npm_args%

:install
:: -- NodeJS Projects Extensions
echo - --------------------------------------------------
echo . Preparing ACT-NODEJS
echo - -------------------------------------------------- 

cd .\act-nodejs\
%npm% i %npm_args%
if "%no_link%" == "" %npm% link %npm_args%
cd ..

:: -- VS-Code Projects extensions
echo - --------------------------------------------------
echo . Preparing ACT-VSCODE
echo - --------------------------------------------------

cd .\act-vscode\
%npm% i %npm_args%
if "%no_link%" == "" %npm% link act-nodejs %npm_args%

goto end

:error1
echo * Invalid arguments
echo Usage: %script% [--dry-run] [--no-link] [--no-global]
echo        --dry-run
echo        --no-link
echo        --no-global

:end
exit
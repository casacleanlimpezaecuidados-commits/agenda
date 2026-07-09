@echo off
title CASA & CLEAN - Sistema de Gestao
chcp 65001 >nul
color 0B

:menu
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║        CASA ^& CLEAN - GESTAO OPERACIONAL        ║
echo ╠══════════════════════════════════════════════════╣
echo ║                                                  ║
echo ║   1. INICIAR sistema                             ║
echo ║   2. PARAR sistema                               ║
echo ║   3. VER status                                  ║
echo ║   4. Instalar dependencias                       ║
echo ║   5. Abrir pasta do projeto                      ║
echo ║   6. Backup do banco de dados                    ║
echo ║   7. SAIR                                        ║
echo ║                                                  ║
echo ╚══════════════════════════════════════════════════╝
echo.
set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto iniciar
if "%opcao%"=="2" goto parar
if "%opcao%"=="3" goto status
if "%opcao%"=="4" goto instalar
if "%opcao%"=="5" goto abrirpasta
if "%opcao%"=="6" goto backup
if "%opcao%"=="7" goto sair
goto menu

:iniciar
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║          INICIANDO SISTEMA...                    ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Definir caminho base do projeto
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

REM Matar processos antigos primeiro
echo 🔄 Fechando processos anteriores...
taskkill /FI "WINDOWTITLE eq Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo ✅ Processos antigos finalizados
echo.

echo 📋 Verificando dependencias...
if not exist "%PROJECT_DIR%\node_modules" (
    echo ⚠️ Concurrently nao encontrado. Instalando...
    call npm install
    echo ✅ Concurrently instalado!
    echo.
)

echo.
echo 🚀 Iniciando backend e frontend...
echo.

REM Iniciar backend e frontend em janelas separadas com títulos específicos
start "Backend" /MIN cmd /c "cd /d "%PROJECT_DIR%\backend" && npm run dev"
start "Frontend" /MIN cmd /c "cd /d "%PROJECT_DIR%\frontend" && npm run dev"

echo ⏳ Aguardando servidores iniciarem...
timeout /t 8 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  ✅ SISTEMA INICIADO COM SUCESSO!                ║
echo ╠══════════════════════════════════════════════════╣
echo ║  Frontend: http://localhost:5173                 ║
echo ║  Backend:  http://localhost:3000                 ║
echo ║  Login:    admin@casaclean.com                   ║
echo ║  Senha:    admin123                              ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Abrir navegador automaticamente
start http://localhost:5173

echo.
echo 💡 Dica: Mantenha as janelas minimizadas abertas.
echo    O sistema para automaticamente ao fecha-las.
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause >nul
goto menu

:parar
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║          PARANDO SISTEMA...                      ║
echo ╚══════════════════════════════════════════════════╝
echo.

echo 🔴 Fechando Backend...
taskkill /FI "WINDOWTITLE eq Backend*" /T /F >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend finalizado com sucesso
) else (
    echo ⚠️ Backend nao estava rodando
)

echo 🔴 Fechando Frontend...
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend finalizado com sucesso
) else (
    echo ⚠️ Frontend nao estava rodando
)

echo 🔴 Finalizando processos Node residuais...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  ✅ SISTEMA PARADO COM SUCESSO!                  ║
echo ╚══════════════════════════════════════════════════╝
echo.
timeout /t 2 /nobreak >nul
goto menu

:status
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║          STATUS DO SISTEMA                       ║
echo ╚══════════════════════════════════════════════════╝
echo.

echo 🔍 Verificando Backend (porta 3000)...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend:  ONLINE - http://localhost:3000
) else (
    echo ❌ Backend:  OFFLINE
)

echo.
echo 🔍 Verificando Frontend (porta 5173)...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: ONLINE - http://localhost:5173
) else (
    echo ❌ Frontend: OFFLINE
)

echo.
echo 🔍 Verificando WhatsApp...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ℹ️  WhatsApp: Verifique o terminal do Backend para o QR Code
) else (
    echo ⚠️  WhatsApp: Backend offline, nao foi possivel verificar
)

echo.
echo ═══════════════════════════════════════════════════
echo.
pause
goto menu

:instalar
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║          INSTALANDO DEPENDENCIAS                 ║
echo ╚══════════════════════════════════════════════════╝
echo.

set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo 📦 [1/3] Instalando dependencias da raiz...
cd /d "%PROJECT_DIR%"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias da raiz!
    pause
    goto menu
)
echo ✅ Dependencias da raiz instaladas!
echo.

echo 📦 [2/3] Instalando dependencias do Backend...
cd /d "%PROJECT_DIR%\backend"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias do Backend!
    pause
    goto menu
)
echo ✅ Dependencias do Backend instaladas!
echo.

echo 📦 [3/3] Instalando dependencias do Frontend...
cd /d "%PROJECT_DIR%\frontend"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias do Frontend!
    pause
    goto menu
)
echo ✅ Dependencias do Frontend instaladas!
echo.

cd /d "%PROJECT_DIR%"
echo ╔══════════════════════════════════════════════════╗
echo ║  ✅ TODAS AS DEPENDENCIAS INSTALADAS!            ║
echo ╚══════════════════════════════════════════════════╝
echo.
pause
goto menu

:abrirpasta
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
explorer "%PROJECT_DIR%"
goto menu

:backup
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║          BACKUP DO BANCO DE DADOS                ║
echo ╚══════════════════════════════════════════════════╝
echo.

set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "DATA_FILE=%PROJECT_DIR%\backend\src\data\database.json"
set "BACKUP_DIR=%PROJECT_DIR%\backend\src\data\backups"

if not exist "%DATA_FILE%" (
    echo ❌ Arquivo database.json nao encontrado!
    pause
    goto menu
)

REM Criar pasta de backup se não existir
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Criar backup com timestamp
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set "data=%%c%%b%%a")
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set "hora=%%a%%b")
set "timestamp=%data%_%hora%"
set "BACKUP_FILE=%BACKUP_DIR%\database_%timestamp%.json"

copy "%DATA_FILE%" "%BACKUP_FILE%" >nul

if %errorlevel% equ 0 (
    echo ✅ Backup criado com sucesso!
    echo 📁 Local: %BACKUP_FILE%
) else (
    echo ❌ Erro ao criar backup!
)

echo.
pause
goto menu

:sair
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║                                                  ║
echo ║           CASA ^& CLEAN                          ║
echo ║           Gestao Operacional                     ║
echo ║                                                  ║
echo ║           Obrigado por usar nosso sistema!       ║
echo ║           Ate logo!                              ║
echo ║                                                  ║
echo ╚══════════════════════════════════════════════════╝
echo.
timeout /t 2 /nobreak >nul
exit
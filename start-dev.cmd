@echo off
cd /d D:\choreography-editor
set NODE_ENV=development
set PORT=5050
call node_modules\.bin\tsx.cmd server\index.ts

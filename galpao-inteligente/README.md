# Galpão Inteligente (Node.js)

Painel de monitoramento do galpão de aves: recebe leituras dos ESPs, calcula o ITGU e mostra alertas e histórico em tempo real. Sem dependências: só precisa do **Node.js 18+**.

## Como rodar (qualquer PC)
1. Instale o Node.js: https://nodejs.org
2. Windows: dois cliques em `iniciar.bat`. Linux/macOS: `sh iniciar.sh`.
3. Abra http://localhost:3000 — usuário `admin`, senha `galpao123` (troque no `.env`; para recriar o admin, apague `data/usuarios.json`).

## Conexão direta com o ESP
O terminal mostra o endereço da rede (ex.: `http://192.168.0.10:3000`). O ESP envia:

    POST /api/leituras
    Content-Type: application/json
    x-device-token: <DEVICE_TOKEN do .env>
    {"dispositivo":"esp01","temperatura":31.2,"umidade":64,"temperatura_externa":28.5}

Sem sensor: `npm run simular`. MQTT opcional: `npm install mqtt` e preencha `MQTT_URL` no `.env` (tópico `galpao/<dispositivo>`). Se outro PC não conseguir acessar, libere a porta no firewall.

## Pastas
- `src/` servidor, login JWT, ITGU, ingestão, simulador
- `painel/` index.html, `css/`, `js/`
- `data/` dados locais (leituras, usuários)

As faixas de temperatura, umidade e ITGU estão em `src/itgu.js` (valores de referência: ajuste ao manejo e à idade das aves).

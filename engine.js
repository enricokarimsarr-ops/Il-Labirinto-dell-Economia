// 🏛️ ENGINE.JS - Il Cuore Grafico e il Ciclo Principale di Gioco

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Buffer di profondità per evitare che gli sprite vengano renderizzati dietro ai muri
let zBuffer = new Array(WIDTH);

// Caricamento della Texture dei Muri (Il codice Matrix verde)
const wallTexture = new Image();
wallTexture.src = 'muromatrix.png';
let textureLoaded = false;
wallTexture.onload = () => { textureLoaded = true; };

// Stati del Gioco e Gestione del Tempo
let gameState = 'START'; // STATI: 'START', 'PLAYING', 'GAMEOVER', 'VICTORY'
let gameTimer = 60;
let lastTime = 0;

// Riferimenti agli elementi UI del DOM
const startScreen = document.getElementById('screen-start');
const gameOverScreen = document.getElementById('screen-gameover');
const victoryScreen = document.getElementById('screen-victory');
const timerUI = document.getElementById('hud-timer');
const gameOverReason = document.getElementById('gameover-reason');

// --- INIZIALIZZAZIONE E GESTIONE DEGLI SCHERMI ---

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart-fail').addEventListener('click', resetGame);
document.getElementById('btn-restart-win').addEventListener('click', resetGame);

function startGame() {
    startScreen.classList.add('hidden');
    gameState = 'PLAYING';
    lastTime = performance.now();
    gameTimer = 60;
    
    // Inizializza gli sprite (Funzione che scriveremo in sprites.js)
    if (typeof initSprites === 'function') initSprites();
    
    requestAnimationFrame(gameLoop);
}

function triggerGameOver(reason) {
    gameState = 'GAMEOVER';
    gameOverReason.innerText = reason;
    gameOverScreen.classList.remove('hidden');
}

function triggerVictory() {
    gameState = 'VICTORY';
    victoryScreen.classList.remove('hidden');
    
    // Calcolo Finale delle Regole Finanziarie
    let scoreHappiness = player.punteggioFelicita;
    let bonusSavings = Math.floor(player.fondoEmergenza / 10);
    let finalTotal = scoreHappiness + bonusSavings;
    
    document.getElementById('final-happiness').innerText = scoreHappiness;
    document.getElementById('final-bonus').innerText = bonusSavings;
    document.getElementById('final-total').innerText = finalTotal;
}

function resetGame() {
    player.contoCorrente = 500;
    player.fondoEmergenza = 0;
    player.punteggioFelicita = 0;
    player.x = 96;
    player.y = 96;
    player.angle = 0;
    
    gameOverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    startGame();
}

// --- CORE RAYCASTER (Rendering Muri 3D) ---

function renderWalls() {
    // Disegna il Soffitto (Nero profondo)
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT / 2);
    
    // Disegna il Pavimento (Grigio scuro digitale)
    ctx.fillStyle = '#11161b';
    ctx.fillRect(0, HEIGHT / 2, WIDTH, HEIGHT / 2);

    // Ciclo di scansione verticale per ogni colonna dello schermo
    for (let x = 0; x < WIDTH; x++) {
        // Calcola l'angolo del singolo raggio all'interno del FOV del giocatore
        let rayAngle = (player.angle - player.fov / 2) + (x / WIDTH) * player.fov;
        
        // Direzione del raggio
        let rayDirX = Math.cos(rayAngle);
        let rayDirY = Math.sin(rayAngle);
        
        // Posizione iniziale sulla griglia della mappa
        let mapX = Math.floor(player.x / MAP_CELL_SIZE);
        let mapY = Math.floor(player.y / MAP_CELL_SIZE);
        
        // Lunghezza del raggio da una cella all'altra
        let deltaDistX = Math.abs(1 / rayDirX);
        let deltaDistY = Math.abs(1 / rayDirY);
        
        let sideDistX, sideDistY;
        let stepX, stepY;
        let hit = 0;
        let side; // 0 = Impatto Verticale (Est/Ovest), 1 = Impatto Orizzontale (Nord/Sud)
        
        // Calcolo dello step iniziale e della distanza parziale
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (player.x / MAP_CELL_SIZE - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x / MAP_CELL_SIZE) * deltaDistX;
        }
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (player.y / MAP_CELL_SIZE - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y / MAP_CELL_SIZE) * deltaDistY;
        }
        
        // Algoritmo DDA per scovare l'impatto con il muro
        while (hit === 0) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            
            // Verifica dei confini di sicurezza ed eventuale impatto
            if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT) {
                if (MAP_GRID[mapY][mapX] > 0) hit = 1;
            } else {
                hit = 1; // Forza l'uscita se fuori mappa
            }
        }
        
        // Calcolo della distanza perpendicolare corretta (Evita l'effetto lente fish-eye)
        let perpWallDist;
        if (side === 0) {
            perpWallDist = (mapX - player.x / MAP_CELL_SIZE + (1 - stepX) / 2) / rayDirX;
        } else {
            perpWallDist = (mapY - player.y / MAP_CELL_SIZE + (1 - stepY) / 2) / rayDirY;
        }
        
        // Salva la distanza nel buffer per la gestione della profondità degli sprite
        zBuffer[x] = perpWallDist * MAP_CELL_SIZE;
        
        // Calcolo dell'altezza della colonna da disegnare sullo schermo
        let wallHeight = Math.floor(HEIGHT / (perpWallDist * Math.cos(rayAngle - player.angle)));
        
        // Punti di disegno superiore e inferiore della colonna
        let drawStart = -wallHeight / 2 + HEIGHT / 2;
        let drawEnd = wallHeight / 2 + HEIGHT / 2;
        
        // --- TEXTURE MAPPING (La tua immagine Matrix verde) ---
        if (textureLoaded) {
            // Calcola il punto esatto di impatto sul muro (0.0 a 1.0)
            let wallX;
            if (side === 0) {
                wallX = (player.y / MAP_CELL_SIZE) + perpWallDist * rayDirY;
            } else {
                wallX = (player.x / MAP_CELL_SIZE) + perpWallDist * rayDirX;
            }
            wallX -= Math.floor(wallX);
            
            // Coordinata X interna alla texture PNG
            let texX = Math.floor(wallX * wallTexture.width);
            
            // Se l'impatto è sul retro del muro, specchia la texture per coerenza visiva
            if (side === 0 && rayDirX > 0) texX = wallTexture.width - texX - 1;
            if (side === 1 && rayDirY < 0) texX = wallTexture.width - texX - 1;
            
            // Disegna lo spicchio verticale di texture sul Canvas
            ctx.drawImage(
                wallTexture,
                texX, 0, 1, wallTexture.height,           // Ritaglio sorgente (1 pixel di larghezza)
                x, drawStart, 1, drawEnd - drawStart      // Destinazione schermo
            );
            
            // Applica un'ombra scura ai muri orizzontali per dare senso di profondità 3D
            if (side === 1) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
            }
        } else {
            // Fallback a tinta unita se l'immagine sta caricando
            ctx.fillStyle = (side === 1) ? '#004d00' : '#003300';
            ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
        }
    }
}

// --- RENDER MINIMAPPA (Richiesta Speciale) ---

function renderMinimap() {
    const size = 3; // Dimensione in pixel di ogni cella sulla minimappa
    const offset = 10; // Distanza dai bordi del canvas
    
    // Sfondo della minimappa semi-trasparente
    ctx.fillStyle = "rgba(10, 15, 20, 0.75)";
    ctx.fillRect(offset, offset, MAP_WIDTH * size, MAP_HEIGHT * size);
    
    // Disegna la griglia dei muri
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (MAP_GRID[y][x] > 0) {
                ctx.fillStyle = "rgba(0, 255, 70, 0.5)"; // Muri verdi Matrix traslucidi
                ctx.fillRect(offset + x * size, offset + y * size, size, size);
            }
        }
    }
    
    // Disegna il Giocatore sulla minimappa
    let pX = offset + (player.x / MAP_CELL_SIZE) * size;
    let pY = offset + (player.y / MAP_CELL_SIZE) * size;
    
    ctx.fillStyle = "#ff3333"; // Pallino rosso per il player
    ctx.beginPath();
    ctx.arc(pX, pY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Linea direzionale dello sguardo del giocatore
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pX, pY);
    ctx.lineTo(pX + Math.cos(player.angle) * 6, pY + Math.sin(player.angle) * 6);
    ctx.stroke();
}

// --- GAME LOOP GENERALE ---

function gameLoop(currentTime) {
    if (gameState !== 'PLAYING') return;

    // Calcolo del delta-time (dt) in secondi per rendere il movimento indipendente dai frame
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Protezione per picchi di lag improvvisi
    if (dt > 0.1) dt = 0.1;

    // 1. Gestione del Timer Economico di Fine Mese
    gameTimer -= dt;
    timerUI.innerText = Math.ceil(gameTimer);
    
    if (gameTimer <= 0) {
        triggerVictory();
        return;
    }

    // 2. Controllo della Condizione di Sconfitta (Se vai sotto zero)
    if (player.contoCorrente < 0) {
        triggerGameOver("BANCAROTTA! Sei andato in debito sul conto.");
        return;
    }

    // 3. Aggiornamenti logici dei moduli esterni
    player.update(dt, keysPressed);
    if (typeof updateSprites === 'function') updateSprites(dt);

    // 4. Rendering grafico stratificato
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    renderWalls(); // Disegna i muri 3D con la texture Matrix
    
    if (typeof renderSprites === 'function') renderSprites(ctx, zBuffer); // Chiama il rendering degli sprite 2D
    
    renderMinimap(); // Disegna l'overlay della minimappa in alto a sinistra

    requestAnimationFrame(gameLoop);
}

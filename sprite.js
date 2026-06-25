// 🎭 SPRITES.JS - Gestione degli Oggetti, IA dell'Inflazione e Proiezione 3D

// Caricamento Texture degli Sprite con i nomi esatti dei file presenti nella cartella
const textures = {
    soldi: new Image(),
    cassaforte: new Image(),
    inflazione: new Image(),
    bolletta: new Image(),
    phishing: new Image(),
    scarpe: new Image(),
    diamanti: new Image(),
    oro: new Image()
};

textures.soldi.src = 'soldi.png';
textures.cassaforte.src = 'cassaforte vera.png';
textures.inflazione.src = 'inflazione.png';
textures.bolletta.src = 'Boletta.png (1).png';
textures.phishing.src = 'Pishing.png';
textures.scarpe.src = 'scarpe.png';
textures.diamanti.src = 'diamanti.png';
textures.oro.src = 'oro.png';

// Array globale che conterrà tutti gli elementi attivi nel labirinto
let spriteList = [];

// Funzione per generare coordinate casuali all'interno di spazi vuoti della mappa (0)
function getRandomEmptyPosition() {
    let valid = false;
    let gridX = 0, gridY = 0;
    while (!valid) {
        gridX = Math.floor(Math.random() * MAP_WIDTH);
        gridY = Math.floor(Math.random() * MAP_HEIGHT);
        if (MAP_GRID[gridY][gridX] === 0 && (gridX > 3 || gridY > 3)) { // Evita lo spawn sopra il giocatore all'inizio
            valid = true;
        }
    }
    return {
        x: gridX * MAP_CELL_SIZE + MAP_CELL_SIZE / 2,
        y: gridY * MAP_CELL_SIZE + MAP_CELL_SIZE / 2
    };
}

// --- INIZIALIZZAZIONE DEGLI SPRITE ---
function initSprites() {
    spriteList = [];

    // 1. Posiziona la Cassaforte Bloccata in un punto sicuro fisso (es. cella 3,3)
    spriteList.push({
        type: 'cassaforte',
        x: 3 * MAP_CELL_SIZE + 32,
        y: 3 * MAP_CELL_SIZE + 32,
        texture: textures.cassaforte,
        scale: 1.0
    });

    // 2. Crea il Mostro dell'Inflazione (Il cacciatore implacabile)
    let posInflazione = getRandomEmptyPosition();
    spriteList.push({
        type: 'inflazione',
        x: posInflazione.x,
        y: posInflazione.y,
        texture: textures.inflazione,
        scale: 1.2, // Più grande e minaccioso
        speed: 45 // Velocità di movimento nei corridoi
    });

    // 3. Spawna un po' di Stipendi iniziali (Sacco di soldi)
    for (let i = 0; i < 5; i++) {
        let pos = getRandomEmptyPosition();
        spriteList.push({ type: 'soldi', x: pos.x, y: pos.y, texture: textures.soldi, scale: 0.8 });
    }

    // 4. Spawna i 3 Sfizi unici (Scarpe, Diamanti, Oro)
    let posScarpe = getRandomEmptyPosition();
    spriteList.push({ type: 'sfizio', subType: 'scarpe', x: posScarpe.x, y: posScarpe.y, texture: textures.scarpe, scale: 0.7 });

    let posDiamanti = getRandomEmptyPosition();
    spriteList.push({ type: 'sfizio', subType: 'diamanti', x: posDiamanti.x, y: posDiamanti.y, texture: textures.diamanti, scale: 0.7 });

    let posOro = getRandomEmptyPosition();
    spriteList.push({ type: 'sfizio', subType: 'oro', x: posOro.x, y: posOro.y, texture: textures.oro, scale: 0.7 });

    // 5. Spawna un paio di esche di Phishing maligne
    for (let i = 0; i < 3; i++) {
        let pos = getRandomEmptyPosition();
        spriteList.push({ type: 'phishing', x: pos.x, y: pos.y, texture: textures.phishing, scale: 0.8 });
    }
}

// --- LOGICA E INTELLIGENZA ARTIFICIALE ---
function updateSprites(dt) {
    let billCount = 0;

    for (let i = spriteList.length - 1; i >= 0; i--) {
        let s = spriteList[i];

        // Calcola la distanza Euclidea tra il Giocatore e lo Sprite
        let dx = s.x - player.x;
        let dy = s.y - player.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // --- IA DEL MOSTRO INFLAZIONE ---
        if (s.type === 'inflazione') {
            // Insegue il giocatore muovendosi lungo il vettore di distanza
            s.x -= (dx / dist) * s.speed * dt;
            s.y -= (dy / dist) * s.speed * dt;

            // Se tocca il giocatore, gli divora il 6% dei contanti al secondo!
            if (dist < 28) {
                if (player.contoCorrente > 0) {
                    player.contoCorrente -= player.contoCorrente * 0.06 * dt;
                    if (typeof gameAudio !== 'undefined') gameAudio.playInflationBite();
                }
            }
        }

        // --- GESTIONE TIMER DELLE BOLLETTE ---
        if (s.type === 'bolletta') {
            billCount++;
            s.timer -= dt;
            
            // Se scade il tempo della bolletta: batosta finanziaria automatica
            if (s.timer <= 0) {
                player.contoCorrente -= 150; // Penale salata
                if (typeof gameAudio !== 'undefined') gameAudio.playBillAlarm();
                spriteList.splice(i, 1);
                continue;
            }
        }

        // --- INTERAZIONE / COLLISIONI CON IL GIOCATORE ---
        if (dist < 30) {
            
            // Raccolta dello Stipendio (Sacco di soldi)
            if (s.type === 'soldi') {
                player.contoCorrente += 250; // Iniezione di liquidità
                if (typeof gameAudio !== 'undefined') gameAudio.playCoin();
                spriteList.splice(i, 1);
                
                // Ne fa rinascerne un altro da qualche altra parte per tenere vivo il ciclo
                setTimeout(() => {
                    let pos = getRandomEmptyPosition();
                    spriteList.push({ type: 'soldi', x: pos.x, y: pos.y, texture: textures.soldi, scale: 0.8 });
                }, 4000);
            }
            
            // Raccolta degli Sfizi (Aumentano il Punteggio Felicità basandosi sul Moltiplicatore attivo!)
            else if (s.type === 'sfizio') {
                let reward = 100 * player.moltiplicatore;
                player.punteggioFelicita += reward;
                if (typeof gameAudio !== 'undefined') gameAudio.playCoin();
                spriteList.splice(i, 1);
            }
            
            // Pagamento manuale della Bolletta (Costa meno che farla scadere a zero)
            else if (s.type === 'bolletta') {
                player.contoCorrente -= 40; // Spesa fissa controllata
                if (typeof gameAudio !== 'undefined') gameAudio.playCoin();
                spriteList.splice(i, 1);
            }
            
            // Trappola di Phishing (Ti frega i codici della carta)
            else if (s.type === 'phishing') {
                player.contoCorrente -= 120; // Furto sul conto
                if (typeof gameAudio !== 'undefined') gameAudio.playInflationBite(); // Suono di errore/danno
                spriteList.splice(i, 1);
                
                // Rigenera una nuova trappola camuffata
                setTimeout(() => {
                    let pos = getRandomEmptyPosition();
                    spriteList.push({ type: 'phishing', x: pos.x, y: pos.y, texture: textures.phishing, scale: 0.8 });
                }, 7000);
            }
            
            // Meccanica di Deposito in Cassaforte (Solo premendo Spazio vicino ad essa)
            else if (s.type === 'cassaforte') {
                if (keysPressed[' '] || keysPressed['Spacebar']) {
                    if (player.contoCorrente > 0) {
                        player.fondoEmergenza += player.contoCorrente;
                        player.contoCorrente = 0; // Conto svuotato e messo al sicuro
                        if (typeof gameAudio !== 'undefined') gameAudio.playSafeDeposit();
                        keysPressed[' '] = false; // Reset dell'input per evitare attivazioni a raffica
                    }
                }
            }
        }
    }

    // --- MECCANICA DI SPONTANEITÀ: GENERATORE DELLE BOLLETTE IMPROVVISE ---
    // Se ci sono meno di 2 bollette in giro, c'è una bassa probabilità che ne arrivi una nuova ogni secondo
    if (billCount < 2 && Math.random() < 0.004) {
        let pos = getRandomEmptyPosition();
        spriteList.push({
            type: 'bolletta',
            x: pos.x,
            y: pos.y,
            texture: textures.bolletta,
            scale: 0.8,
            timer: 7.0 // Hai 7 secondi di tempo per correre a pagarla
        });
        if (typeof gameAudio !== 'undefined') gameAudio.playBillAlarm();
    }
}

// --- CORE ENGINE: PROIEZIONE E RENDERING 3D DEGLI SPRITE ---
function renderSprites(ctx, zBuffer) {
    // 1. Calcola la distanza aggiornata per ogni sprite prima di fare l'ordinamento
    spriteList.forEach(s => {
        let dx = s.x - player.x;
        let dy = s.y - player.y;
        s.dist = Math.sqrt(dx * dx + dy * dy);
    });

    // 2. Ordina gli sprite dal PIÙ LONTANO al PIÙ VICINO (Algoritmo del Pittore)
    spriteList.sort((a, b) => b.dist - a.dist);

    // 3. Proietta e disegna ogni singolo sprite sullo schermo 3D
    spriteList.forEach(s => {
        // Evita di calcolare oggetti troppo vicini o dietro la telecamera
        if (s.dist < 12) return;

        let spriteX = s.x - player.x;
        let spriteY = s.y - player.y;

        // Angolo assoluto dello sprite rispetto al giocatore
        let spriteAngle = Math.atan2(spriteY, spriteX) - player.angle;

        // Normalizzazione dell'angolo nell'intervallo [-PI, PI]
        while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2;
        while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;

        // Se lo sprite si trova all'interno del campo visivo (con un margine strutturale per le dimensioni)
        if (Math.abs(spriteAngle) < player.fov * 1.3) {
            
            // Formula di calcolo dell'altezza dello sprite corretta per evitare distorsioni
            let spriteSize = Math.floor(HEIGHT / (s.dist / MAP_CELL_SIZE)) * s.scale;
            
            // Centro dello sprite coordinata X sullo schermo
            let screenX = Math.floor((WIDTH / 2) + (spriteAngle / player.fov) * WIDTH);
            
            let drawStart = -spriteSize / 2 + HEIGHT / 2;
            
            let startX = Math.floor(screenX - spriteSize / 2);
            let endX = Math.floor(screenX + spriteSize / 2);

            // Disegna l'oggetto colonna verticale per colonna verticale (Fetta per fetta)
            for (let col = startX; col < endX; col++) {
                if (col >= 0 && col < WIDTH) {
                    
                    // CONTROLLO DELLO Z-BUFFER: Se lo sprite è più vicino del muro calcolato in quella colonna, lo disegna!
                    if (s.dist < zBuffer[col]) {
                        
                        // Calcola la coordinata X corrispondente sulla texture originale del file PNG
                        let texX = Math.floor(((col - startX) / spriteSize) * s.texture.width);
                        
                        if (texX >= 0 && texX < s.texture.width && s.texture.complete) {
                            ctx.drawImage(
                                s.texture,
                                texX, 0, 1, s.texture.height, // Ritaglio di 1 pixel dalla sorgente trasparente
                                col, drawStart, 1, spriteSize  // Disegno sullo schermo
                            );
                        }
                    }
                }
            }
            
            // Scrittura del Timer in sovrimpressione sulla testa delle bollette attive
            if (s.type === 'bolletta' && s.timer > 0) {
                ctx.fillStyle = s.timer < 3 ? '#ff3333' : '#ffff33';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(Math.ceil(s.timer) + "s", screenX, drawStart - 10);
            }
        }
    });
}

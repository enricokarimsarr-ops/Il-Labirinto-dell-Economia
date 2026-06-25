// 🕹️ PLAYER.JS - Gestione Finanziaria, Fisica e Controlli del Giocatore

const player = {
    // Posizione iniziale centrata in una zona vuota (moltiplicata per la dimensione della cella)
    x: 96,  // cella 1.5 * 64
    y: 96,  // cella 1.5 * 64
    angle: 0, // Angolo di visuale in radianti
    fov: Math.PI / 3, // Campo visivo (60 gradi)
    
    // 💰 VARIABILI FINANZIARIE DI GIOCO
    contoCorrente: 500,
    fondoEmergenza: 0,
    punteggioFelicita: 0,
    moltiplicatore: 1,
    
    // Parametri di movimento fissi
    rotSpeed: 3.5, // Velocità di rotazione (radianti al secondo)
    
    // Calcolo dinamico della velocità in base alla liquidità
    getSpeed: function() {
        // Velocità minima = 2.5 (a secco), massima = 7.5 (molto ricco)
        // Scaliamo linearmente: ogni 500€ aumenta la velocità, tetto massimo a 2500€
        let bonusVelocita = this.contoCorrente / 500;
        if (bonusVelocita < 0) bonusVelocita = 0; // Se in rosso, fermo o lento prima del game over
        return Math.min(2.5 + bonusVelocita, 7.5);
    },

    // Calcolo dinamico del moltiplicatore di punti degli Sfizi
    updateMultiplier: function() {
        // Meno di 1000€ = x1
        // Da 1000€ a 1999€ = x2
        // Da 2000€ in su = x3
        this.moltiplicatore = 1 + Math.floor(this.contoCorrente / 1000);
        if (this.moltiplicatore < 1) this.moltiplicatore = 1;
    },

    // Metodo principale di aggiornamento (chiamato dall'engine ad ogni frame)
    update: function(dt, keys) {
        // 1. Aggiorna l'angolo visivo (Rotazione con Frecce Orizzontali o A/D)
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.angle -= this.rotSpeed * dt;
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.angle += this.rotSpeed * dt;
        }
        
        // Mantieni l'angolo nell'intervallo [0, 2*PI]
        this.angle = (this.angle + Math.PI * 2) % (Math.PI * 2);

        // 2. Calcola vettori di spostamento avanti/dietro (WASD o Frecce)
        let moveX = 0;
        let moveY = 0;
        let speed = this.getSpeed() * 30; // Scaliamo la velocità per il delta time

        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            moveX += Math.cos(this.angle) * speed * dt;
            moveY += Math.sin(this.angle) * speed * dt;
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            moveX -= Math.cos(this.angle) * speed * dt;
            moveY -= Math.sin(this.angle) * speed * dt;
        }

        // 3. Sistema di Collisione Scivolante (Sliding Collision) alla Wolfenstein
        // Controlla separatamente l'asse X e l'asse Y per permettere di scivolare lungo i muri
        let bufferMuro = 12; // Raggio del player per non compenetrare i muri
        
        let checkX = this.x + moveX + (moveX > 0 ? bufferMuro : -bufferMuro);
        if (!isWallAt(checkX, this.y)) {
            this.x += moveX;
        }

        let checkY = this.y + moveY + (moveY > 0 ? bufferMuro : -bufferMuro);
        if (!isWallAt(this.x, checkY)) {
            this.y += moveY;
        }

        // 4. Sincronizza lo stato finanziario e aggiorna l'interfaccia HTML
        this.updateMultiplier();
        this.updateUI();
    },

    // Sincronizzazione immediata con gli elementi DOM creati nell'index.html
    updateUI: function() {
        document.getElementById('hud-cash').innerText = Math.floor(this.contoCorrente) + "€";
        document.getElementById('hud-safe').innerText = Math.floor(this.fondoEmergenza) + "€";
        document.getElementById('hud-mult').innerText = "x" + this.moltiplicatore;
        document.getElementById('hud-score').innerText = Math.floor(this.punteggioFelicita);
        
        // Gestione feedback visivo del conto in rosso o ricco
        let cashBox = document.querySelector('.highlight-cash');
        if (this.contoCorrente <= 0) {
            cashBox.style.animation = "alertPulse 0.4s infinite alternate";
        } else {
            cashBox.style.animation = "none";
        }
    }
};

// Stato della tastiera per catturare gli input in tempo reale
const keysPressed = {};
window.addEventListener('keydown', (e) => { keysPressed[e.key] = true; });
window.addEventListener('keyup', (e) => { keysPressed[e.key] = false; });

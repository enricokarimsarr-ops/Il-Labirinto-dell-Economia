// 🏛️ AUDIO.JS - Sintetizzatore Audio Nativo e Gestione Colonne Sonore

const gameAudio = {
    ctx: null,
    musicInterval: null,
    isMusicPlaying: false,
    tempo: 130, // Pulsazioni al minuto (BPM) per il ritmo synthwave

    // Inizializza il contesto audio (deve partire dopo un click dell'utente per regole del browser)
    init: function() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    // 🔊 EFFETTI SONORI SINTETIZZATI (Generati proceduralmente)

    // Suono quando raccogli lo Stipendio o gli Sfizi (Ka-ching!)
    playCoin: function() {
        this.init();
        let t = this.ctx.currentTime;
        
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        
        osc.type = 'sine';
        // Doppio tono ascendente tipico dei retro-game
        osc.frequency.setValueAtTime(587.33, t); // Nota Re5
        osc.frequency.setValueAtTime(880.00, t + 0.08); // Nota La5
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.25);
    },

    // Suono quando depositi i soldi nella Cassaforte (Chiusura blindata protetta)
    playSafeDeposit: function() {
        this.init();
        let t = this.ctx.currentTime;
        
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220.00, t); 
        osc.frequency.exponentialRampToValueAtTime(110.00, t + 0.3); 
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.3);
    },

    // Suono quando l'Inflazione ti morde il conto (Erosione cibernetica)
    playInflationBite: function() {
        this.init();
        let t = this.ctx.currentTime;
        
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        // Suono distorto calante
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.15);
        
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.15);
    },

    // Allarme per la Bolletta in scadenza (Sirena insistente)
    playBillAlarm: function() {
        this.init();
        let t = this.ctx.currentTime;
        
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(880, t + 0.1);
        
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + 0.2);
    },

    // 🎹 COLONNA SONORA RETRO (Grancassa e Linea di Basso procedurale)
    startMusic: function() {
        this.init();
        if (this.isMusicPlaying) return;
        this.isMusicPlaying = true;

        let beatCount = 0;
        let secondsPerBeat = 60 / this.tempo;

        // Loop ritmico continuo
        this.musicInterval = setInterval(() => {
            let t = this.ctx.currentTime;

            // 1. Grancassa (Kick Drum) su ogni battito
            let kickOsc = this.ctx.createOscillator();
            let kickGain = this.ctx.createGain();
            kickOsc.frequency.setValueAtTime(120, t);
            kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
            kickGain.gain.setValueAtTime(0.25, t);
            kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            kickOsc.connect(kickGain);
            kickGain.connect(this.ctx.destination);
            kickOsc.start(t);
            kickOsc.stop(t + 0.12);

            // 2. Linea di Basso Frenetica (Stile Cyberpunk/Doom)
            let bassOsc = this.ctx.createOscillator();
            let bassGain = this.ctx.createGain();
            bassOsc.type = 'sawtooth';

            // Alterna le note basse per creare tensione
            let notes = [55.00, 55.00, 65.41, 55.00, 73.42, 55.00, 65.41, 48.99]; 
            let currentNote = notes[beatCount % notes.length];
            
            bassOsc.frequency.setValueAtTime(currentNote, t);
            
            bassGain.gain.setValueAtTime(0.06, t);
            bassGain.gain.exponentialRampToValueAtTime(0.001, t + secondsPerBeat * 0.8);
            
            bassOsc.connect(bassGain);
            bassGain.connect(this.ctx.destination);
            bassOsc.start(t);
            bassOsc.stop(t + secondsPerBeat * 0.8);

            beatCount++;
        }, secondsPerBeat * 1000);
    },

    stopMusic: function() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
        }
        this.isMusicPlaying = false;
    }
};

// Colleghiamo l'avvio audio al pulsante Start dell'interfaccia
document.getElementById('btn-start').addEventListener('click', () => {
    gameAudio.startMusic();
});

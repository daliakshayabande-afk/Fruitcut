/**
 * Splat Blade - Core Game Loop and State Manager
 * Coordinates physics, backgrounds, audio, ui, and rules.
 */

import { audio } from './audio.js';
import { ui } from './ui.js';
import { BackgroundManager } from './backgrounds.js';
import { PhysicsEngine } from './physics.js';
import { Fruit, FruitHalf, Hazard, PowerUp, JuiceParticle, StainParticle, SparkParticle } from './entities.js';

// Quick floating text class for score notifications
class FloatingText {
  constructor(text, x, y, color = '#ffffff', scale = 1.0) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.scale = scale;
    this.vy = -60; // floats upwards
    this.life = 0.8; // 800ms
    this.maxLife = this.life;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    
    // Scale animation
    const currentScale = this.scale * (0.8 + 0.4 * (1 - alpha));
    ctx.font = `bold ${Math.round(20 * currentScale)}px Outfit`;
    ctx.textAlign = 'center';
    
    // Draw with outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Canvas dimensions
    this.width = 800;
    this.height = 600;
    
    // Sub-systems
    this.backgrounds = new BackgroundManager(document.getElementById('bg-canvas'));
    this.physics = new PhysicsEngine();
    
    // Game entities arrays
    this.entities = [];
    this.halves = [];
    this.particles = [];
    this.stains = [];
    this.floatingTexts = [];
    
    // Input state
    this.isSwiping = false;
    
    // Core game mode details
    this.gameMode = 'classic';
    this.score = 0;
    this.lives = 3;
    this.timeLeft = 60; // Zen and Arcade timers
    this.gameActive = false;
    this.isPaused = false;
    this.reviveCount = 0;
    
    // Combo calculation tracks
    this.comboSlices = []; // slices in current continuous drag
    this.comboTimeoutId = null;

    // Difficulty curve trackers
    this.difficultyTimer = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.0; // initial launch frequency (seconds)
    this.baseMinSpeed = 550;
    this.baseMaxSpeed = 750;
    
    // Power-up durations & scales
    this.timeScale = 1.0;
    this.powerupsActive = {
      magnet: 0,
      slowmo: 0,
      double: 0,
      frenzy: 0,
      shield: 0,
      golden: 0
    };
    
    // Hazard penalizing state durations
    this.poisonDuration = 0;
    this.electricDuration = 0;
    this.frostDuration = 0;
    this.shakeIntensity = 0;
    
    // Setup loops
    this.lastTime = 0;
    
    // Initialize UI coordination
    ui.init(this);
    
    // Listen for resize
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Setup inputs
    this.setupInputs();
    
    // Start animation frame
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    const container = document.getElementById('game-container');
    const rect = container.getBoundingClientRect();
    
    this.width = rect.width;
    this.height = rect.height;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.backgrounds.resize(this.width, this.height);
  }

  setupInputs() {
    // Desktop mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startSwipe(e.clientX, e.clientY));
    this.canvas.addEventListener('mousemove', (e) => this.trackSwipe(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.endSwipe());

    // Mobile touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.startSwipe(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.trackSwipe(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => this.endSwipe());
  }

  // Convert client viewport X/Y to inner Canvas space
  getCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * this.width,
      y: ((clientY - rect.top) / rect.height) * this.height
    };
  }

  startSwipe(clientX, clientY) {
    if (!this.gameActive || this.isPaused) return;
    
    // Disable inputs if slicing is blocked by hazard penalty
    if (this.poisonDuration > 0 || this.electricDuration > 0) return;
    
    this.isSwiping = true;
    const coords = this.getCanvasCoords(clientX, clientY);
    this.physics.clearSwipe();
    this.physics.addSwipePoint(coords.x, coords.y);
  }

  trackSwipe(clientX, clientY) {
    if (!this.gameActive || this.isPaused || !this.isSwiping) return;
    if (this.poisonDuration > 0 || this.electricDuration > 0) {
      this.endSwipe();
      return;
    }

    const coords = this.getCanvasCoords(clientX, clientY);
    this.physics.addSwipePoint(coords.x, coords.y);
    
    // Check collisions
    this.checkCollisions();
  }

  endSwipe() {
    this.isSwiping = false;
    this.physics.clearSwipe();
    this.evaluateCombo();
  }

  // Starts selected game mode
  startGame(mode) {
    this.gameMode = mode;
    this.score = 0;
    this.gameActive = true;
    this.isPaused = false;
    this.reviveCount = 0;
    this.difficultyTimer = 0;
    this.spawnTimer = 0;

    switch (this.gameMode) {
      case 'classic':
        this.lives = 3;
        this.timeLeft = 60;
        this.spawnInterval = 2.0;
        this.baseMinSpeed = 550;
        this.baseMaxSpeed = 750;
        break;
      case 'survival':
        this.lives = 3;
        this.timeLeft = 60;
        this.spawnInterval = 1.6;
        this.baseMinSpeed = 620;
        this.baseMaxSpeed = 820;
        break;
      case 'arcade':
        this.lives = 0;
        this.timeLeft = 60;
        this.spawnInterval = 1.4;
        this.baseMinSpeed = 640;
        this.baseMaxSpeed = 840;
        break;
      case 'zen':
        this.lives = 0;
        this.timeLeft = 90;
        this.spawnInterval = 2.4;
        this.baseMinSpeed = 520;
        this.baseMaxSpeed = 700;
        break;
      case 'challenge':
        this.lives = 0;
        this.timeLeft = 75;
        this.spawnInterval = 1.2;
        this.baseMinSpeed = 660;
        this.baseMaxSpeed = 860;
        break;
      default:
        this.lives = 0;
        this.timeLeft = 60;
        this.spawnInterval = 2.0;
        this.baseMinSpeed = 550;
        this.baseMaxSpeed = 750;
    }
    
    this.entities = [];
    this.halves = [];
    this.particles = [];
    this.stains = [];
    this.floatingTexts = [];
    
    // Set powerups inactive
    Object.keys(this.powerupsActive).forEach(k => this.powerupsActive[k] = 0);
    
    // Clear hazard durations
    this.poisonDuration = 0;
    this.electricDuration = 0;
    this.frostDuration = 0;
    this.timeScale = 1.0;
    
    // Setup background theme from UI settings
    this.backgrounds.setTheme(ui.activeBackground);
    
    // BGM toggle
    audio.stopBGM();
    audio.startBGM();

    this.updateHUD();
    ui.incrementStat('games');

    // Add float text
    this.floatingTexts.push(new FloatingText("READY... GO!", this.width / 2, this.height / 2, '#4CAF50', 2.0));
  }

  togglePause() {
    if (!this.gameActive) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      ui.showScreen('pause-screen');
      audio.stopBGM();
    } else {
      ui.showScreen('hud-dummy');
      audio.startBGM();
    }
  }

  restartGame() {
    this.startGame(this.gameMode);
  }

  exitToMenu() {
    this.gameActive = false;
    audio.stopBGM();
    ui.showScreen('main-menu');
  }

  revivePlayer() {
    // Ad-revive logic: gives +1 life in Classic or +15s in Arcade
    if (this.gameMode === 'classic' || this.gameMode === 'survival') {
      this.lives = 1;
      this.gameActive = true;
      this.isPaused = false;
      this.reviveCount++;
      audio.startBGM();
      this.updateHUD();
      return true;
    } else if (this.gameMode === 'arcade') {
      this.timeLeft = 15;
      this.gameActive = true;
      this.isPaused = false;
      this.reviveCount++;
      audio.startBGM();
      this.updateHUD();
      return true;
    }
    return false;
  }

  gameOver() {
    this.gameActive = false;
    audio.stopBGM();
    audio.playGameOver();

    // High score recording
    ui.saveHighScore(this.gameMode, this.score);
    
    // Save coins earned (1 coin per 10 points)
    const coinsEarned = Math.floor(this.score / 10);
    ui.coins += coinsEarned;
    ui.saveState();

    // Display gameOver screen
    document.getElementById('final-score-val').innerText = this.score;
    document.getElementById('coins-earned-val').innerText = coinsEarned;
    
    const maxCombo = this.comboSlices.reduce((acc, curr) => Math.max(acc, curr.count), 0) || ui.getStat('max_combo');
    document.getElementById('best-combo-val').innerText = maxCombo;
    
    document.getElementById('game-over-sub').innerText = `Completed a standard run in ${this.gameMode.toUpperCase()} mode!`;

    // Only allow ad revive once per game
    const adBtn = document.getElementById('ad-revive-btn');
    if (this.reviveCount === 0 && (this.gameMode === 'classic' || this.gameMode === 'arcade' || this.gameMode === 'survival')) {
      adBtn.style.display = 'block';
    } else {
      adBtn.style.display = 'none';
    }

    ui.showScreen('game-over-screen');
  }

  updateHUD() {
    document.getElementById('score-val').innerText = this.score;
    
    // Score multiplier flag
    const double = this.powerupsActive.double > 0;
    const tag = document.getElementById('multiplier-tag');
    if (double) {
      tag.classList.remove('hidden');
    } else {
      tag.classList.add('hidden');
    }

    // Classic/Survival Hearts
    const livesDiv = document.getElementById('lives-container');
    const timerDiv = document.getElementById('timer-container');
    
    if (this.gameMode === 'classic' || this.gameMode === 'survival') {
      livesDiv.classList.remove('hidden');
      timerDiv.classList.add('hidden');
      
      // Update heart highlights
      for (let i = 1; i <= 3; i++) {
        const heartEl = document.getElementById(`heart-${i}`);
        if (i <= this.lives) {
          heartEl.classList.remove('lost');
        } else {
          heartEl.classList.add('lost');
        }
      }
    } else {
      livesDiv.classList.add('hidden');
      timerDiv.classList.remove('hidden');
      document.getElementById('timer-val').innerText = Math.round(this.timeLeft);
    }

    // Powerup durations bar in HUD
    const indicators = document.getElementById('active-powerups');
    indicators.innerHTML = '';
    
    Object.keys(this.powerupsActive).forEach(key => {
      const duration = this.powerupsActive[key];
      if (duration > 0) {
        const labelMap = {
          magnet: '🧲 MAGNET',
          slowmo: '⏳ SLOWMO',
          double: '🪙 DOUBLE',
          frenzy: '🔥 FRENZY',
          shield: '🛡 SHIELD',
          golden: '⚔ GOLDEN'
        };
        const ind = document.createElement('div');
        ind.className = `powerup-indicator ${key}`;
        ind.innerText = `${labelMap[key]} (${Math.ceil(duration)}s)`;
        indicators.appendChild(ind);
      }
    });
  }

  // Core collisions checking against active swipe coordinates
  checkCollisions() {
    const seg = this.physics.getCurrentSegment();
    if (!seg) return;

    const bladeRadius = this.powerupsActive.golden > 0 ? 30 : 15;

    // Check intersections with active fruits and hazards
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.sliced) continue;

      const hit = this.physics.checkLineCircleIntersection(seg.p1, seg.p2, e.x, e.y, e.radius + bladeRadius * 0.5);
      
      if (hit) {
        e.sliced = true;
        this.handleSlice(e, hit);
      }
    }
  }

  handleSlice(entity, hit) {
    const isDouble = this.powerupsActive.double > 0;
    const isGolden = this.powerupsActive.golden > 0;
    
    if (entity instanceof Fruit) {
      audio.playSplat(entity.radius / 30);
      
      // Calculate scores
      let slicePoints = entity.points * (isDouble ? 2 : 1);
      if (isGolden) slicePoints += 2; // Golden blade bonus
      
      this.score += slicePoints;
      
      // Spawn floating score tag
      this.floatingTexts.push(new FloatingText(`+${slicePoints}`, entity.x, entity.y, '#00E5FF'));

      // Spawn juice droplets
      const numDroplets = ui.perfMode ? 10 : 25;
      for (let j = 0; j < numDroplets; j++) {
        this.particles.push(new JuiceParticle(hit.intersectX, hit.intersectY, entity.innerColor));
      }

      // Splash on background canvas (maximum 50 active stains)
      if (this.stains.length < 50 && Math.random() > 0.3) {
        this.stains.push(new StainParticle(hit.intersectX, hit.intersectY, entity.innerColor));
      }

      // Split into two halves
      this.halves.push(new FruitHalf(entity, true, hit.sliceAngle, hit.normalX, hit.normalY));
      this.halves.push(new FruitHalf(entity, false, hit.sliceAngle, hit.normalX, hit.normalY));

      // Track slices for combo logic
      this.comboSlices.push({
        x: entity.x,
        y: entity.y,
        color: entity.innerColor,
        time: Date.now()
      });

      // Update stat
      ui.incrementStat('slices');
      ui.updateChallengeProgress('cut_watermelon', entity.type === 'watermelon' ? 1 : 0);

      // Trigger standard combo evaluator timer
      if (this.comboTimeoutId) clearTimeout(this.comboTimeoutId);
      this.comboTimeoutId = setTimeout(() => this.evaluateCombo(), 350);

    } 
    else if (entity instanceof Hazard) {
      entity.sliced = true;
      this.triggerHazardPenalty(entity);
    } 
    else if (entity instanceof PowerUp) {
      entity.sliced = true;
      this.activatePowerUp(entity.type);
      this.floatingTexts.push(new FloatingText(entity.type.toUpperCase(), entity.x, entity.y, '#FFD700', 1.3));
    }
    
    this.updateHUD();
  }

  triggerHazardPenalty(hazard) {
    ui.incrementStat('bombs');
    
    if (hazard.type === 'bomb') {
      audio.playBomb();
      this.shakeScreen(20);
      
      // Visual red blast overlay triggers in draw block
      this.flashScreenColor = 'rgba(255, 23, 68, 0.4)';
      
      if (this.gameMode === 'classic') {
        // Shield absorbs bomb once
        if (this.powerupsActive.shield > 0) {
          this.powerupsActive.shield = 0;
          this.floatingTexts.push(new FloatingText("SHIELD BLOCKED", hazard.x, hazard.y, '#4CAF50', 1.2));
        } else {
          this.lives--;
          if (this.lives <= 0) {
            this.gameOver();
          }
        }
      } 
      else if (this.gameMode === 'survival') {
        if (this.powerupsActive.shield > 0) {
          this.powerupsActive.shield = 0;
          this.floatingTexts.push(new FloatingText("SHIELD BLOCKED", hazard.x, hazard.y, '#4CAF50', 1.2));
        } else {
          this.gameOver(); // instant death in survival!
        }
      }
      else if (this.gameMode === 'arcade') {
        this.score = Math.max(0, this.score - 50);
        this.floatingTexts.push(new FloatingText("-50", hazard.x, hazard.y, '#FF1744', 1.2));
      }
    } 
    else if (hazard.type === 'frozen_bomb') {
      audio.playFreeze();
      this.frostDuration = 4.0; // frozen time scale
      this.timeScale = 0.25;
      this.floatingTexts.push(new FloatingText("FROSTED", hazard.x, hazard.y, '#00E5FF', 1.3));
    } 
    else if (hazard.type === 'poison') {
      audio.playBomb(); // dirty sizzle sound
      this.poisonDuration = 2.0; // lock swipes
      this.score = Math.max(0, this.score - 100);
      this.floatingTexts.push(new FloatingText("POISONED -100", hazard.x, hazard.y, '#00E676', 1.3));
      this.endSwipe();
    } 
    else if (hazard.type === 'electric') {
      audio.playFreeze(); // zapping sound
      this.electricDuration = 1.5; // lock swipes
      this.score = Math.max(0, this.score - 30);
      this.floatingTexts.push(new FloatingText("SHOCKED -30", hazard.x, hazard.y, '#b388ff', 1.3));
      this.endSwipe();
    }
  }

  activatePowerUp(type) {
    audio.playPowerup();
    
    // Durations are stackable
    if (type === 'slowmo') {
      this.powerupsActive.slowmo += 6.0;
      this.timeScale = 0.35;
    } else if (type === 'shield') {
      this.powerupsActive.shield = 1; // shield is binary
    } else {
      this.powerupsActive[type] += 6.0;
    }

    if (type === 'frenzy') {
      this.triggerFrenzySpawn();
    }
  }

  // Trigger immediate bursts of fruits from left/right walls
  triggerFrenzySpawn() {
    const numFruits = 15;
    for (let i = 0; i < numFruits; i++) {
      setTimeout(() => {
        if (!this.gameActive || this.isPaused) return;
        
        const launchFromLeft = Math.random() > 0.5;
        const x = launchFromLeft ? -30 : this.width + 30;
        const y = this.height * (0.3 + Math.random() * 0.4); // spawn center high
        
        const vx = launchFromLeft ? (Math.random() * 200 + 400) : -(Math.random() * 200 + 400);
        const vy = -(Math.random() * 200 + 150);
        
        const types = ['apple', 'orange', 'banana', 'kiwi', 'strawberry', 'watermelon'];
        const t = types[Math.floor(Math.random() * types.length)];
        
        this.entities.push(new Fruit(t, x, y, vx, vy));
      }, i * 200);
    }
  }

  evaluateCombo() {
    const count = this.comboSlices.length;
    if (count >= 3) {
      audio.playPowerup();
      
      const double = this.powerupsActive.double > 0;
      const comboBonus = count * (double ? 2 : 1);
      this.score += comboBonus;
      
      const averageX = this.comboSlices.reduce((acc, c) => acc + c.x, 0) / count;
      const averageY = this.comboSlices.reduce((acc, c) => acc + c.y, 0) / count;
      
      this.floatingTexts.push(new FloatingText(`${count}x COMBO! +${comboBonus}`, averageX, averageY, '#FFEB3B', 1.5));
      
      // Update HUD alert text flash
      const hudAlert = document.getElementById('hud-combo-alert');
      hudAlert.innerText = `${count}x COMBO BLAST!`;
      hudAlert.classList.add('pop');
      setTimeout(() => hudAlert.classList.remove('pop'), 600);

      // Stats checking
      ui.incrementStat('max_combo', count > ui.getStat('max_combo') ? (count - ui.getStat('max_combo')) : 0);
      ui.updateChallengeProgress('high_combo', count >= 4 ? 1 : 0);
    }
    
    this.comboSlices = [];
  }

  shakeScreen(intensity) {
    if (ui.screenShake) {
      this.shakeIntensity = intensity;
    }
  }

  // Spawns items randomly based on difficulty ramp
  spawnWave() {
    const isFrenzy = this.powerupsActive.frenzy > 0;
    
    // Wave spawn sizing
    let numLaunches = Math.floor(Math.random() * 2) + 1; // 1 to 2 items
    
    if (this.difficultyTimer > 20) numLaunches = Math.floor(Math.random() * 3) + 1;
    if (this.difficultyTimer > 50) numLaunches = Math.floor(Math.random() * 4) + 2;
    if (isFrenzy) numLaunches = Math.floor(Math.random() * 3) + 3; // dense spawn during frenzy

    const fruitList = this.gameMode === 'challenge'
      ? ['watermelon', 'dragonfruit', 'pomegranate', 'mango', 'pineapple', 'kiwi']
      : ['watermelon', 'apple', 'orange', 'mango', 'kiwi', 'pineapple', 'strawberry', 'banana', 'dragonfruit', 'pomegranate'];
    
    for (let i = 0; i < numLaunches; i++) {
      const x = this.width * (0.15 + Math.random() * 0.7);
      const y = this.height + 40;
      
      // calculate angle pointing to screen center
      const centerX = this.width / 2;
      const dx = centerX - x;
      
      const vx = dx * (Math.random() * 0.4 + 0.3); // steer towards center
      const vy = -(Math.random() * (this.baseMaxSpeed - this.baseMinSpeed) + this.baseMinSpeed);

      // Determine object type (fruits, bombs, powerups)
      const rand = Math.random();
      
      // Bomb spawn probabilities
      let bombProb = 0.0;
      if (this.gameMode === 'classic') bombProb = 0.15 + Math.min(0.2, this.difficultyTimer * 0.003);
      if (this.gameMode === 'survival') bombProb = 0.20 + Math.min(0.3, this.difficultyTimer * 0.005);
      if (this.gameMode === 'arcade') bombProb = 0.18 + Math.min(0.2, this.difficultyTimer * 0.003);
      if (this.gameMode === 'challenge') bombProb = 0.22 + Math.min(0.25, this.difficultyTimer * 0.004);

      if (this.gameMode !== 'zen' && rand < bombProb) {
        // Hazard spawn
        const hazTypes = ['bomb', 'frozen_bomb', 'poison', 'electric'];
        // heavier weight on normal bombs
        const hRand = Math.random();
        let hType = 'bomb';
        if (hRand > 0.55) hType = 'frozen_bomb';
        else if (hRand > 0.75) hType = 'poison';
        else if (hRand > 0.9) hType = 'electric';

        this.entities.push(new Hazard(hType, x, y, vx, vy));
      } 
      else if (rand > (this.gameMode === 'challenge' ? 0.92 : 0.95) - (isFrenzy ? 0.0 : 0.02)) {
        // Powerup spawn
        const puTypes = ['magnet', 'slowmo', 'double', 'frenzy', 'shield', 'golden'];
        const pType = puTypes[Math.floor(Math.random() * puTypes.length)];
        this.entities.push(new PowerUp(pType, x, y, vx, vy));
      } 
      else {
        // Fruit spawn
        const fType = fruitList[Math.floor(Math.random() * fruitList.length)];
        this.entities.push(new Fruit(fType, x, y, vx, vy));
      }
    }
  }

  // --- PRIMARY ANIMATION AND PHYSICS RUNNER ---
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    
    // Delta in seconds (capped at 0.1s to avoid physics explosions on lag spikes)
    let dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.gameActive && !this.isPaused) {
      this.update(dt);
    }
    
    this.draw();
    
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // 1. Resolve power-up timer decay
    let globalTimescaleMod = 1.0;
    
    Object.keys(this.powerupsActive).forEach(key => {
      if (this.powerupsActive[key] > 0) {
        this.powerupsActive[key] -= dt;
        if (this.powerupsActive[key] <= 0) {
          this.powerupsActive[key] = 0;
          
          // Revert slowmo timescales
          if (key === 'slowmo' && this.frostDuration <= 0) {
            this.timeScale = 1.0;
          }
        }
      }
    });

    if (this.powerupsActive.slowmo > 0) {
      globalTimescaleMod = 0.35;
    }

    // 2. Resolve hazard penalties decay
    if (this.frostDuration > 0) {
      this.frostDuration -= dt;
      globalTimescaleMod = 0.25;
      if (this.frostDuration <= 0) {
        this.frostDuration = 0;
        if (this.powerupsActive.slowmo === 0) this.timeScale = 1.0;
      }
    }

    this.timeScale = globalTimescaleMod;

    if (this.poisonDuration > 0) {
      this.poisonDuration = Math.max(0, this.poisonDuration - dt);
    }

    if (this.electricDuration > 0) {
      this.electricDuration = Math.max(0, this.electricDuration - dt);
    }

    // 3. Spawner clock
    this.difficultyTimer += dt;
    this.spawnTimer += dt;
    
    // Scale launch rate based on difficulty timer
    const rateReduction = Math.min(1.1, this.difficultyTimer * 0.015);
    const interval = Math.max(0.75, this.spawnInterval - rateReduction);
    
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnWave();
    }

    // 4. Timer mode decrements
    if (this.gameMode === 'zen' || this.gameMode === 'arcade') {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) {
        this.gameOver();
      }
      this.updateHUD();
    }

    // 5. Update Backgrounds manager
    this.backgrounds.update(dt);

    // 6. Update Entities (Fruits, hazards, power-ups)
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.update(dt, this.timeScale);

      // Magnet power-up logic: pulls all fruits horizontally towards blade trail cursor
      if (this.powerupsActive.magnet > 0 && e instanceof Fruit && !e.sliced) {
        const lastPoint = this.physics.swipePoints[this.physics.swipePoints.length - 1];
        if (lastPoint) {
          const dx = lastPoint.x - e.x;
          // Apply pulling force to horizontal speed
          e.vx += dx * 5.0 * dt;
        }
      }

      // Check if item falls off screen
      if (e.y > this.height + 60 && e.vy > 0) {
        // If player misses a fruit in Classic or Survival mode, subtract a life
        if (!e.sliced && e instanceof Fruit) {
          if (this.gameMode === 'classic' || this.gameMode === 'survival') {
            if (this.powerupsActive.shield > 0) {
              this.powerupsActive.shield = 0; // shield absorbs
              this.floatingTexts.push(new FloatingText("SHIELD ABSorbed", e.x, this.height - 20, '#4CAF50', 1.1));
            } else {
              this.lives--;
              this.shakeScreen(8);
              this.updateHUD();
              if (this.lives <= 0) {
                this.gameOver();
              }
            }
          }
        }
        this.entities.splice(i, 1);
      }
    }

    // 7. Update Fruit Halves
    for (let i = this.halves.length - 1; i >= 0; i--) {
      const h = this.halves[i];
      h.update(dt, this.timeScale);
      if (h.y > this.height + 50) {
        this.halves.splice(i, 1);
      }
    }

    // 8. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt, this.timeScale);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 9. Update Background Stains (fade stains)
    for (let i = this.stains.length - 1; i >= 0; i--) {
      const s = this.stains[i];
      s.update(dt, this.timeScale);
      if (s.life <= 0) {
        this.stains.splice(i, 1);
      }
    }

    // 10. Update Floating Score/Text notifications
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.update(dt);
      if (f.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Decay Screen Shake Intensity
    if (this.shakeIntensity > 0) {
      this.shakeIntensity -= dt * 60;
    }
  }

  // --- DRAW EVERYTHING ---
  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Draw background canvas layer
    this.backgrounds.draw(ui.perfMode);

    // Context save for screen shake translations
    ctx.save();
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() * 2 - 1) * this.shakeIntensity;
      const sy = (Math.random() * 2 - 1) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

    // Clear main gameplay canvas
    ctx.clearRect(0, 0, w, h);

    // Draw permanent stains behind entities
    this.stains.forEach(s => s.draw(ctx));

    // Draw halves
    this.halves.forEach(h => h.draw(ctx));

    // Draw active fruits/hazards/power-ups
    this.entities.forEach(e => {
      if (!e.sliced) {
        e.draw(ctx);
        
        // Render spark trails on burning bomb fuses
        if (e instanceof Hazard && e.type === 'bomb') {
          const fuseTip = e.getFuseTipPosition();
          
          // Emit spark particles dynamically
          if (Math.random() > 0.3 && !ui.perfMode) {
            this.particles.push(new SparkParticle(fuseTip.x, fuseTip.y));
          }
        }
      }
    });

    // Draw sparks and juices
    this.particles.forEach(p => p.draw(ctx));

    // Draw blade swipe trail
    const isGolden = this.powerupsActive.golden > 0;
    this.physics.drawBladeTrail(ctx, ui.activeBlade, isGolden);

    // Draw floating score cards
    this.floatingTexts.forEach(f => f.draw(ctx));

    // Restore screen shake coordinate space
    ctx.restore();

    // Draw full-screen overlay filters depending on status
    
    // Frost freeze effect overlay (SlowMo active)
    if (this.frostDuration > 0 || this.powerupsActive.slowmo > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.fillRect(0, 0, w, h);
      
      // Ice framing border
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, w, h);
      ctx.restore();
    }

    // Poison screen blur overlay
    if (this.poisonDuration > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 230, 118, 0.15)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠ BLADE BLOCKED ☠', w / 2, h * 0.4);
      ctx.restore();
    }

    // Electric shock flashing
    if (this.electricDuration > 0) {
      ctx.save();
      if (Math.random() > 0.5) {
        ctx.fillStyle = 'rgba(213, 0, 249, 0.18)';
        ctx.fillRect(0, 0, w, h);
      }
      
      ctx.strokeStyle = '#D500F9';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ SHOCKED ⚡', w / 2, h * 0.4);
      ctx.restore();
    }

    // Red flash blast (bomb explosion indicator)
    if (this.flashScreenColor) {
      ctx.save();
      ctx.fillStyle = this.flashScreenColor;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      this.flashScreenColor = null; // fade instantly
    }
  }
}

// Instantiate and bind to global context for debugging
window.game = new Game();

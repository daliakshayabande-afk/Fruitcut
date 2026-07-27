/**
 * Splat Blade - UI and Screen Manager Module
 * Manages menus, screens, shop purchases, local storage settings, daily challenges, and profile achievements.
 */

import { audio } from './audio.js';

class UIManager {
  constructor() {
    this.game = null;
    
    // Core state
    this.coins = 100;
    this.ownedBlades = ['neon'];
    this.ownedBackgrounds = ['tropical'];
    this.activeBlade = 'neon';
    this.activeBackground = 'tropical';
    
    // Settings state
    this.soundVolume = 80;
    this.musicVolume = 40;
    this.screenShake = true;
    this.perfMode = false;

    // Daily Challenges Mock data (saved in localStorage)
    this.challenges = [
      { id: 'cut_watermelon', title: 'Watermelon Master', desc: 'Slice 10 watermelons in Classic/Arcade', target: 10, current: 0, reward: 50, claimed: false },
      { id: 'high_combo', title: 'Combo Frenzy', desc: 'Perform a 4x or higher combo', target: 1, current: 0, reward: 80, claimed: false },
      { id: 'zen_score', title: 'Zen Meditation', desc: 'Score 250 points in Zen Mode', target: 250, current: 0, reward: 60, claimed: false }
    ];

    // Achievements definitions
    this.achievements = [
      { id: 'novice', name: 'Novice Cutter', desc: 'Slice 50 total fruits in your career', icon: '🔪' },
      { id: 'combo_king', name: 'Combo Master', desc: 'Perform a 4x or greater combo', icon: '👑' },
      { id: 'zen_lord', name: 'Zen Specialist', desc: 'Reach 200+ points in Zen mode', icon: '🌸' },
      { id: 'bomb_dodger', name: 'Ninja Reflexes', desc: 'Score 150+ in Classic without hitting bombs', icon: '💨' }
    ];
  }

  init(gameInstance) {
    this.game = gameInstance;
    
    this.loadState();
    this.setupEventListeners();
    this.renderShop();
    this.renderChallenges();
    this.renderAchievements();
    this.updateStatsDisplay();
  }

  showScreen(screenId) {
    // Hide all menu screens
    const screens = document.querySelectorAll('.menu-screen');
    screens.forEach(s => s.classList.add('hidden'));

    // Show specified screen
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    // Toggle HUD visibility based on screen
    const hud = document.getElementById('hud');
    if (screenId === 'hud-dummy') {
      hud.classList.remove('hidden');
    } else {
      hud.classList.add('hidden');
    }
  }

  setupEventListeners() {
    // Nav back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.showScreen('main-menu');
      });
    });

    // Main Menu Nav Buttons
    document.getElementById('nav-shop').addEventListener('click', () => {
      audio.playClick();
      this.renderShop();
      this.showScreen('shop-screen');
    });

    document.getElementById('nav-challenges').addEventListener('click', () => {
      audio.playClick();
      this.renderChallenges();
      this.showScreen('challenges-screen');
    });

    document.getElementById('nav-leaderboard').addEventListener('click', () => {
      audio.playClick();
      this.renderLeaderboard('classic');
      this.showScreen('leaderboard-screen');
    });

    document.getElementById('nav-profile').addEventListener('click', () => {
      audio.playClick();
      this.renderAchievements();
      this.showScreen('profile-screen');
    });

    document.getElementById('nav-settings').addEventListener('click', () => {
      audio.playClick();
      this.showScreen('settings-screen');
    });

    // Mode Buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        audio.resume(); // Ensure AudioContext is active on user action
        const mode = btn.getAttribute('data-mode');
        
        // Show HUD
        document.getElementById('hud').classList.remove('hidden');
        this.showScreen('hud-dummy'); // hides menu overlay
        
        // Start the game mode
        this.game.startGame(mode);
      });
    });

    // In-game Pause/Resume buttons
    document.getElementById('pause-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.togglePause();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.togglePause();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.togglePause();
      this.game.restartGame();
    });

    document.getElementById('exit-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.togglePause();
      this.game.exitToMenu();
    });

    // Game Over actions
    document.getElementById('gameover-restart-btn').addEventListener('click', () => {
      audio.playClick();
      ui.showScreen('hud-dummy');
      this.game.restartGame();
    });

    document.getElementById('gameover-exit-btn').addEventListener('click', () => {
      audio.playClick();
      this.game.exitToMenu();
    });

    // Ad buttons placeholders
    document.getElementById('ad-coins-btn').addEventListener('click', () => {
      audio.playPowerup();
      this.coins += 50;
      this.saveState();
      document.getElementById('shop-coins').innerText = this.coins;
      alert("Ad completed! You earned 🪙 50 coins.");
    });

    document.getElementById('ad-revive-btn').addEventListener('click', () => {
      audio.playPowerup();
      const revived = this.game.revivePlayer();
      if (revived) {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
      }
    });

    // Settings adjustments
    const soundSlider = document.getElementById('sound-volume');
    soundSlider.addEventListener('input', (e) => {
      this.soundVolume = parseInt(e.target.value);
      audio.setSoundVolume(this.soundVolume / 100);
      this.saveState();
    });

    const musicSlider = document.getElementById('music-volume');
    musicSlider.addEventListener('input', (e) => {
      this.musicVolume = parseInt(e.target.value);
      audio.setMusicVolume(this.musicVolume / 100);
      this.saveState();
    });

    const shakeToggle = document.getElementById('screen-shake-toggle');
    shakeToggle.addEventListener('change', (e) => {
      this.screenShake = e.target.checked;
      this.saveState();
    });

    const perfToggle = document.getElementById('perf-mode-toggle');
    perfToggle.addEventListener('change', (e) => {
      this.perfMode = e.target.checked;
      this.saveState();
    });

    // Settings selectors
    document.querySelectorAll('.skin-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const skin = btn.getAttribute('data-skin');
        if (this.ownedBlades.includes(skin)) {
          audio.playClick();
          this.activeBlade = skin;
          document.querySelectorAll('.skin-option').forEach(o => o.classList.remove('active'));
          btn.classList.add('active');
          this.saveState();
        } else {
          alert('You must purchase this blade in the Coin Shop first!');
        }
      });
    });

    document.querySelectorAll('.bg-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const bg = btn.getAttribute('data-bg');
        if (this.ownedBackgrounds.includes(bg)) {
          audio.playClick();
          this.activeBackground = bg;
          this.game.backgrounds.setTheme(bg);
          document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
          btn.classList.add('active');
          this.saveState();
        } else {
          alert('You must purchase this background theme in the Coin Shop first!');
        }
      });
    });

    // Shop Tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderShop(tab.getAttribute('data-tab'));
      });
    });

    // Leaderboard Tabs
    document.querySelectorAll('.leaderboard-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.leaderboard-mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderLeaderboard(tab.getAttribute('data-mode'));
      });
    });
  }

  loadState() {
    this.coins = parseInt(localStorage.getItem('splat_coins')) || 100;
    this.ownedBlades = JSON.parse(localStorage.getItem('splat_blades')) || ['neon'];
    this.ownedBackgrounds = JSON.parse(localStorage.getItem('splat_bg_themes')) || ['tropical'];
    this.activeBlade = localStorage.getItem('splat_active_blade') || 'neon';
    this.activeBackground = localStorage.getItem('splat_active_bg') || 'tropical';
    
    this.soundVolume = parseInt(localStorage.getItem('splat_sound_volume')) ?? 80;
    this.musicVolume = parseInt(localStorage.getItem('splat_music_volume')) ?? 40;
    this.screenShake = localStorage.getItem('splat_screen_shake') !== 'false';
    this.perfMode = localStorage.getItem('splat_perf_mode') === 'true';

    // Load sliders and check toggles in DOM
    document.getElementById('sound-volume').value = this.soundVolume;
    document.getElementById('music-volume').value = this.musicVolume;
    document.getElementById('screen-shake-toggle').checked = this.screenShake;
    document.getElementById('perf-mode-toggle').checked = this.perfMode;

    audio.setSoundVolume(this.soundVolume / 100);
    audio.setMusicVolume(this.musicVolume / 100);

    // Sync skin selections
    document.querySelectorAll('.skin-option').forEach(btn => {
      if (btn.getAttribute('data-skin') === this.activeBlade) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Sync background selection
    document.querySelectorAll('.bg-option').forEach(btn => {
      if (btn.getAttribute('data-bg') === this.activeBackground) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Sync Shop coins
    document.getElementById('shop-coins').innerText = this.coins;

    // Load challenges state
    const savedChallenges = localStorage.getItem('splat_challenges');
    if (savedChallenges) {
      this.challenges = JSON.parse(savedChallenges);
    }
  }

  saveState() {
    localStorage.setItem('splat_coins', this.coins);
    localStorage.setItem('splat_blades', JSON.stringify(this.ownedBlades));
    localStorage.setItem('splat_bg_themes', JSON.stringify(this.ownedBackgrounds));
    localStorage.setItem('splat_active_blade', this.activeBlade);
    localStorage.setItem('splat_active_bg', this.activeBackground);
    
    localStorage.setItem('splat_sound_volume', this.soundVolume);
    localStorage.setItem('splat_music_volume', this.musicVolume);
    localStorage.setItem('splat_screen_shake', this.screenShake);
    localStorage.setItem('splat_perf_mode', this.perfMode);
    localStorage.setItem('splat_challenges', JSON.stringify(this.challenges));
  }

  incrementStat(statKey, amount = 1) {
    const key = `splat_stat_${statKey}`;
    const val = (parseInt(localStorage.getItem(key)) || 0) + amount;
    localStorage.setItem(key, val);
    this.updateStatsDisplay();
  }

  getStat(statKey) {
    return parseInt(localStorage.getItem(`splat_stat_${statKey}`)) || 0;
  }

  updateStatsDisplay() {
    // Sync profile page values
    const totalSlices = this.getStat('slices');
    const gamesPlayed = this.getStat('games');
    const maxCombo = this.getStat('max_combo');
    const bombsHit = this.getStat('bombs');

    document.getElementById('stat-total-slices').innerText = totalSlices;
    document.getElementById('stat-games-played').innerText = gamesPlayed;
    document.getElementById('stat-max-combo').innerText = maxCombo;
    document.getElementById('stat-bombs-hit').innerText = bombsHit;
  }

  // Render items in shop tab
  renderShop(tab = 'blades') {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    
    document.getElementById('shop-coins').innerText = this.coins;

    if (tab === 'blades') {
      const items = [
        { id: 'neon', name: 'Neon Blue', icon: '🔷', price: 0, desc: 'Classic cyber blue trail.' },
        { id: 'fire', name: 'Fire Slash', icon: '🔥', price: 150, desc: 'Fiery burning orange/red trail.' },
        { id: 'rainbow', name: 'Rainbow Glow', icon: '🌈', price: 300, desc: 'Chroma cycle trail.' },
        { id: 'golden', name: 'Golden Spark', icon: '⚡', price: 500, desc: 'Wealthy gold crackle trail.' }
      ];

      items.forEach(item => {
        const owned = this.ownedBlades.includes(item.id);
        const card = document.createElement('div');
        card.className = 'shop-card';
        
        card.innerHTML = `
          <div class="shop-card-preview">${item.icon}</div>
          <div class="shop-card-name">${item.name}</div>
          <p style="font-size:10px; color:#aaa; margin-top:-5px;">${item.desc}</p>
          <button class="shop-card-btn ${owned ? 'owned' : ''}" data-id="${item.id}">
            ${owned ? 'Equipped' : `🪙 ${item.price}`}
          </button>
        `;

        const btn = card.querySelector('.shop-card-btn');
        if (!owned) {
          btn.addEventListener('click', () => this.buyItem('blade', item.id, item.price));
        } else {
          // Equips blade instantly
          btn.addEventListener('click', () => {
            audio.playClick();
            this.activeBlade = item.id;
            this.saveState();
            this.renderShop('blades');
            
            // Sync settings UI selectors
            document.querySelectorAll('.skin-option').forEach(o => {
              if (o.getAttribute('data-skin') === item.id) o.classList.add('active');
              else o.classList.remove('active');
            });
          });
        }

        grid.appendChild(card);
      });
    } else {
      // background themes
      const items = [
        { id: 'tropical', name: 'Tropical', icon: '🌴', price: 0, desc: 'Windy garden rays.' },
        { id: 'sunset', name: 'Sunset Sky', icon: '🌇', price: 100, desc: 'Dusk silhouette canopy.' },
        { id: 'japanese', name: 'Zen Garden', icon: '🌸', price: 200, desc: 'Drifting sakura petals.' },
        { id: 'neon', name: 'Neon Grid', icon: '🛸', price: 300, desc: 'Cyber vanishing lines.' },
        { id: 'jungle', name: 'Jungle Canopy', icon: '🐆', price: 400, desc: 'Parallax glowing fireflies.' }
      ];

      items.forEach(item => {
        const owned = this.ownedBackgrounds.includes(item.id);
        const card = document.createElement('div');
        card.className = 'shop-card';
        
        card.innerHTML = `
          <div class="shop-card-preview">${item.icon}</div>
          <div class="shop-card-name">${item.name}</div>
          <p style="font-size:10px; color:#aaa; margin-top:-5px;">${item.desc}</p>
          <button class="shop-card-btn ${owned ? 'owned' : ''}" data-id="${item.id}">
            ${owned ? 'Equipped' : `🪙 ${item.price}`}
          </button>
        `;

        const btn = card.querySelector('.shop-card-btn');
        if (!owned) {
          btn.addEventListener('click', () => this.buyItem('background', item.id, item.price));
        } else {
          btn.addEventListener('click', () => {
            audio.playClick();
            this.activeBackground = item.id;
            this.game.backgrounds.setTheme(item.id);
            this.saveState();
            this.renderShop('bg-themes');
            
            // Sync settings UI selectors
            document.querySelectorAll('.bg-option').forEach(o => {
              if (o.getAttribute('data-bg') === item.id) o.classList.add('active');
              else o.classList.remove('active');
            });
          });
        }

        grid.appendChild(card);
      });
    }
  }

  buyItem(category, id, price) {
    if (this.coins < price) {
      alert("Not enough coins! Watch a sponsor video to earn 🪙 50 coins.");
      return;
    }
    
    audio.playPowerup();
    this.coins -= price;
    if (category === 'blade') {
      this.ownedBlades.push(id);
      this.activeBlade = id;
    } else {
      this.ownedBackgrounds.push(id);
      this.activeBackground = id;
      this.game.backgrounds.setTheme(id);
    }
    
    this.saveState();
    this.renderShop(category === 'blade' ? 'blades' : 'bg-themes');
  }

  // High Scores handling
  saveHighScore(mode, score) {
    const key = `splat_high_score_${mode}`;
    const currentHigh = parseInt(localStorage.getItem(key)) || 0;
    if (score > currentHigh) {
      localStorage.setItem(key, score);
    }

    // Insert into leaderboard table
    const leaderboardKey = `splat_leaderboard_${mode}`;
    let entries = JSON.parse(localStorage.getItem(leaderboardKey)) || this.getDefaultLeaderboard(mode);
    
    // Add current run
    entries.push({ player: 'You (Chef)', score: score, date: new Date().toLocaleDateString() });
    
    // Sort descending
    entries.sort((a, b) => b.score - a.score);
    
    // Keep top 10
    entries = entries.slice(0, 10);
    
    localStorage.setItem(leaderboardKey, JSON.stringify(entries));
  }

  getHighScore(mode) {
    return parseInt(localStorage.getItem(`splat_high_score_${mode}`)) || 0;
  }

  getDefaultLeaderboard(mode) {
    // Returns default mock names
    const multiplier = mode === 'zen' ? 1.2 : (mode === 'survival' ? 0.8 : 1.5);
    return [
      { player: 'SplatMaster', score: Math.round(550 * multiplier) },
      { player: 'SliceNinja', score: Math.round(420 * multiplier) },
      { player: 'BladeRunner', score: Math.round(380 * multiplier) },
      { player: 'CutterChef', score: Math.round(290 * multiplier) },
      { player: 'ZenCutter', score: Math.round(210 * multiplier) }
    ];
  }

  renderLeaderboard(mode = 'classic') {
    const leaderboardKey = `splat_leaderboard_${mode}`;
    let entries = JSON.parse(localStorage.getItem(leaderboardKey)) || this.getDefaultLeaderboard(mode);
    
    // Sort descending
    entries.sort((a, b) => b.score - a.score);
    
    const body = document.getElementById('leaderboard-body');
    body.innerHTML = '';

    entries.forEach((entry, idx) => {
      const row = document.createElement('tr');
      
      let rankClass = '';
      if (idx === 0) rankClass = 'class="rank-gold"';
      else if (idx === 1) rankClass = 'class="rank-silver"';
      else if (idx === 2) rankClass = 'class="rank-bronze"';

      row.innerHTML = `
        <td ${rankClass}>#${idx + 1}</td>
        <td>${entry.player}</td>
        <td style="font-weight:700;">${entry.score}</td>
      `;
      body.appendChild(row);
    });
  }

  // Daily Challenge management
  renderChallenges() {
    const list = document.getElementById('challenges-list');
    list.innerHTML = '';

    this.challenges.forEach((ch, idx) => {
      const card = document.createElement('div');
      card.className = 'challenge-item';
      
      const percent = Math.min(100, Math.round((ch.current / ch.target) * 100));
      const completed = ch.current >= ch.target;
      
      card.innerHTML = `
        <div class="challenge-info">
          <div class="challenge-title-text">${ch.title}</div>
          <div class="challenge-desc">${ch.desc}</div>
          <div class="challenge-progress-bar-container">
            <div class="challenge-progress-bar" style="width: ${percent}%;"></div>
          </div>
          <div style="font-size:10px; color:#aaa; margin-top:2px;">Progress: ${ch.current} / ${ch.target}</div>
        </div>
        <div class="challenge-reward">🪙 ${ch.reward}</div>
        <div>
          <button class="claim-btn ${ch.claimed ? 'completed' : ''} ${!completed ? 'completed' : ''}" data-idx="${idx}">
            ${ch.claimed ? 'Claimed' : 'Claim'}
          </button>
        </div>
      `;

      const btn = card.querySelector('.claim-btn');
      if (completed && !ch.claimed) {
        btn.addEventListener('click', () => this.claimChallenge(idx));
      }

      list.appendChild(card);
    });
  }

  updateChallengeProgress(id, amount = 1) {
    this.challenges.forEach(ch => {
      if (ch.id === id && !ch.claimed) {
        ch.current = Math.min(ch.target, ch.current + amount);
      }
    });
    this.saveState();
  }

  claimChallenge(idx) {
    const ch = this.challenges[idx];
    if (ch.claimed) return;
    
    audio.playPowerup();
    ch.claimed = true;
    this.coins += ch.reward;
    this.saveState();
    
    alert(`Reward Claimed! +🪙 ${ch.reward} coins added.`);
    this.renderChallenges();
  }

  // Achievements checking
  renderAchievements() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';

    const totalSlices = this.getStat('slices');
    const maxCombo = this.getStat('max_combo');
    const zenHigh = this.getHighScore('zen');
    const classicHigh = this.getHighScore('classic');
    const bombHits = this.getStat('bombs');

    // Conditions checking
    const state = {
      novice: totalSlices >= 50,
      combo_king: maxCombo >= 4,
      zen_lord: zenHigh >= 200,
      bomb_dodger: classicHigh >= 150 && bombHits === 0
    };

    this.achievements.forEach(ach => {
      const unlocked = state[ach.id] || false;
      const card = document.createElement('div');
      card.className = `achievement-item ${unlocked ? 'unlocked' : ''}`;
      
      card.innerHTML = `
        <div class="achievement-badge">${ach.icon}</div>
        <div class="achievement-details">
          <div class="achievement-name">${ach.name}</div>
          <div class="achievement-desc">${ach.desc}</div>
        </div>
      `;
      list.appendChild(card);
    });
  }
}

export const ui = new UIManager();

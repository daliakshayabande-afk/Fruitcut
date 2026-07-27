/**
 * Splat Blade - Animated Canvas Background Manager
 * Handles drawing and animating the game backgrounds on the secondary canvas.
 */

class Leaf {
  constructor(w, h) {
    this.reset(w, h, true);
  }

  reset(w, h, randomY = false) {
    this.x = Math.random() * w;
    this.y = randomY ? Math.random() * h : -20;
    this.size = Math.random() * 15 + 8;
    this.vy = Math.random() * 40 + 20; // slow drift down
    this.vx = Math.random() * 20 + 10; // drift right
    this.swaySpeed = Math.random() * 2 + 1;
    this.swayRange = Math.random() * 15 + 5;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRotation = Math.random() * 0.5 - 0.25;
  }

  update(dt, w, h) {
    this.y += this.vy * dt;
    this.x += this.vx * dt;
    
    // Sway
    this.x += Math.sin(this.swayOffset) * this.swayRange * dt;
    this.swayOffset += this.swaySpeed * dt;
    this.rotation += this.vRotation * dt;

    if (this.y > h + 20 || this.x > w + 20) {
      this.reset(w, h, false);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Leaf shape
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.2, this.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)'; // semi-transparent green
    ctx.fill();
    
    // Leaf center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-this.size * 1.2, 0);
    ctx.lineTo(this.size * 1.2, 0);
    ctx.stroke();

    ctx.restore();
  }
}

class Petal {
  constructor(w, h) {
    this.reset(w, h, true);
  }

  reset(w, h, randomY = false) {
    this.x = Math.random() * w;
    this.y = randomY ? Math.random() * h : -20;
    this.size = Math.random() * 10 + 6;
    this.vy = Math.random() * 50 + 30;
    this.vx = (Math.random() * -30 - 10); // drifts left
    this.swaySpeed = Math.random() * 3 + 1.5;
    this.swayRange = Math.random() * 20 + 8;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRotation = Math.random() * 2 - 1;
  }

  update(dt, w, h) {
    this.y += this.vy * dt;
    this.x += this.vx * dt;
    
    this.x += Math.sin(this.swayOffset) * this.swayRange * dt;
    this.swayOffset += this.swaySpeed * dt;
    this.rotation += this.vRotation * dt;

    if (this.y > h + 20 || this.x < -20) {
      this.reset(w, h, false);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Cherry Blossom Petal (pink heartish oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.1, this.size * 0.7, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 182, 193, 0.35)'; // light pink
    ctx.fill();

    ctx.restore();
  }
}

class Cloud {
  constructor(w, h) {
    this.reset(w, h, true);
  }

  reset(w, h, randomX = false) {
    this.x = randomX ? Math.random() * w : -250;
    this.y = Math.random() * h * 0.4; // top 40% of screen
    this.width = Math.random() * 150 + 100;
    this.height = this.width * 0.4;
    this.vx = Math.random() * 8 + 3; // very slow drift
  }

  update(dt, w, h) {
    this.x += this.vx * dt;
    if (this.x > w + 50) {
      this.reset(w, h, false);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    
    // Draw basic pill-like cloud block
    const cx = this.x;
    const cy = this.y;
    const cw = this.width;
    const ch = this.height;
    
    ctx.arc(cx, cy, ch, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(cx + cw, cy - ch);
    ctx.arc(cx + cw, cy, ch, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

class Firefly {
  constructor(w, h) {
    this.reset(w, h, true);
  }

  reset(w, h, randomY = false) {
    this.x = Math.random() * w;
    this.y = randomY ? Math.random() * h : h + 10;
    this.size = Math.random() * 2.5 + 1.5;
    this.vx = (Math.random() * 30 - 15);
    this.vy = (Math.random() * -40 - 10); // slow floating up
    this.pulse = Math.random() * Math.PI;
    this.pulseSpeed = Math.random() * 2 + 1.5;
  }

  update(dt, w, h) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.pulse += this.pulseSpeed * dt;
    
    // Add random brownian drift
    this.vx += (Math.random() * 10 - 5) * dt;
    this.vy += (Math.random() * 10 - 5) * dt;
    
    // cap speed
    this.vx = Math.max(-30, Math.min(30, this.vx));
    this.vy = Math.max(-60, Math.min(10, this.vy));

    if (this.y < -10 || this.x < -10 || this.x > w + 10) {
      this.reset(w, h, false);
    }
  }

  draw(ctx) {
    ctx.save();
    const alpha = (Math.sin(this.pulse) + 1.0) * 0.35 + 0.15; // float glow osc
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFEE58'; // soft yellow glow
    ctx.shadowBlur = this.size * 4;
    ctx.shadowColor = '#FFEE58';
    ctx.fill();
    ctx.restore();
  }
}

export class BackgroundManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = 'tropical'; // default
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.leaves = [];
    this.petals = [];
    this.clouds = [];
    this.fireflies = [];
    
    // Sun details
    this.sunPulse = 0;
    
    // Grid animation details
    this.gridOffset = 0;
    
    this.initEntities();
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.initEntities();
  }

  setTheme(theme) {
    this.theme = theme;
  }

  initEntities() {
    this.leaves = Array.from({ length: 15 }, () => new Leaf(this.width, this.height));
    this.petals = Array.from({ length: 20 }, () => new Petal(this.width, this.height));
    this.clouds = Array.from({ length: 4 }, () => new Cloud(this.width, this.height));
    this.fireflies = Array.from({ length: 22 }, () => new Firefly(this.width, this.height));
  }

  update(dt) {
    switch (this.theme) {
      case 'tropical':
        this.leaves.forEach(l => l.update(dt, this.width, this.height));
        break;
      case 'sunset':
        this.clouds.forEach(c => c.update(dt, this.width, this.height));
        break;
      case 'japanese':
        this.petals.forEach(p => p.update(dt, this.width, this.height));
        this.sunPulse += dt * 0.5;
        break;
      case 'neon':
        this.gridOffset = (this.gridOffset + dt * 45) % 40; // grid scroll speed
        break;
      case 'jungle':
        this.fireflies.forEach(f => f.update(dt, this.width, this.height));
        break;
    }
  }

  draw(highPerfMode = false) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    ctx.clearRect(0, 0, w, h);

    switch (this.theme) {
      case 'tropical':
        // Fresh lush green gradient
        const gradTrop = ctx.createLinearGradient(0, 0, 0, h);
        gradTrop.addColorStop(0, '#1E4620');
        gradTrop.addColorStop(1, '#0C1E0D');
        ctx.fillStyle = gradTrop;
        ctx.fillRect(0, 0, w, h);

        // Sunny light rays from top-left
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 224, 0.04)';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(w * 0.2 + i * (w * 0.2), h);
          ctx.lineTo(w * 0.4 + i * (w * 0.2), h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Falling leaves
        if (!highPerfMode) {
          this.leaves.forEach(l => l.draw(ctx));
        }
        break;

      case 'sunset':
        // Linear dusk sunset gradient
        const gradSun = ctx.createLinearGradient(0, 0, 0, h);
        gradSun.addColorStop(0, '#280c42');
        gradSun.addColorStop(0.5, '#b02c34');
        gradSun.addColorStop(1, '#e37b27');
        ctx.fillStyle = gradSun;
        ctx.fillRect(0, 0, w, h);

        // Clouds scrolling
        if (!highPerfMode) {
          this.clouds.forEach(c => c.draw(ctx));
        }

        // Tree canopy silhouette at the bottom
        ctx.save();
        ctx.fillStyle = 'rgba(8, 3, 15, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, h);
        // Draws soft hills
        for (let x = 0; x <= w; x += 40) {
          const y = h - 30 - Math.sin(x * 0.015) * 15;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;

      case 'japanese':
        // Soft pink zen garden gradient
        const gradJap = ctx.createLinearGradient(0, 0, 0, h);
        gradJap.addColorStop(0, '#2D1F38');
        gradJap.addColorStop(0.6, '#4E2C48');
        gradJap.addColorStop(1, '#8A4E7A');
        ctx.fillStyle = gradJap;
        ctx.fillRect(0, 0, w, h);

        // Soft white sun setting
        ctx.save();
        const sunRadius = 60 + Math.sin(this.sunPulse) * 3;
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(255, 192, 203, 0.4)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(w * 0.7, h * 0.35, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Falling petals
        if (!highPerfMode) {
          this.petals.forEach(p => p.draw(ctx));
        }
        break;

      case 'neon':
        // Cyber punk grid
        ctx.fillStyle = '#05020a';
        ctx.fillRect(0, 0, w, h);

        // Horizontal scrolling lines
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.lineWidth = 1.5;
        
        const horizon = h * 0.45; // where perspective vanishes
        
        // draw perspective lines
        const numVanishingLines = 16;
        for (let i = 0; i <= numVanishingLines; i++) {
          const ratio = i / numVanishingLines;
          const targetX = w * ratio;
          ctx.beginPath();
          ctx.moveTo(w * 0.5, horizon);
          ctx.lineTo(targetX, h);
          ctx.stroke();
        }

        // draw horizontal grid lines (logarithmic spacing for pseudo-3D perspective)
        let yCoord = horizon;
        let spacing = 10;
        
        ctx.beginPath();
        // offset horizontal line rendering to scroll forwards
        let step = 0;
        while (yCoord < h) {
          const currentY = yCoord + (this.gridOffset * (spacing / 40));
          if (currentY > horizon && currentY < h) {
            ctx.moveTo(0, currentY);
            ctx.lineTo(w, currentY);
          }
          yCoord += spacing;
          spacing *= 1.25; // perspective stretch
        }
        ctx.stroke();
        ctx.restore();

        // Cyber top glow neon lines
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FF4081';
        ctx.strokeStyle = 'rgba(255, 64, 129, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        ctx.lineTo(w, horizon);
        ctx.stroke();
        ctx.restore();
        break;

      case 'jungle':
        // Dark deep moss jungle gradient
        const gradJun = ctx.createLinearGradient(0, 0, 0, h);
        gradJun.addColorStop(0, '#0B201A');
        gradJun.addColorStop(1, '#020A08');
        ctx.fillStyle = gradJun;
        ctx.fillRect(0, 0, w, h);

        // Parallax silhouette trees
        ctx.save();
        ctx.fillStyle = 'rgba(1, 14, 11, 0.5)';
        // Far tree range
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 60) {
          const treeH = 90 + Math.sin(x * 0.02) * 30 + Math.cos(x * 0.05) * 10;
          ctx.lineTo(x, h - treeH);
        }
        ctx.lineTo(w, h);
        ctx.fill();

        // Close tree range
        ctx.fillStyle = 'rgba(0, 5, 4, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 80) {
          const treeH = 50 + Math.cos(x * 0.015) * 20;
          ctx.lineTo(x, h - treeH);
        }
        ctx.lineTo(w, h);
        ctx.fill();
        ctx.restore();

        // Fireflies
        if (!highPerfMode) {
          this.fireflies.forEach(f => f.draw(ctx));
        }
        break;
    }
  }
}

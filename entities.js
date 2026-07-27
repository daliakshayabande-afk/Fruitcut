/**
 * Splat Blade - Entity Definitions and Rendering Module
 * Contains classes for Fruits, FruitHalves, Hazards, PowerUps, and Particles.
 */

// Helper to draw a shiny highlight on circular items
function drawGlossHighlight(ctx, r) {
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.4, r * 0.2, Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();
}

export class Fruit {
  constructor(type, x, y, vx, vy) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRotation = (Math.random() * 4 - 2) * 1.5; // spin speed
    this.sliced = false;
    this.initTypeProperties();
  }

  initTypeProperties() {
    // Standard fruit templates: radius, points, weight (gravity scaling), innerColor, outerColor
    const templates = {
      watermelon: { r: 48, pts: 1, w: 1.0, inner: '#E91E63', outer: '#2E7D32' },
      apple:      { r: 34, pts: 1, w: 1.0, inner: '#FFF59D', outer: '#D50000' },
      orange:     { r: 35, pts: 1, w: 1.0, inner: '#FF9800', outer: '#F57C00' },
      mango:      { r: 38, pts: 2, w: 1.1, inner: '#FFC107', outer: '#FF5722' },
      kiwi:       { r: 28, pts: 2, w: 0.9, inner: '#8BC34A', outer: '#5D4037' },
      pineapple:  { r: 44, pts: 3, w: 1.2, inner: '#FFEE58', outer: '#8D6E63' },
      strawberry: { r: 24, pts: 2, w: 0.8, inner: '#FF1744', outer: '#FF1744' },
      banana:     { r: 32, pts: 2, w: 0.9, inner: '#FFF9C4', outer: '#FFEB3B' },
      dragonfruit:{ r: 40, pts: 4, w: 1.15,inner: '#FFFFFF', outer: '#E91E63' },
      pomegranate:{ r: 36, pts: 3, w: 1.1, inner: '#C62828', outer: '#880E4F' }
    };

    const t = templates[this.type] || templates.apple;
    this.radius = t.r;
    this.points = t.pts;
    this.weight = t.w;
    this.innerColor = t.inner;
    this.outerColor = t.outer;
  }

  update(dt, timeScale) {
    if (this.sliced) return;
    
    // Apply gravity
    const gravity = 500 * this.weight;
    this.y += this.vy * dt * timeScale;
    this.x += this.vx * dt * timeScale;
    this.vy += gravity * dt * timeScale;

    // Apply spin
    this.rotation += this.vRotation * dt * timeScale;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    this.drawFruitBase(ctx, 0, 0);
    ctx.restore();
  }

  // Centered drawing of each fruit type (reused by fruit halves for clipping)
  drawFruitBase(ctx, x, y) {
    const r = this.radius;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';

    switch (this.type) {
      case 'watermelon':
        // Outer skin
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = this.outerColor;
        ctx.fill();
        // Inner rind (light green/white)
        ctx.beginPath();
        ctx.arc(x, y, r - 6, 0, Math.PI * 2);
        ctx.fillStyle = '#E8F5E9';
        ctx.fill();
        // Flesh
        ctx.beginPath();
        ctx.arc(x, y, r - 10, 0, Math.PI * 2);
        ctx.fillStyle = this.innerColor;
        ctx.fill();
        // Seeds
        ctx.fillStyle = '#212121';
        ctx.shadowBlur = 0;
        const seedAngles = [0, 0.4, 0.9, 1.5, 2.1, 2.7, 3.2, 3.8, 4.3, 4.9, 5.5, 6.0];
        seedAngles.forEach(a => {
          ctx.save();
          ctx.rotate(a);
          ctx.beginPath();
          ctx.ellipse(r * 0.45, 0, r * 0.08, r * 0.04, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        break;

      case 'apple':
        // Curved heart-like shape
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.bezierCurveTo(x + r * 1.1, y - r * 1.1, x + r * 1.1, y + r * 0.8, x + r * 0.2, y + r * 0.95);
        ctx.bezierCurveTo(x, y + r * 1.05, x, y + r * 1.05, x - r * 0.2, y + r * 0.95);
        ctx.bezierCurveTo(x - r * 1.1, y + r * 0.8, x - r * 1.1, y - r * 1.1, x, y - r);
        
        const gradApple = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 5, x, y, r);
        gradApple.addColorStop(0, '#FF5252');
        gradApple.addColorStop(1, this.outerColor);
        ctx.fillStyle = gradApple;
        ctx.fill();

        // Stem
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x + 5, y - r - 12, x + 8, y - r - 15);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#5D4037';
        ctx.stroke();
        
        // Leaf
        ctx.beginPath();
        ctx.ellipse(x + 5, y - r - 8, r * 0.25, r * 0.1, Math.PI / 6, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        break;

      case 'orange':
        // Main body
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const gradOrange = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 5, x, y, r);
        gradOrange.addColorStop(0, '#FFB74D');
        gradOrange.addColorStop(1, this.outerColor);
        ctx.fillStyle = gradOrange;
        ctx.fill();

        // Orange segmented slice details
        ctx.strokeStyle = '#FFE0B2';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        
        // Segments
        for (let i = 0; i < 8; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 4);
          ctx.beginPath();
          ctx.moveTo(x + 4, y);
          ctx.lineTo(x + r - 5, y);
          ctx.stroke();
          
          // Arc segment border
          ctx.beginPath();
          ctx.arc(x, y, r - 5, -0.2, 0.2);
          ctx.stroke();
          ctx.restore();
        }
        break;

      case 'mango':
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.15, r * 0.85, Math.PI / 8, 0, Math.PI * 2);
        const gradMango = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, r * 1.1);
        gradMango.addColorStop(0, '#FFEB3B');
        gradMango.addColorStop(0.5, '#FFC107');
        gradMango.addColorStop(1, this.outerColor);
        ctx.fillStyle = gradMango;
        ctx.fill();
        break;

      case 'kiwi':
        // Outer hairy skin
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = this.outerColor;
        ctx.fill();

        // Inner flesh ring
        ctx.beginPath();
        ctx.arc(x, y, r - 3, 0, Math.PI * 2);
        ctx.fillStyle = this.innerColor;
        ctx.fill();

        // Cream white core
        ctx.beginPath();
        ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#DCEDC8';
        ctx.fill();

        // Black seeds
        ctx.fillStyle = '#212121';
        ctx.shadowBlur = 0;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6;
          const sx = x + Math.cos(angle) * r * 0.45;
          const sy = y + Math.sin(angle) * r * 0.45;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'pineapple':
        // Oval body
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.85, r * 1.15, 0, 0, Math.PI * 2);
        const gradPine = ctx.createRadialGradient(x - 5, y - 5, 5, x, y, r * 1.1);
        gradPine.addColorStop(0, '#FFF59D');
        gradPine.addColorStop(0.7, '#FBC02D');
        gradPine.addColorStop(1, this.outerColor);
        ctx.fillStyle = gradPine;
        ctx.fill();

        // Pineapple cross hatch grid texture
        ctx.strokeStyle = '#D7CCC8';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.save();
        ctx.ellipse(x, y, r * 0.85, r * 1.15, 0, 0, Math.PI * 2);
        ctx.clip();
        for (let i = -r; i < r; i += 12) {
          ctx.beginPath();
          ctx.moveTo(x - r, y + i);
          ctx.lineTo(x + r, y + i - r);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - r, y + i);
          ctx.lineTo(x + r, y + i + r);
          ctx.stroke();
        }
        ctx.restore();

        // Spikey Leafy Crown (drawn sticking out top)
        ctx.save();
        ctx.translate(x, y - r * 1.0);
        ctx.fillStyle = '#2E7D32';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-10 + i * 8, 0);
          ctx.quadraticCurveTo(-15 + i * 15, -25, -25 + i * 25, -30);
          ctx.quadraticCurveTo(-5 + i * 5, -15, i * 2, 0);
          ctx.fill();
        }
        ctx.restore();
        break;

      case 'strawberry':
        // Heart shape pointing down
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.8);
        ctx.bezierCurveTo(x + r * 1.1, y - r, x + r * 0.9, y + r * 0.6, x, y + r * 1.1);
        ctx.bezierCurveTo(x - r * 0.9, y + r * 0.6, x - r * 1.1, y - r, x, y - r * 0.8);
        
        const gradStraw = ctx.createRadialGradient(x, y - r * 0.3, 2, x, y, r * 1.1);
        gradStraw.addColorStop(0, '#FF5252');
        gradStraw.addColorStop(1, this.outerColor);
        ctx.fillStyle = gradStraw;
        ctx.fill();

        // Tiny yellow achenes (seeds)
        ctx.fillStyle = '#FFF59D';
        ctx.shadowBlur = 0;
        const seedLocs = [
          [-5, -10], [5, -10], [-10, -3], [10, -3], [0, -3],
          [-7, 5], [7, 5], [0, 10], [-3, 16], [3, 16], [0, 22]
        ];
        seedLocs.forEach(loc => {
          ctx.beginPath();
          ctx.ellipse(x + loc[0], y + loc[1], 1.5, 0.8, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // Leaf crown
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.7);
        ctx.lineTo(x - 12, y - r * 1.1);
        ctx.lineTo(x - 4, y - r * 0.8);
        ctx.lineTo(x, y - r * 1.2);
        ctx.lineTo(x + 4, y - r * 0.8);
        ctx.lineTo(x + 12, y - r * 1.1);
        ctx.closePath();
        ctx.fill();
        break;

      case 'banana':
        // Curved crescent banana shape
        ctx.beginPath();
        ctx.moveTo(x - r * 1.2, y - r * 0.5);
        ctx.quadraticCurveTo(x, y + r * 0.8, x + r * 1.2, y - r * 0.5);
        ctx.quadraticCurveTo(x, y + r * 1.1, x - r * 1.2, y - r * 0.5);
        const gradBanana = ctx.createRadialGradient(x, y, 5, x, y, r * 1.2);
        gradBanana.addColorStop(0, '#FFFDE7');
        gradBanana.addColorStop(0.7, '#FFF59D');
        gradBanana.addColorStop(1, this.outerColor);
        ctx.fillStyle = gradBanana;
        ctx.fill();

        // Brown tips
        ctx.fillStyle = '#5D4037';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(x - r * 1.2, y - r * 0.5, 3, 0, Math.PI * 2);
        ctx.arc(x + r * 1.2, y - r * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'dragonfruit':
        // Pink scale oval body
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = this.outerColor;
        ctx.fill();

        // White inner flesh
        ctx.beginPath();
        ctx.arc(x, y, r - 6, 0, Math.PI * 2);
        ctx.fillStyle = this.innerColor;
        ctx.fill();

        // Flame leaves
        ctx.fillStyle = '#00E676';
        ctx.shadowBlur = 0;
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 3);
          ctx.beginPath();
          ctx.moveTo(r - 5, -5);
          ctx.quadraticCurveTo(r + 8, 0, r - 5, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Tiny black seeds scatter
        ctx.fillStyle = '#212121';
        for (let i = 0; i < 20; i++) {
          const radiusDist = Math.random() * (r - 12);
          const angle = Math.random() * Math.PI * 2;
          const sx = x + Math.cos(angle) * radiusDist;
          const sy = y + Math.sin(angle) * radiusDist;
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'pomegranate':
        // Rounded hexagonal shape with crown top
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const gradPom = ctx.createRadialGradient(x - r * 0.1, y - r * 0.1, 5, x, y, r);
        gradPom.addColorStop(0, '#E91E63');
        gradPom.addColorStop(0.7, '#C62828');
        gradPom.addColorStop(1, this.outerColor);
        ctx.fillStyle = gradPom;
        ctx.fill();

        // Crown peak
        ctx.fillStyle = this.outerColor;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - r + 2);
        ctx.lineTo(x - 12, y - r - 8);
        ctx.lineTo(x - 3, y - r - 3);
        ctx.lineTo(x, y - r - 10);
        ctx.lineTo(x + 3, y - r - 3);
        ctx.lineTo(x + 12, y - r - 8);
        ctx.lineTo(x + 8, y - r + 2);
        ctx.closePath();
        ctx.fill();
        break;
    }

    // Standard high-end glossy shine overlay
    drawGlossHighlight(ctx, r);
  }
}

export class FruitHalf {
  constructor(fruit, isLeft, sliceAngle, sliceNormalVx, sliceNormalVy) {
    this.type = fruit.type;
    this.radius = fruit.radius;
    this.innerColor = fruit.innerColor;
    this.outerColor = fruit.outerColor;
    
    this.x = fruit.x;
    this.y = fruit.y;
    
    // Half fruits fly outwards relative to slicing vector
    const pushSpeed = 160;
    const directionSign = isLeft ? -1 : 1;
    this.vx = fruit.vx + sliceNormalVx * pushSpeed * directionSign;
    this.vy = fruit.vy + sliceNormalVy * pushSpeed * directionSign - 100; // slight boost upwards
    
    this.rotation = fruit.rotation;
    this.vRotation = fruit.vRotation + (isLeft ? -3 : 3); // rotate halves away
    
    this.isLeft = isLeft;
    this.sliceAngle = sliceAngle;
    this.age = 0;
    this.weight = fruit.weight;
  }

  update(dt, timeScale) {
    // Gravity
    const gravity = 500 * this.weight;
    this.y += this.vy * dt * timeScale;
    this.x += this.vx * dt * timeScale;
    this.vy += gravity * dt * timeScale;

    // Spin
    this.rotation += this.vRotation * dt * timeScale;
    this.age += dt * timeScale;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Align canvas rotation to split angle plus its spin rotation
    ctx.rotate(this.sliceAngle + this.rotation);

    // Apply half-clipping path
    ctx.beginPath();
    const r = this.radius;
    if (this.isLeft) {
      // Clip left side
      ctx.rect(-r * 2.5, -r * 2.5, r * 2.5, r * 5.0);
    } else {
      // Clip right side
      ctx.rect(0, -r * 2.5, r * 2.5, r * 5.0);
    }
    ctx.clip();

    // Re-draw original base centered at 0, 0
    // Sliced state is represented by clipping
    const originalFruit = new Fruit(this.type, 0, 0, 0, 0);
    originalFruit.drawFruitBase(ctx, 0, 0);

    // Draw inner juicy flesh slice line highlights (adds extreme polish!)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 5;
    ctx.shadowColor = this.innerColor;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();

    ctx.restore();
  }
}

export class Hazard {
  constructor(type, x, y, vx, vy) {
    this.type = type; // 'bomb', 'frozen_bomb', 'poison', 'electric'
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 35;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRotation = (Math.random() * 4 - 2);
    this.sliced = false;
    this.sparkTimer = 0;
  }

  update(dt, timeScale) {
    const gravity = 400; // standard bomb gravity
    this.y += this.vy * dt * timeScale;
    this.x += this.vx * dt * timeScale;
    this.vy += gravity * dt * timeScale;
    this.rotation += this.vRotation * dt * timeScale;

    // Sparks for fuse
    this.sparkTimer += dt * timeScale;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const r = this.radius;

    if (this.type === 'bomb') {
      // Black iron bomb sphere
      const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(0.8, '#212121');
      grad.addColorStop(1, '#000');
      
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Bomb fuse holder
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(-6, -r - 4, 12, 6);

      // Curved rope fuse
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r - 4);
      ctx.quadraticCurveTo(-10, -r - 18, -4, -r - 28);
      ctx.stroke();

      // Glow effect around bomb
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255, 23, 68, 0.4)';
    } 
    else if (this.type === 'frozen_bomb') {
      // Ice crystal bomb
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const outerR = i % 2 === 0 ? r * 1.1 : r * 0.7;
        const lx = Math.cos(angle) * outerR;
        const ly = Math.sin(angle) * outerR;
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.closePath();

      const gradIce = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
      gradIce.addColorStop(0, '#E0F7FA');
      gradIce.addColorStop(0.6, '#4DD0E1');
      gradIce.addColorStop(1, '#0097A7');
      ctx.fillStyle = gradIce;
      ctx.fill();
      ctx.strokeStyle = '#B2EBF2';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Frost symbols inside
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❄', 0, 0);
    } 
    else if (this.type === 'poison') {
      // Poison fruit (glowing bubble toxic green apple shape)
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const gradPoison = ctx.createRadialGradient(-3, -3, 3, 0, 0, r);
      gradPoison.addColorStop(0, '#B9F6CA');
      gradPoison.addColorStop(0.7, '#00E676');
      gradPoison.addColorStop(1, '#00A152');
      ctx.fillStyle = gradPoison;
      ctx.fill();

      // Toxic skull symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', 0, 0);

      // Bubbles
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-8, -12, 4, 0, Math.PI * 2);
      ctx.stroke();
    } 
    else if (this.type === 'electric') {
      // Electric purple sphere
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const gradElec = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      gradElec.addColorStop(0, '#F3E5F5');
      gradElec.addColorStop(0.5, '#D500F9');
      gradElec.addColorStop(1, '#4A148C');
      ctx.fillStyle = gradElec;
      ctx.fill();

      // Electric spark outlines inside
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(2, -8);
      ctx.lineTo(-2, 2);
      ctx.lineTo(10, -2);
      ctx.stroke();
    }

    drawGlossHighlight(ctx, r);
    ctx.restore();
  }

  getFuseTipPosition() {
    // Computes where the spark particles should emit on the bomb fuse
    const angle = this.rotation;
    const r = this.radius;
    // Base fuse end in local coordinates is roughly (-4, -r - 28)
    const fx = -4;
    const fy = -r - 28;

    // Apply rotation transformation
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: this.x + (fx * cos - fy * sin),
      y: this.y + (fx * sin + fy * cos)
    };
  }
}

export class PowerUp {
  constructor(type, x, y, vx, vy) {
    this.type = type; // 'magnet', 'slowmo', 'double', 'frenzy', 'shield', 'golden'
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 32;
    this.pulse = 0;
    this.sliced = false;
  }

  update(dt, timeScale) {
    // Normal gravity
    const gravity = 420;
    this.y += this.vy * dt * timeScale;
    this.x += this.vx * dt * timeScale;
    this.vy += gravity * dt * timeScale;
    this.pulse += dt * 5 * timeScale;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const r = this.radius;
    const pulseRadius = r + Math.sin(this.pulse) * 4;

    // Outer neon glow bubble
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    
    // Choose glow colors depending on powerup type
    const colors = {
      magnet:   { glow: 'rgba(33, 150, 243, 0.4)',  fill: '#2196F3', icon: '🧲' },
      slowmo:   { glow: 'rgba(0, 229, 255, 0.4)',   fill: '#00E5FF', icon: '⏳' },
      double:   { glow: 'rgba(255, 215, 0, 0.5)',   fill: '#FFD700', icon: '2x' },
      frenzy:   { glow: 'rgba(233, 30, 99, 0.4)',   fill: '#E91E63', icon: '🔥' },
      shield:   { glow: 'rgba(76, 175, 80, 0.4)',   fill: '#4CAF50', icon: '🛡' },
      golden:   { glow: 'rgba(255, 152, 0, 0.4)',   fill: '#FF9800', icon: '⚔' }
    };
    
    const info = colors[this.type] || colors.slowmo;
    
    ctx.shadowBlur = 18;
    ctx.shadowColor = info.fill;
    
    // Gradient inside bubble
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, info.fill + '66'); // alpha hex
    grad.addColorStop(1, info.fill + '33');
    
    ctx.fillStyle = grad;
    ctx.fill();
    
    ctx.strokeStyle = info.fill;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center icon
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = this.type === 'double' ? 'bold 16px Outfit' : '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.icon, 0, 0);

    ctx.restore();
  }
}

// Particle System items
export class JuiceParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 300 + 100;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 150; // extra burst upwards
    
    this.radius = Math.random() * 5 + 3;
    this.alpha = 1.0;
    this.life = Math.random() * 0.4 + 0.3; // lifetime in seconds
    this.maxLife = this.life;
  }

  update(dt, timeScale) {
    this.x += this.vx * dt * timeScale;
    this.y += this.vy * dt * timeScale;
    this.vy += 800 * dt * timeScale; // gravity
    this.life -= dt * timeScale;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export class StainParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    
    this.radius = Math.random() * 25 + 15;
    this.alpha = 0.55;
    this.life = 6.0; // stain fades after 6 seconds
    this.maxLife = this.life;
    this.points = [];
    
    // Draw an irregular splat shape with 6 nodes
    const numNodes = 6;
    for (let i = 0; i < numNodes; i++) {
      const angle = (i * Math.PI * 2) / numNodes;
      const dist = this.radius * (Math.random() * 0.5 + 0.6);
      this.points.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist
      });
    }
  }

  update(dt, timeScale) {
    this.life -= dt * timeScale;
    this.alpha = Math.max(0, (this.life / this.maxLife) * 0.55);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.translate(this.x, this.y);
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export class SparkParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 150 + 50;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 50;
    
    this.radius = Math.random() * 3 + 1;
    this.life = Math.random() * 0.3 + 0.2;
    this.maxLife = this.life;
    this.color = Math.random() > 0.4 ? '#FFD700' : '#FF5722'; // gold or orange spark
  }

  update(dt, timeScale) {
    this.x += this.vx * dt * timeScale;
    this.y += this.vy * dt * timeScale;
    this.life -= dt * timeScale;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 5;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export class BladeTrailParticle {
  constructor(x, y, skin = 'neon') {
    this.x = x;
    this.y = y;
    this.skin = skin;
    this.life = 0.15; // 150ms life
    this.maxLife = this.life;
  }

  update(dt, timeScale) {
    this.life -= dt * timeScale;
  }

  draw(ctx, radius = 4) {
    if (this.life <= 0) return;
    ctx.save();
    
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);

    let color = '#00E5FF';
    let glow = '#00E5FF';
    
    if (this.skin === 'fire') {
      color = '#FF1744';
      glow = '#FF9100';
    } else if (this.skin === 'rainbow') {
      // dynamic rainbow cycle based on y coordinate
      const hue = (this.x + this.y) % 360;
      color = `hsl(${hue}, 100%, 60%)`;
      glow = `hsl(${hue}, 100%, 75%)`;
    } else if (this.skin === 'golden') {
      color = '#FFD700';
      glow = '#FF9800';
    }

    ctx.fillStyle = color;
    ctx.shadowBlur = radius * 3;
    ctx.shadowColor = glow;
    ctx.fill();
    ctx.restore();
  }
}

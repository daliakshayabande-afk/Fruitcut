/**
 * Splat Blade - Physics Engine Module
 * Manages swipe trails, velocity calculations, and line-to-circle intersection math.
 */

// Simple 2D point class
export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.time = Date.now();
  }
}

export class PhysicsEngine {
  constructor() {
    this.swipePoints = [];
    this.maxPointsLife = 120; // milliseconds that trail segments stay visible
    this.minSliceSpeed = 180; // minimum speed in px/sec to count as a slice
  }

  addSwipePoint(x, y) {
    this.swipePoints.push(new Point(x, y));
    this.cleanExpiredPoints();
  }

  clearSwipe() {
    this.swipePoints = [];
  }

  cleanExpiredPoints() {
    const now = Date.now();
    this.swipePoints = this.swipePoints.filter(p => now - p.time < this.maxPointsLife);
  }

  // Returns the current blade path segment for collision checking
  getCurrentSegment() {
    this.cleanExpiredPoints();
    if (this.swipePoints.length < 2) return null;
    
    // Use last two swipe points
    const p1 = this.swipePoints[this.swipePoints.length - 2];
    const p2 = this.swipePoints[this.swipePoints.length - 1];
    
    // Check speed
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dt = (p2.time - p1.time) / 1000; // in seconds
    
    if (dt <= 0) return null;
    
    const speed = Math.sqrt(dx * dx + dy * dy) / dt;
    
    if (speed >= this.minSliceSpeed) {
      return { p1, p2, dx, dy, speed };
    }
    
    return null;
  }

  /**
   * Checks if a line segment intersects a circle
   * @param {Point} p1 Segment Start
   * @param {Point} p2 Segment End
   * @param {number} cx Circle Center X
   * @param {number} cy Circle Center Y
   * @param {number} r Circle Radius
   * @returns {object|null} Intersection info or null
   */
  checkLineCircleIntersection(p1, p2, cx, cy, r) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) return null; // Dot

    // Projection factor t (0.0 to 1.0 represents the line segment)
    let t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t)); // clamp to line segment

    // Closest point coordinates on segment
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    // Squared distance
    const distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
    
    if (distSq <= r * r) {
      const sliceAngle = Math.atan2(dy, dx);
      
      // Calculate normal vectors for separating halves
      const len = Math.sqrt(lenSq);
      const nx = -dy / len; // Perpendicular normal X
      const ny = dx / len;  // Perpendicular normal Y
      
      return {
        intersectX: closestX,
        intersectY: closestY,
        sliceAngle: sliceAngle,
        normalX: nx,
        normalY: ny
      };
    }
    
    return null;
  }

  // Draw the blade trail (connecting points with dynamic size based on speed)
  drawBladeTrail(ctx, skin = 'neon', isGoldenActive = false) {
    this.cleanExpiredPoints();
    if (this.swipePoints.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const baseWidth = isGoldenActive ? 14 : 7;

    // Draw fading segments
    const now = Date.now();
    for (let i = 1; i < this.swipePoints.length; i++) {
      const p1 = this.swipePoints[i - 1];
      const p2 = this.swipePoints[i];
      
      // opacity decays towards end of trail
      const age1 = now - p1.time;
      const age2 = now - p2.time;
      
      const alpha1 = Math.max(0, 1 - age1 / this.maxPointsLife);
      const alpha2 = Math.max(0, 1 - age2 / this.maxPointsLife);
      
      // width shrinks along tail
      const width1 = baseWidth * alpha1;
      const width2 = baseWidth * alpha2;

      let color1, color2, glowColor;
      
      if (skin === 'fire') {
        color1 = `rgba(255, 23, 68, ${alpha1})`;
        color2 = `rgba(255, 145, 0, ${alpha2})`;
        glowColor = 'rgba(255, 61, 0, 0.6)';
      } else if (skin === 'rainbow') {
        const hue1 = (p1.x + p1.y) % 360;
        const hue2 = (p2.x + p2.y) % 360;
        color1 = `hsla(${hue1}, 100%, 60%, ${alpha1})`;
        color2 = `hsla(${hue2}, 100%, 60%, ${alpha2})`;
        glowColor = `hsla(${hue2}, 100%, 70%, 0.6)`;
      } else if (skin === 'golden') {
        color1 = `rgba(255, 215, 0, ${alpha1})`;
        color2 = `rgba(255, 152, 0, ${alpha2})`;
        glowColor = 'rgba(255, 215, 0, 0.6)';
      } else {
        // Neon Blue default
        color1 = `rgba(0, 229, 255, ${alpha1})`;
        color2 = `rgba(0, 184, 212, ${alpha2})`;
        glowColor = 'rgba(0, 229, 255, 0.5)';
      }

      ctx.shadowBlur = baseWidth * 1.5;
      ctx.shadowColor = glowColor;

      // Draw segment with color gradient
      const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = (width1 + width2) / 2;
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

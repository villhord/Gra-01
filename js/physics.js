export function aabbOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleOverlap(a, b) {
    const dx = a.cx - b.cx;
    const dy = a.cy - b.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < a.r + b.r;
}

export function pointDist(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function circleToAABBOverlap(circle, rect) {
    const cx = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.h));
    const dx = circle.cx - cx;
    const dy = circle.cy - cy;
    return (dx * dx + dy * dy) < (circle.r * circle.r);
}

export function pushOutAABB(moverBounds, obstacleBounds) {
    const overlapX1 = (moverBounds.x + moverBounds.w) - obstacleBounds.x;
    const overlapX2 = (obstacleBounds.x + obstacleBounds.w) - moverBounds.x;
    const overlapY1 = (moverBounds.y + moverBounds.h) - obstacleBounds.y;
    const overlapY2 = (obstacleBounds.y + obstacleBounds.h) - moverBounds.y;

    const minOverlapX = overlapX1 < overlapX2 ? -overlapX1 : overlapX2;
    const minOverlapY = overlapY1 < overlapY2 ? -overlapY1 : overlapY2;

    if (Math.abs(minOverlapX) < Math.abs(minOverlapY)) {
        return { dx: minOverlapX, dy: 0 };
    } else {
        return { dx: 0, dy: minOverlapY };
    }
}

export function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

export function angleDiff(a, b) {
    return normalizeAngle(b - a);
}

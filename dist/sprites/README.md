# Sprite Atlas

## Structure

This directory contains the sprite atlas for Outlook-styled calendar elements.

### Files
- `outlook_sprites.json` - Texture atlas definition
- `outlook_sprites.png` - Sprite sheet image (to be generated)

### Frame Definitions

| Frame | Size | Purpose |
|-------|------|---------|
| `bg_grid` | 900×560 | Calendar grid background |
| `frame_outer` | 940×600 | Outer frame/shadow |
| `event_15` | 320×22 | 15-minute meeting block |
| `event_30` | 320×38 | 30-minute meeting block |
| `event_45` | 320×54 | 45-minute meeting block |
| `event_60` | 320×70 | 60-minute meeting block |
| `time_rule` | 900×1 | Hour divider line |
| `day_header` | 160×28 | Day column header |

## Generating the Sprite Sheet

### Using TexturePacker

1. Export individual PNGs for each element to `assets/outlook/`
2. Run the packing command:

```bash
TexturePacker \
  --format json-hash \
  --sheet public/sprites/outlook_sprites.png \
  --data public/sprites/outlook_sprites.json \
  --max-width 2048 --max-height 2048 \
  --allow-free-size \
  --padding 2 \
  --shape-padding 2 \
  --dpi 72 \
  assets/outlook/*.png
```

### Design Guidelines

**Event Blocks:**
- Rounded corners: 6px radius
- Inner stroke: 1px, #e0e6ef
- White highlight on top edge
- Soft drop shadow
- Neutral blue fill (will be tinted in code)

**Grid Background:**
- Very light grid lines (#e8eef8 verticals, #eef2f9 hour rows)
- White base fill (#fafbfc)

**Frame Outer:**
- 8px rounded corners
- White (#ffffff) with 8% opacity drop shadow

## Usage in Code

```typescript
// Preload
this.load.atlas('ui', '/sprites/outlook_sprites.png', '/sprites/outlook_sprites.json');

// Create
this.add.image(450, 300, 'ui', 'bg_grid');

// Meeting blocks
const key = durationMinutes <= 15 ? 'event_15' :
            durationMinutes <= 30 ? 'event_30' :
            durationMinutes <= 45 ? 'event_45' : 'event_60';
const block = this.add.image(x, y, 'ui', key);
block.setTint(0x4caf50); // Apply meeting type color
```

## Current Status

⚠️ **Note:** The PNG sprite sheet is not yet generated. The game currently uses code-drawn graphics.
To enable sprite-based rendering, generate the PNG using the steps above.


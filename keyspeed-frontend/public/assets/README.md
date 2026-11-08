# KeySpeed Car Assets

This directory holds optional custom PNG sprites for the pseudo-3D "Car Race" game.

## Expected File Specifications

| Filename | Description | Recommended Dimensions | Format |
|---|---|---|---|
| `cars/car-1.png` | Player 1 / Own Car (Rear View) | 320 x 180 px (or 16:9 ratio) | Transparent PNG (RGBA) |
| `cars/car-2.png` | Player 2 / Opponent 1 (Rear View) | 320 x 180 px (or 16:9 ratio) | Transparent PNG (RGBA) |
| `cars/car-3.png` | Player 3 / Opponent 2 (Rear View) | 320 x 180 px (or 16:9 ratio) | Transparent PNG (RGBA) |
| `cars/car-4.png` | Player 4 / Opponent 3 (Rear View) | 320 x 180 px (or 16:9 ratio) | Transparent PNG (RGBA) |
| `cars/car-1-brake.png` | *(Optional)* Car 1 with brake lights illuminated | 320 x 180 px | Transparent PNG (RGBA) |

## Procedural Fallback Engine

If any of these image files are missing, the game canvas automatically renders a vector-procedural sports car with:
- Aerodynamic bodywork styled with theme tokens (`var(--accent)` for player, `var(--fg)` opacities for opponents)
- High-mounted racing spoiler and rear aerodynamic diffuser
- Tinted rear window cockpit
- Dual circular LED taillights and brake lights
- Twin polished chrome exhaust pipes with dynamic flame jets
- Wide rubber tires with drop shadow

No assets are required for the game to function properly.

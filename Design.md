# 🎨 Design System & Visual Specification — FloodSafe

> **Aesthetic Vision**: FloodSafe employs a high-contrast **Modern Tech Dark & Minimalist Executive** design language. Designed for emergency operation centers, the interface emphasizes high-urgency legibility, dark-matter cartographic clarity, and clean data density without cognitive overload.

---

## 1. Color Palette & Design Tokens

### 1.1 Core Brand & Canvas Tokens
All color tokens are implemented as pure CSS Custom Properties in `frontend/src/index.css`.

| Token Name | Hex Code | Visual Swatch Role | Purpose & Usage |
| :--- | :---: | :--- | :--- |
| `--bg-app` | `#0B132B` | 🟦 Deep Abyssal Navy | Primary application canvas background (Dark Mode) |
| `--surface` | `#162238` | 🟦 Elevated Navy | Secondary surface and container background |
| `--panel` | `#1E293B` | 🟦 Slate Card Surface | High-level interactive cards, modals, and drawers |
| `--tint` | `#0F1E36` | 🟦 Deep Tint | Subtle inset panels, code blocks, and table headers |
| `--line-card` | `#334155` | ⬜ Slate Border | 1px clean container hairline borders |
| `--brand` | `#00B4D8` | 🩵 Electric Water Cyan | Primary interactive accent, button fills, active tabs |
| `--brand-text` | `#38BDF8` | 🩵 Sky Azure | Primary branded text, active links, and eyebrow tags |
| `--ink` | `#FFFFFF` | ⬜ Crisp White | Main headers ($H1$, $H2$, $H3$) and primary metric figures |
| `--ink-body` | `#CBD5E1` | ⬜ Cool Light Gray | High-contrast body text and explanations |
| `--ink-muted` | `#94A3B8` | ⬜ Slate Gray | Secondary captions, timestamps, and labels |

### 1.2 Severity & Risk Band Tokens

| Risk Level | Token | Hex | Visual Meaning |
| :--- | :--- | :---: | :--- |
| **Very High Risk** | `--danger` | `#EF4444` | Sources requiring immediate priority testing ($Score \ge 0.70$) |
| **High Risk** | `--warning` | `#F59E0B` | Elevated vulnerability sources ($0.50 \le Score < 0.70$) |
| **Moderate Risk** | `--info` | `#38BDF8` | Lower vulnerability sources ($0.30 \le Score < 0.50$) |
| **Low Risk / Safe** | `--success` | `#10B981` | Stable water points ($Score < 0.30$) |
| **Cedar Forbid** | `--danger-bg` | `rgba(239, 68, 68, 0.12)` | Strict authorization denial and safety boundary alerts |

---

## 2. Typography Hierarchy

### 2.1 Font Families
* **Primary Sans-Serif**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, sans-serif.
* **Monospace & Telemetry**: `"JetBrains Mono"`, `"Fira Code"`, `SFMono-Regular`, `Consolas`, monospace.

### 2.2 Scale & Hierarchy

| Element | Size | Weight | Line Height | Case / Spacing |
| :--- | :---: | :---: | :---: | :--- |
| **Page Hero H1** | `32px` | `700` (Bold) | `1.2` | Normal |
| **Section Header H2** | `24px` | `600` (Semi-Bold) | `1.3` | Normal |
| **Card Title H3** | `18px` | `600` (Semi-Bold) | `1.3` | Normal |
| **Large KPI Metric** | `42px` | `700` (Bold) | `1.0` | Monospace numbers |
| **Body Text** | `14px` | `400` (Regular) | `1.6` | Normal |
| **Eyebrow Header** | `11px` | `700` (Bold) | `1.0` | `UPPERCASE` / `letter-spacing: 0.08em` |
| **Table & Code** | `12.5px` | `400` (Regular) | `1.5` | Monospace |

---

## 3. UI Component Patterns

### 3.1 Eyebrow Status Badges
Every major card features a high-visibility uppercase eyebrow lockup with an illuminated pulsing dot:
```html
<div class="mono-eyebrow">
  <span class="dot"></span>
  <span>AWS CEDAR ZERO-TRUST ARCHITECTURE</span>
</div>
```

### 3.2 Card Containers
* **Border Radius**: `--radius-container: 10px`
* **Hairline Border**: `1px solid var(--line-card)`
* **Backdrop**: Subtle ambient dark blur with high-contrast text to prevent glare in darkened field vehicles.

### 3.3 Cartographic Map Styling
* **Base Layer**: CartoDB Dark Matter / Alidade Smooth Dark vector tiles.
* **Flood Inundation Contours**: Translucent cyan-tinted polygons (`rgba(0, 180, 216, 0.25)` fill with glowing `1.5px` stroke).
* **Water Source Markers**: Circular SVG pins with dynamic pulse animations on `Very High` priority targets.
* **Coverage Buffers**: $500\text{m}$ radius geodesic circles rendered in translucent azure (`rgba(56, 189, 248, 0.15)`), visually showing non-overlapping coverage.

### 3.4 Interactive Cedar Studio Role Switcher
* Top-right header buttons representing the 4 system identities:
  * `[VIEWER]` (Read-only grey)
  * `[OPERATOR]` (Active cyan)
  * `[FIELD RECORDER]` (Amber)
  * `[ADMIN]` (Purple / Crimson)
* Instant feedback: Every button click updates request headers, re-evaluates permissions, and displays Cedar diagnostics in real time.

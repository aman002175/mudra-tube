# 💎 Mudra Tube Design System: Liquid Glassmorphic Light Sky

> **Theme Definition**: Ultra-modern, mobile-app native experience featuring translucent liquid glassmorphism, ethereal light sky blue gradients, specular reflections, and physical tactile buttons with spring responsiveness.

---

## 1. Aesthetic Vision & Metaphor

The **Liquid Glassmorphism** design treats interface elements as dynamic, semi-liquid glass sheets floating atop a living, atmospheric sky background:
- **Depth & Refraction**: Multiple blurred layers with varying backdrop opacities (`backdrop-blur-md` to `backdrop-blur-2xl`) emulate translucent optical glass.
- **Specular Highlights**: 1px crisp, semi-transparent top and left borders (`rgba(255, 255, 255, 0.65)`) evoke sunlight catching the polished bevel of real glass.
- **Tactile Mobile Feel**: Buttons are not flat rectangles; they possess subtle physical weight, soft ambient dropshadows, top highlights, and dynamic compression (`scale-95` + haptic feedback) mimicking a native mobile application.

---

## 2. Color Palette (Light Sky Palette)

```
       [Sky White]       [Frost Light Sky]     [Sky Azure]      [Liquid Cyan]     [Sky Navy Text]
       #FFFFFF           #E0F2FE               #38BDF8          #0284C7           #0F172A
       (Glass/Highlight) (Subtle Tint)         (Primary Accent) (Deep Action)     (High Contrast Text)
```

### Color Tokens

| Token Name | Hex / RGBA Code | Usage |
| :--- | :--- | :--- |
| `sky-bg-gradient-from` | `#F0F9FF` (`rgb(240, 249, 255)`) | Top gradient starting tone (Clean Morning Sky) |
| `sky-bg-gradient-to` | `#BAE6FD` (`rgb(186, 230, 253)`) | Bottom gradient terminus (Pastel Sky) |
| `glass-surface-base` | `rgba(255, 255, 255, 0.45)` | Standard card background with backdrop blur |
| `glass-surface-elevated` | `rgba(255, 255, 255, 0.70)` | Elevated floating panels, bottom sheets, modals |
| `glass-border-specular` | `rgba(255, 255, 255, 0.80)` | 1px top/left specular rim light |
| `glass-border-subtle` | `rgba(186, 230, 253, 0.40)` | Outer card perimeter border |
| `sky-primary` | `#0284C7` / `#0EA5E9` | Main brand call-to-actions, badges, and progress |
| `sky-glow` | `rgba(56, 189, 248, 0.35)` | Ambient blur behind balance cards and primary buttons |
| `text-headline` | `#0C4A6E` | Rich Sky Navy for high contrast, legible typography |
| `text-body` | `#1E293B` | Charcoal Slate for readable task instructions |
| `text-muted` | `#64748B` | Subtle gray for timestamps and auxiliary info |
| `state-success` | `#10B981` | Completed task status, verified checks |
| `state-warning` | `#F59E0B` | Pending withdrawal request badge |
| `state-danger` | `#EF4444` | Rejected status, error messages |

---

## 3. Glassmorphism Elevation Levels

```
Level 0: Living Sky Canvas (Radial mesh gradient + soft fluid cloud orbs)
   ↓
Level 1: Glass Container (`backdrop-blur-xl`, `bg-white/40`, `border-white/50`)
   ↓
Level 2: Interactive Floating Card (`backdrop-blur-lg`, `bg-white/60`, `shadow-sky-200/50`)
   ↓
Level 3: Tactile Action Button (`bg-gradient-to-r from-sky-400 to-sky-600`, `shadow-lg`)
   ↓
Level 4: Modal & Bottom Sheet (`backdrop-blur-2xl`, `bg-white/85`, `shadow-2xl`)
```

---

## 4. Button Geometry & Tactile Physics (Mobile App Native)

Buttons are engineered to simulate physical glass buttons with instant haptic and optical feedback.

### A. Primary Action Button ("Liquid Capsule")
- **Shape**: Squircle or Smooth Pill (`rounded-2xl` or `rounded-full`).
- **Gradient**: `bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600`.
- **Specular Sheen**: Inner top border `border-t border-white/60` and subtle gloss overlay.
- **Physical Depth**:
  - `box-shadow: 0 4px 14px -1px rgba(14, 165, 233, 0.45), 0 2px 4px -1px rgba(14, 165, 233, 0.25)`
  - Active Press: `active:scale-[0.97] active:translate-y-0.5 active:shadow-sm`
- **Haptic Integration**:
  ```javascript
  const triggerHaptic = (style = 'medium') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  };
  ```

### B. Secondary Glass Button ("Frosted Pill")
- **Shape**: `rounded-2xl`
- **Background**: `bg-white/50 hover:bg-white/70 active:bg-white/80`
- **Border**: `border border-white/70`
- **Backdrop**: `backdrop-blur-md`
- **Text**: `text-sky-900 font-semibold`

### C. State-Locked Button ("Verified / Done")
- **Shape**: `rounded-2xl`
- **Background**: `bg-slate-200/60 text-slate-500 cursor-not-allowed`
- **Icon**: Checkmark circle with subtle matte surface.

---

## 5. Core Component Specs

### 5.1 The Liquid Balance Card
The crown visual element on the home screen:
- Liquid mesh glow behind card: `radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.4), transparent 70%)`
- Card background: `bg-gradient-to-br from-white/70 via-white/45 to-sky-100/30`
- Border: `border border-white/80`
- Inner elements:
  - Big coin counter with golden shimmer / sky iridescent coin icon
  - Instant conversion ticker: `≈ ₹XX.XX INR | 0.XXXX TON`
  - Quick action buttons (Withdraw, History, Boost)

### 5.2 Task Item Card
- Translucent container with soft hover/tap glow:
  - `bg-white/55 backdrop-blur-md border border-white/70`
  - Left Icon: Circular avatar with glowing glass ring
  - Center: Channel name / task title, reward badge (`+50 Coins`)
  - Right: Tactile pill button (`Join` $\rightarrow$ `Verify` $\rightarrow$ `✓ Completed`)

### 5.3 Bottom Floating Navigation Pill (Docked App Bar)
Mimics native iOS/Android floating navigation:
- Fixed to bottom viewport with safe-area spacing: `pb-[env(safe-area-inset-bottom,16px)]`
- Frosted dock container: `mx-4 mb-3 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-lg shadow-sky-900/10`
- Tab Items:
  1. 🏠 **Home** (Balance & Active Tasks)
  2. 🎁 **Offerwalls** (CPA Surveys & Installs)
  3. 📢 **Promote** (Channel Ad Packages)
  4. 💳 **Wallet** (UPI / TON Withdrawals)
  5. 👤 **Profile** (Stats, Referral, Settings)

### 5.4 Withdrawal Modal Sheet
- Bottom-up slide drawer with translucent overlay (`bg-slate-900/30 backdrop-blur-sm`).
- Modal card: `rounded-t-[32px] bg-white/90 backdrop-blur-2xl border-t border-white/90`.
- Drag indicator handle: `w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3`.
- Tabbed selector for payout modes:
  - **UPI** (`@paytm`, `@okaxis`, `@ybl`, etc.)
  - **TON / TonKeeper** (Web3 Ton Connect or direct wallet input)

---

## 6. CSS & Tailwind Code Snippets

```css
/* Custom CSS utilities for Liquid Glassmorphic Light Sky */

@layer utilities {
  /* Liquid Canvas Background */
  .liquid-sky-bg {
    background: radial-gradient(at 10% 20%, rgba(186, 230, 253, 0.8) 0px, transparent 50%),
                radial-gradient(at 90% 10%, rgba(224, 242, 254, 0.9) 0px, transparent 50%),
                radial-gradient(at 50% 80%, rgba(125, 211, 252, 0.6) 0px, transparent 60%),
                #F0F9FF;
  }

  /* Glass Surface Card */
  .glass-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 10px 30px -5px rgba(2, 132, 199, 0.08),
                0 4px 6px -2px rgba(2, 132, 199, 0.04);
  }

  /* Specular Highlight Rim */
  .specular-rim {
    box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
  }

  /* Mobile App Tactile Button */
  .btn-tactile-sky {
    background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35),
                inset 0 1px 1px rgba(255, 255, 255, 0.6);
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-tactile-sky:active {
    transform: scale(0.96) translateY(2px);
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25),
                inset 0 1px 0 rgba(0, 0, 0, 0.1);
  }
}
```

---

## 7. Mobile Viewport & Telegram Ergonomics

1. **Full Height Clamp**: Prevent unwanted browser scrolling using `min-h-[100dvh]` and `overscroll-none`.
2. **Safe Area Insets**: Accommodate Telegram top headers and mobile bottom home indicators:
   ```css
   padding-top: max(env(safe-area-inset-top), 12px);
   padding-bottom: max(env(safe-area-inset-bottom), 16px);
   ```
3. **No-Select & Fast-Click**: Disable text-selection across UI elements to preserve native application ergonomics (`select-none touch-manipulation`).

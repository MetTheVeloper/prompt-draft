این پروژه یک پرامپت‌ساز ماژولار برای تولید پرامپت‌های دقیق، قابل کنترل و قابل استفاده در ابزارهای هوش مصنوعی تصویری است. کاربر به‌جای نوشتن یک متن خام و پراکنده، می‌تواند ایده‌ی اصلی خود را وارد کند و سپس جزئیات خروجی را از طریق ماژول‌های تخصصی مثل سبک بصری، پس‌زمینه، نورپردازی، دوربین، کادربندی، ژست، چهره، مو، لباس، بافت، افکت‌ها، رنگ‌بندی و تایپوگرافی تنظیم کند. نتیجه‌ی این ساختار، پرامپتی تمیزتر، قابل پیش‌بینی‌تر و مناسب‌تر برای تولید تصویرهای حرفه‌ای است.

هسته‌ی پرامپت‌ساز به‌صورت داینامیک طراحی شده و خروجی می‌تواند بسته به نیاز کاربر در حالت‌های مختلف ساخته شود؛ از جمله پرامپت ماژولار، پرامپت طبیعی‌تر و خروجی ساختاریافته. سیستم از متغیرها پشتیبانی می‌کند تا کاربر بتواند مقادیر قابل تغییر مثل نام محصول، رنگ، موضوع، متن تبلیغاتی یا ویژگی‌های سوژه را یک‌بار تعریف کند و در بخش‌های مختلف پرامپت به‌صورت یکپارچه از آن‌ها استفاده کند. این موضوع مخصوصاً برای ساخت قالب‌های تکرارپذیر، کمپین‌های تصویری، تست ایده‌های مختلف و تولید چندین خروجی با یک ساختار ثابت بسیار کاربردی است.

پرامپت‌ساز فقط به توصیف ساده‌ی تصویر محدود نیست و برای کنترل دقیق‌تر خروجی، بخش‌هایی مثل پالت رنگ، قوانین اختصاص رنگ، تایپوگرافی چندگروهی، نسبت تصویر، ورودی تصویر مرجع و شدت تبدیل را هم در نظر می‌گیرد. به همین دلیل کاربر می‌تواند هم برای ساخت تصویر از صفر و هم برای تبدیل یا بازآفرینی یک تصویر مرجع، پرامپت‌های دقیق‌تری بسازد. هدف اصلی پروژه این است که فرآیند پرامپت‌نویسی را از یک کار حدسی و پراکنده، به یک سیستم قابل مدیریت، توسعه‌پذیر و قابل تکرار تبدیل کند.

ماژول‌های اصلی پرامپت‌ساز:

* `background` — کنترل فضای پشت سوژه، محیط، صحنه و حس کلی پس‌زمینه.
* `camera` — تنظیم زاویه دید، نوع لنز، فاصله دوربین و حس تصویربرداری.
* `colorPalette` — تعریف پالت رنگ، رنگ‌های غالب و قوانین اختصاص رنگ به بخش‌های مختلف تصویر.
* `deformation` — کنترل تغییر شکل، اغراق، اعوجاج یا استایلایز کردن فرم سوژه.
* `effects` — افزودن افکت‌های بصری مثل ذرات، درخشش، مه، نویز، انرژی یا جلوه‌های سینمایی.
* `expression` — تنظیم حالت چهره، احساسات و شدت بیان احساسی سوژه.
* `framing` — کنترل ترکیب‌بندی، جای‌گیری سوژه، فاصله از کادر و تمرکز بصری تصویر.
* `hair` — تعریف مدل، رنگ، جنس، حالت و جزئیات موی سوژه.
* `lighting` — کنترل نورپردازی، جهت نور، شدت، کنتراست، حال‌وهوا و کیفیت نور.
* `outfit` — توصیف لباس، استایل پوشش، متریال، رنگ و جزئیات ظاهری سوژه.
* `pose` — تعیین ژست، حالت بدن، حرکت، انرژی و نحوه قرارگیری سوژه.
* `style` — انتخاب مدیوم، سبک هنری، کیفیت رندر، فضای بصری و زبان کلی تصویر.
* `texture` — کنترل جنس سطوح، بافت‌ها، جزئیات لمسی و کیفیت متریال‌ها.
* `typography` — ساخت و مدیریت متن‌های داخل تصویر، گروه‌های متنی، فونت، چیدمان و استایل تایپوگرافی.
* `variables` — تعریف متغیرهای قابل استفاده مجدد برای ساخت پرامپت‌های داینامیک، قابل تغییر و قالب‌پذیر.

نمونه‌هایی از پرامپت‌های ماژولار با استفاده از متغیرها:

**نمونه ۱ — پوستر تبلیغاتی محصول**

متغیرهای فرضی:

* `{productName}` = Aurora Watch
* `{mainColor}` = deep blue
* `{accentColor}` = electric cyan
* `{slogan}` = Time, Reimagined

پرامپت ماژولار:

```txt
[idea]
Create a premium advertising poster for {productName}, presenting it as a futuristic luxury product.

[style]
High-end cinematic product photography, polished commercial look, premium tech aesthetic, ultra-detailed render.

[background]
A clean radial gradient background starting from the center, using {mainColor} as the dominant color with subtle atmospheric depth.

[colorPalette]
Use {mainColor} as the overall background color and {accentColor} for highlights, rim lights, interface glows, and small visual accents.

[lighting]
Dramatic studio lighting with soft reflections, controlled highlights, glossy edges, and a refined luxury mood.

[framing]
Place {productName} in the center of the composition as the main focal point, with enough negative space around it for typography.

[typography]
Add the text "{slogan}" around the product in a clean orbital composition, readable and slightly integrated behind parts of the product.

[effects]
Subtle glowing particles, soft light streaks, and minimal futuristic interface details around the product.
```

**نمونه ۲ — پرتره کاراکتر فانتزی**

متغیرهای فرضی:

* `{characterName}` = Elara
* `{emotion}` = calm confidence
* `{hairColor}` = silver white
* `{magicColor}` = violet
* `{environment}` = ancient forest temple

پرامپت ماژولار:

```txt
[idea]
Create a fantasy character portrait of {characterName}, a mysterious guardian standing inside {environment}.

[style]
Epic fantasy illustration, semi-realistic digital painting, rich details, cinematic fantasy atmosphere.

[expression]
The character should show {emotion}, with a focused gaze and a subtle emotional depth.

[hair]
Long flowing {hairColor} hair, slightly moving with magical wind, detailed strands and soft highlights.

[outfit]
Elegant fantasy armor mixed with ritual fabric, detailed ornaments, layered materials, and handcrafted metallic elements.

[background]
Place the character inside {environment}, with ancient stone structures, overgrown plants, and mystical symbols.

[lighting]
Soft magical lighting coming from below and behind the character, using {magicColor} as the main glow color.

[effects]
Add controlled magical particles, floating runes, and a soft {magicColor} aura around the hands and shoulders.

[framing]
Medium portrait framing, character centered, strong silhouette, background visible but not distracting.
```

**نمونه ۳ — تصویر برندینگ برای نوشیدنی**

متغیرهای فرضی:

* `{brandName}` = Citrus Nova
* `{flavor}` = orange mint
* `{primaryColor}` = fresh orange
* `{secondaryColor}` = mint green
* `{campaignText}` = Fresh Energy in Every Sip

پرامپت ماژولار:

```txt
[idea]
Create a vibrant commercial image for {brandName}, a modern drink with {flavor} flavor.

[style]
Modern beverage advertising, clean studio composition, energetic summer mood, sharp and refreshing visual language.

[background]
Use a bright minimal background with soft gradients, liquid reflections, and a fresh atmosphere inspired by {primaryColor} and {secondaryColor}.

[colorPalette]
Use {primaryColor} as the dominant color and {secondaryColor} for secondary accents, splashes, leaves, highlights, and typography details.

[texture]
Emphasize cold condensation on the can, glossy aluminum texture, fresh fruit slices, ice cubes, and crisp water droplets.

[framing]
Place the drink can in the center, slightly low-angle, with dynamic splashes and fruit elements arranged around it.

[typography]
Add the campaign text "{campaignText}" in bold modern typography, placed behind and around the product without covering the brand name.

[effects]
Fresh liquid splash, flying mint leaves, orange slices, tiny bubbles, and energetic motion details.
```

**نمونه ۴ — صحنه سایبرپانک با سوژه انسانی**

متغیرهای فرضی:

* `{subject}` = street hacker
* `{cityName}` = Neo Tehran
* `{neonColor}` = magenta
* `{secondaryNeon}` = acid green
* `{mood}` = tense and rebellious

پرامپت ماژولار:

```txt
[idea]
Create a cinematic cyberpunk scene featuring a {subject} walking through the rainy streets of {cityName}.

[style]
Cyberpunk cinematic concept art, high contrast, neon noir atmosphere, detailed urban sci-fi environment.

[background]
A dense futuristic street in {cityName}, filled with holographic signs, wet asphalt, narrow alleys, and layered city lights.

[lighting]
Strong neon lighting using {neonColor} as the main glow and {secondaryNeon} as secondary highlights, reflected on rain and metal surfaces.

[outfit]
The {subject} wears a dark techwear jacket, utility straps, glowing accessories, and worn futuristic materials.

[pose]
Confident walking pose, slightly turned body, one hand holding a compact device, strong rebellious attitude.

[expression]
The face should communicate a {mood} feeling, with focused eyes and subtle tension.

[camera]
Low-angle cinematic shot, shallow depth of field, dramatic perspective, rain droplets visible near the lens.

[effects]
Rain, neon reflections, holographic noise, small sparks, atmospheric fog, and subtle glitch details around digital signs.
```

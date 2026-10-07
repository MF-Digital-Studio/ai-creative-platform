# Klay.ai

Takı, giyim ve kozmetik ürün fotoğraflarını kampanyaya hazır görsellere ve kısa videolara dönüştürmeye odaklanan AI kreatif platformu. Şu anda arayüz temeli, navbar ve footer bileşenleri yer alıyor.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Outfit (via `next/font/google`)

## Getting Started

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Background image jobs

Image generation runs in Trigger.dev, independently of the Next.js/Vercel request. Create a Trigger.dev project, set `TRIGGER_PROJECT_REF` and `TRIGGER_SECRET_KEY`, and copy the app's existing server-only Supabase/OpenAI/provider variables into the matching Trigger.dev environment.

Local development requires two terminals:

```bash
# Terminal A
npm run dev

# Terminal B (authenticate with Trigger.dev when first prompted)
npm run dev:trigger
```

Deploy the worker separately with `npm run deploy:trigger` (or configure Trigger.dev's GitHub integration). Vercel continues to host the web frontend and Server Actions; Trigger.dev hosts the long-running generation task. A production worker is not active until the Trigger.dev project, secrets, and deployment are configured.

## Project Structure

- `src/app`: Uygulama rotaları ve genel stiller
- `src/components`: Paylaşılan arayüz ve yerleşim bileşenleri
- `src/config`: Merkezi site yapılandırması
- `src/data`: Statik navigasyon ve içerik verileri
- `src/features`: Alan odaklı özellikler

## Development Rules

Geliştirme kuralları ve tasarım ilkeleri için kök dizindeki [AGENTS.md](AGENTS.md) dosyasını izleyin.
# Image generation model

`OPENAI_IMAGE_MODEL` overrides the image model for new generations. The default is `gpt-image-2.5-sunburst` at `xhigh` quality. Other configured models retain the established `standard` quality default. `max` is supported for explicit benchmark requests and is not the production default.

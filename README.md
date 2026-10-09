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

Image generation runs synchronously in the request and uses the canonical generation pipeline. Durable background jobs are deferred.

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

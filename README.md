[![ci](https://github.com/savsisbtw/anisav/actions/workflows/ci.yml/badge.svg)](https://github.com/savsisbtw/anisav/actions/workflows/ci.yml)

Я че умный?

# anisav

десктопное приложение для аниме, дергает AniLiberty API. electron + react + ts. дизайн строгий: чёрный, белый, тонкие линии, Inter + JetBrains Mono.

тот же интерфейс собирается и как сайт: https://anisav.savsis.xyz

каталог с фильтрами, поиск, расписание, плеер с автопропуском опенинга/эндинга и продолжением просмотра, локальный вишлист без аккаунта, вход в аккаунт если надо синк списков.

бекенд тут не при чем, все запросы идут через `api.savsis.xyz`. если он не отвечает (у некоторых провайдеров финку блочат) приложение само переключается на запасной `ani.savsis.xyz` и запоминает какой жив.

## запуск

```
npm install
npm run dev
```

## сборка

```
npm run build:win
npm run build:web
```

`build:web` кладёт сайт в `out/web`, это просто статика. на сервере рядом нужен nginx с проксёй `/api/anilibria/` на aniliberty.top.

сделано im.savsis.xyz

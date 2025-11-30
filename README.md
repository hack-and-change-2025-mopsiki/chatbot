# Мопсики. Чатбот

| <img width="1919" height="905" alt="image" src="https://github.com/user-attachments/assets/90263077-40a2-4f5b-a8f9-95786b9bb246" /> |
| :-: |
| Веб-интерфейс |


Это репозиторий для чат-бота.

Чат-бот добавляет к запросам пользователя датасет из MWS с постами и комментариями для лучшего анализа и релевантного ответа.

Этот репозиторий отвечает за:
- Сбор данных по кнопке
- Функционал чат-бота

Клиент чат-бота также имеет возможность выполнять сбор по кнопке:

| <img width="424" height="428" alt="image" src="https://github.com/user-attachments/assets/53d50a81-fc13-4eac-a2f4-c4c0be33457b" /> |
| :-: |
| Веб-интерфейс |

Сейчас поддерживается сбор только для 3-ёх платформ: Telegram, vc.ru и Habr

## Реквайрментс
- node v24+ с соответствующим npm
- Заполенный .env

## Инструкция
- Склонировать репозиторий, перейти в рабочую директорию
- Установить зависимости `npm ci`
- Сбилдить `npm run build`
- Запустить `npm run start`
- Перейти на появившийся адрес, например `http://localhost:3000/`

## Заполнение .env
- В OPENROUTER_API_KEY и MWS_API_KEY надо заполнить API-ключи соответсвующей платформы. Используется модель `z-ai/glm-4.5-air:free`, от MWS хочется текущую таблицу
- В MWS_POSTS_API_URL и MWS_COMMENTS_API_URL нужно вставить путь до `таблицы/представление`, т.е. если запрос для работы с таблицей `https://tables.mws.ru/fusion/v1/datasheets/SOME_COOL_KEY/records?viewId=THE_DIFFERENT_VIEW&fieldKey=name`, нужно вписать `SOME_COOL_KEY/THE_DIFFERENT_VIEW` 

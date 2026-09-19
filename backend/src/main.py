from http import HTTPStatus

from fastapi import FastAPI

from src.routes import router

app = FastAPI(title='API SoftTranslations')
app.include_router(router)


@app.get('/', status_code=HTTPStatus.OK)
async def status():
    return {'message': 'API is running'}

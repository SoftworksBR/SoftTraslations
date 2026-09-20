from http import HTTPStatus

from fastapi import FastAPI

from src.routes.auth_route import router as auth_route
from src.routes.user_route import router as user_route

app = FastAPI(title='API SoftTranslations')
app.include_router(auth_route)
app.include_router(user_route)


@app.get('/', status_code=HTTPStatus.OK)
async def status():
    return {'message': 'API is running'}

from fastapi import FastAPI

app = FastAPI(title="MLody API")


@app.get("/health")
def health():
    return {"status": "ok"}
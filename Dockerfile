# Build with:
#   docker build --platform linux/amd64 -t mlody-backend .

FROM public.ecr.aws/lambda/python:3.11

# Install dependencies first
COPY requirements.txt .
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Copy the backend application code
COPY backend/ ${LAMBDA_TASK_ROOT}/
CMD ["handler.lambda_handler.handler"]
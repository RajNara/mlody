# Build with:
#   docker build --platform linux/amd64 -t mlody-backend .

FROM public.ecr.aws/lambda/python:3.11

# Install dependencies first
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Copy the backend application code
COPY backend/ ${LAMBDA_TASK_ROOT}/
CMD ["lambda_handler.handler"]
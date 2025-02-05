FROM python:3.9-slim

# set the working directory in the container
WORKDIR /app

# copy the dependencies file to the working directory
COPY requirements.txt .

# install dependencies
RUN pip install -r requirements.txt

# copy the content of the local src directory to the working directory
COPY . .

# expose the port 8000
EXPOSE 8002

# command to run on container start
CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002" , "--log-level", "debug"]
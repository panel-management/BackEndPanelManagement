FROM node:20-alpine

# set the worker directory inside the container
WORKDIR /usr/src/app

COPY package*.json ./

# copy the  rest of the application
COPY . .

# install dependencies
RUN npm install -g pnpm

# install package
RUN pnpm install

# port the app runs on
EXPOSE 3000

# Command to run the app
CMD [ "pnpm", "start:dev" ]
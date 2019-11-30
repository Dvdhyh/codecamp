This is an exercise from Free Code Camp Challenge

This is a basic example for your local machine.
Using Node.js -express
Mongodb - Mongoose library

You must have installed npm.

You must have mongodb install on your os.

You can find a free download on https://www.mongodb.com/

Inside OS Environment Variables, add path to mongod's "bin" folder

Clone the repo

How to run mongoDB database?
Create a new folder with any name "e.g. data" inside your cloned folder

Inside a command prompt
Change Directory to Cloned folder cd <path>
> mongod --port 27017 --dbpath=./data

Now inside another command prompt
Change Directory to Cloned folder
>npm install

This will install all packages, including JSON database mongodb

>node app.js

Open a browser of choice
> localhost:8000/

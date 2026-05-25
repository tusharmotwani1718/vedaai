To start the app, run the following commands in different terminals:


# MAKE SURE TO UPDATE YOUR ENV VARS WITH SAMPLE ENV VARS PRVIDED AT .env.sample AT ROOT DIR

<!-- To start the docker compose. Make sure docker is installed and engine is running -->
1. docker compose up -d 

<!-- To start the app with socket server -->
2. npm run socket-server

<!-- To start the worker -->
3. npm run worker


The app would be available at http://localhost:3000



View the complete guide to start the app and demo video here:
https://youtu.be/x883KMyerEI



Approach: 

# Tools Used: 
1. Next.js -> full stack framework
2. Typescript -> static type checking
3. MongoDB -> Database
4. Redis/BullMQ -> Queue
5. Socket.io -> Realtime communication (Client - Server)
6. Open AI SDK -> LLM Integration
7. Redis/Pub-Sub -> (Server - Server) Realtime communication
8. Puppeteer -> PDF generation


# Approach:

1. Create a new assignment:

a. User inputs assignment name, due date, question types, total questions, total marks, and any additional notes or files.
b. All the inputs are passed to the agent and the agent generates the assignment.


2. Background job processor:

a. The assignment to be generated is stored in a redis queue "assignment-queue" using BullMQ.
b. The worker pulls the assignment from the queue and passes it to the agent.
c. The agent generates the assignment and stores it in a MongoDB database.
d. The notification of the assignment generated is passed via the redis pub/sub from the worker to the socker server and then to the client via socket.io


# Important Directories:

a. lib/redis -> stores worker, queue, and pub/sub for background job processing and realtime communication between worker and socket server
b. openai -> stores agent code and logic
c. models -> stores database models
d. utils -> stores utility functions
e. lib/db -> stores database connection and api utils
f. store -> store zustand stores
g. types -> stores types
h. uploads -> files uploaded for assignment inputs


# Architecture and Workflow: 
User submits assignment request
        ↓
BullMQ Queue
        ↓
AI generates assignment JSON
        ↓
Store assignment in DB
        ↓
Generate PDF using Puppeteer
        ↓
Upload PDF
        ↓
Store PDF URL
        ↓
Return assignment + downloadable PDF
# Court Reporting Workflow Manager

A simple fullstack technical assessment project for managing court reporting transcription workflows.

Overview of the application like the image below:
![Application Overview](https://github.com/user-attachments/assets/881525ed-915e-495c-a578-d11a9793c3c2)

This assesment test application is already deployed and ready to test in production. You can test at [This Link](https://court-reporting-workflow-system.vercel.app/) to test the application.

You can visit [This Link](https://drive.google.com/drive/folders/1aWiV4OezlvV-8XIIxIko_I_6ijwQIxEY?usp=sharing) to see I present and demo the application.

## Architecture

I Architected this application with hybrid approach, meaning I combined Client-side rendering with Server-side rendering produced as REST API.

![Architecture Overview](https://github.com/user-attachments/assets/bf61180d-d94f-4537-af4b-e93b6fa961a1)

## Tech Stack

- Next.js
- TypeScript
- React Client Components
- REST API using Next.js Route Handlers
- PostgreSQL
- Prisma ORM
- Zod
- Tailwind CSS

## Main Features

- Create transcription jobs
- List all jobs
- Assign reporter to a job
- Prefer same-city reporter for physical jobs
- Allow remote jobs to use any available reporter
- Assign editor after transcription
- Track job status workflow
- Calculate reporter payout per minute
- Calculate editor flat-fee payout
- Display total payout per job
- Display total payout summary
- Responsive dashboard UI

## Bonus Features

- manual reporter/editor assignment
- smart reporter recommendation based on job location and availability
- resource availability release after job completion
- unit tests for workflow transitions, reporter assignment logic, and payment calculation

## Workflow

```txt
NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED
```

---

## Getting Started to Run Locally

### Install Dependencies

```sh
npm install
```

### Adjust .env

```sh
DATABASE_URL=
```

### All in once. Build, Migrate, & Generate the schema

```sh
npm run vercel-build
```

### Start the application

```sh
npm start
```

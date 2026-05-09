# Email System

Emails are saved to the database before sending so they are never lost if the SMTP call fails.

## Prisma Schema

Add these two models (and the relation on `Email`):

```prisma
model Email {
  id                 Int               @id @default(autoincrement())
  recipient          String
  subject            String
  html               String
  sentAt             DateTime          @default(now())
  type               EmailType
  status             EmailStatus       @default(PENDING)
  errorText          String?
  retries            Int               @default(0)
  expiresAt          DateTime?
  nodeMailerResponse Json?
  attachments        EmailAttachment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model EmailAttachment {
  id          Int      @id @default(autoincrement())
  emailId     Int
  Email       Email    @relation(fields: [emailId], references: [id], onDelete: Cascade)
  filename    String
  contentType String
  data        Bytes    // stored as bytea in PostgreSQL — swap for url String when S3 is added

  createdAt DateTime @default(now())

  @@index([emailId])
}
```

Run migration after adding:

```bash
npx prisma migrate dev --name add_email_attachments
npx prisma generate
```

## NodeMailer.ts

Export the `EmailAttachment` interface and add an optional `attachments` parameter to `sendMail`:

```ts
export interface EmailAttachment {
    filename: string;
    data: Buffer;
    contentType: string;
}

export async function sendMail(
    to: string,
    subject: string,
    html: string,
    type: EmailType,
    attachments?: EmailAttachment[],
) {
    const email = await prisma.email.create({
        data: {
            // ...existing fields...
            attachments: attachments
                ? {
                      create: attachments.map((a) => ({
                          filename: a.filename,
                          contentType: a.contentType,
                          data: a.data,
                      })),
                  }
                : undefined,
        },
    });

    await mailer.sendMail({
        // ...existing fields...
        attachments: attachments?.map((a) => ({
            filename: a.filename,
            content: a.data,
            contentType: a.contentType,
        })),
    });
}
```

## Usage

```ts
import { readFileSync } from 'fs';
import path from 'path';
import { sendMail } from './NodeMailer';

const pdf = readFileSync(path.join(process.cwd(), 'public/static/pdfs/returnPolicy.pdf'));

await sendMail(to, subject, html, 'INVOICE', [
    { filename: 'Widerrufsbelehrung.pdf', data: pdf, contentType: 'application/pdf' },
]);
```

## Migrating to S3 later

Replace `data Bytes` in `EmailAttachment` with `url String`, remove the `create` nesting in `sendMail`, upload the buffer to S3 first and store the URL instead. The nodemailer call stays identical — just pass `{ filename, content: buffer, contentType }`.

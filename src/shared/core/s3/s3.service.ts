import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import config from '@/shared/config/config.js';

/* ===================================================
   Setup
=================================================== */

const bucketName = config.aws.bucketName;

if (!bucketName) throw new Error('AWS bucket name missing');

const s3Client = new S3Client({
  region: config.aws.region,
});

/* ===================================================
   COMMON HELPERS (DRY)
=================================================== */

const generateKey = ({ folder, fileName, userId }: { folder?: string; fileName: string; userId?: string }) => {
  const id = uuidv4();

  const key = userId ? `${folder}/${userId}/${fileName}` : `${folder}/${id}-${fileName}`;

  return { key, id };
};

const createPutCommand = ({ key, contentType, body }: { key: string; contentType: string; body?: Buffer }) =>
  new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Body: body,
  });

const getSigned = (command: PutObjectCommand | GetObjectCommand, expiresIn = 3600) =>
  getSignedUrl(s3Client, command, { expiresIn });

const getPublicUrl = (key: string) => `https://${bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

/* ===================================================
   1️⃣ Generate Presigned Upload URL
=================================================== */

interface GeneratePresignedUrlParams {
  schema: string;
  fileName: string;
  userId?: string;
  contentType: string;
}

export const generatePresignedUrl = async ({ schema, fileName, userId, contentType }: GeneratePresignedUrlParams) => {
  const { key, id } = generateKey({
    folder: schema,
    fileName,
    userId,
  });

  const command = createPutCommand({
    key,
    contentType,
  });

  const url = await getSigned(command);

  return { url, key, id };
};

/* ===================================================
   2️⃣ Server Upload (PDF or ANY FILE)
=================================================== */

export const uploadFileToS3 = async ({
  buffer,
  fileName,
  folder,
  contentType,
}: {
  buffer: Buffer;
  fileName: string;
  folder: string;
  contentType: string;
}) => {
  const { key } = generateKey({
    folder,
    fileName,
  });

  const uploadCommand = createPutCommand({
    key,
    contentType,
    body: buffer,
  });

  await s3Client.send(uploadCommand);

  // const url = await getSigned(createGetCommand(key));

  const downloadUrl = getPublicUrl(key);

  return {
    key,
    url: downloadUrl,
  };
};
